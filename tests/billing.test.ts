import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  BILLING_REASONS,
  grantCredits,
  reconcileWallet,
} from "../lib/services/billing";

process.env.DATABASE_URL ??=
  "postgresql://vierates:vierates@localhost:54329/vierates?schema=public";

const prisma = new PrismaClient();

describe("billing ledger", () => {
  it("grants credits idempotently from billing events", async () => {
    const suffix = String(Date.now());
    const org = await prisma.lenderOrg.create({
      data: {
        legalName: `Billing Lender ${suffix}`,
        nmlsId: `6${suffix.slice(-7)}`,
        statesLicensed: ["IL"],
        status: "APPROVED",
      },
    });
    await prisma.creditWallet.create({
      data: {
        balance: 0,
        lenderOrgId: org.id,
        plan: "PRO",
      },
    });

    const input = {
      credits: 25,
      idempotencyKey: `stripe:${suffix}`,
      lenderOrgId: org.id,
      reason: BILLING_REASONS.GRANT,
      stripeRef: `evt_${suffix}`,
    } as const;
    const first = await grantCredits(prisma, input);
    const second = await grantCredits(prisma, input);
    const wallet = await prisma.creditWallet.findUnique({
      where: { lenderOrgId: org.id },
    });

    expect(second.id).toBe(first.id);
    expect(wallet?.balance).toBe(25);
  });

  it("reconciles wallet balance against append-only transactions", async () => {
    const suffix = `reconcile-${Date.now()}`;
    const org = await prisma.lenderOrg.create({
      data: {
        legalName: `Reconcile Lender ${suffix}`,
        nmlsId: `5${String(Date.now()).slice(-7)}`,
        statesLicensed: ["IL"],
        status: "APPROVED",
      },
    });
    await prisma.creditWallet.create({
      data: {
        balance: 0,
        lenderOrgId: org.id,
        plan: "PRO",
      },
    });
    await grantCredits(prisma, {
      credits: 7,
      idempotencyKey: `reconcile:${suffix}`,
      lenderOrgId: org.id,
      reason: BILLING_REASONS.PACK,
    });

    const result = await reconcileWallet(prisma, org.id);

    expect(result.balance).toBe(result.expected);
    expect(result.ok).toBe(true);
  });

  it("keeps billing code free of RESPA-contingent fee language", () => {
    const source = readFileSync("lib/services/billing.ts", "utf8");

    expect(source).not.toMatch(/success fee|basis points|bps|funded loan/i);
  });
});
