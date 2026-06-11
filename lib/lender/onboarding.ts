import { PrismaClient, Role } from "@prisma/client";
import { z } from "zod";

export const lenderOnboardingSchema = z.object({
  coverage: z.object({
    ficoMin: z.number().int().min(300).max(850),
    loanMax: z.number().int().min(50_000).max(5_000_000),
    loanMin: z.number().int().min(50_000).max(5_000_000),
    ltvMaxBp: z.number().int().min(1000).max(10_000),
    products: z.array(z.string().min(2)).min(1),
    purposes: z.array(z.string().min(2)).min(1),
    states: z.array(z.string().length(2)).min(1),
  }),
  dba: z.string().max(120).optional(),
  invites: z.array(z.string().email()).max(10).default([]),
  legalName: z.string().min(2),
  nmlsId: z.string().regex(/^\d{4,10}$/),
  orgAdminEmail: z.string().email(),
  plan: z.enum(["STARTER", "PRO", "BRANCH"]),
  statesLicensed: z.array(z.string().length(2)).min(1),
});

export type LenderOnboardingInput = z.infer<typeof lenderOnboardingSchema>;

export class LenderOnboardingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

export async function createPendingLenderOrg(
  db: PrismaClient,
  input: LenderOnboardingInput,
) {
  const parsed = lenderOnboardingSchema.parse(input);
  const adminEmail = parsed.orgAdminEmail.toLowerCase();

  return db.$transaction(async (tx) => {
    const existingOrg = await tx.lenderOrg.findUnique({
      select: { id: true },
      where: { nmlsId: parsed.nmlsId },
    });

    if (existingOrg) {
      throw new LenderOnboardingError(
        "A lender application for this NMLS ID already exists.",
        "NMLS_ALREADY_SUBMITTED",
        409,
      );
    }

    const existingAdmin = await tx.user.findUnique({
      select: {
        lenderUser: {
          select: { id: true },
        },
      },
      where: { clerkId: `lender-onboarding:${adminEmail}` },
    });

    if (existingAdmin?.lenderUser) {
      throw new LenderOnboardingError(
        "A lender application for this org admin email already exists.",
        "ADMIN_EMAIL_ALREADY_SUBMITTED",
        409,
      );
    }

    const user = await tx.user.upsert({
      create: {
        clerkId: `lender-onboarding:${adminEmail}`,
        role: Role.LENDER,
      },
      update: { role: Role.LENDER },
      where: { clerkId: `lender-onboarding:${adminEmail}` },
    });

    const org = await tx.lenderOrg.create({
      data: {
        dba: parsed.dba,
        legalName: parsed.legalName,
        nmlsId: parsed.nmlsId,
        statesLicensed: parsed.statesLicensed,
        status: "PENDING",
      },
    });

    await tx.lenderUser.upsert({
      create: {
        lenderOrgId: org.id,
        orgRole: "ORG_ADMIN",
        userId: user.id,
      },
      update: {
        lenderOrgId: org.id,
        orgRole: "ORG_ADMIN",
      },
      where: { userId: user.id },
    });

    await tx.coverageBox.upsert({
      create: {
        ficoMin: parsed.coverage.ficoMin,
        lenderOrgId: org.id,
        loanMax: parsed.coverage.loanMax,
        loanMin: parsed.coverage.loanMin,
        ltvMaxBp: parsed.coverage.ltvMaxBp,
        products: parsed.coverage.products,
        purposes: parsed.coverage.purposes,
        states: parsed.coverage.states,
      },
      update: {
        ficoMin: parsed.coverage.ficoMin,
        loanMax: parsed.coverage.loanMax,
        loanMin: parsed.coverage.loanMin,
        ltvMaxBp: parsed.coverage.ltvMaxBp,
        products: parsed.coverage.products,
        purposes: parsed.coverage.purposes,
        states: parsed.coverage.states,
      },
      where: { lenderOrgId: org.id },
    });

    await tx.creditWallet.upsert({
      create: {
        balance: 0,
        lenderOrgId: org.id,
        plan: parsed.plan,
      },
      update: { plan: parsed.plan },
      where: { lenderOrgId: org.id },
    });

    for (const inviteEmail of parsed.invites) {
      await tx.lenderInvite.upsert({
        create: {
          email: inviteEmail.toLowerCase(),
          lenderOrgId: org.id,
          role: "LO",
        },
        update: { status: "PENDING" },
        where: {
          lenderOrgId_email: {
            email: inviteEmail.toLowerCase(),
            lenderOrgId: org.id,
          },
        },
      });
    }

    await tx.auditLog.create({
      data: {
        action: "lender.onboarding_submitted",
        actorUserId: user.id,
        entity: "LenderOrg",
        entityId: org.id,
        meta: {
          invites: parsed.invites.length,
          nmlsId: parsed.nmlsId,
          plan: parsed.plan,
          status: "PENDING",
        },
      },
    });

    return org;
  });
}
