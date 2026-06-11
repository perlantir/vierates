import { randomBytes, randomInt } from "node:crypto";
import {
  ConsentType,
  ListingStatus,
  Prisma,
  PrismaClient,
  Role,
  StateStatus,
} from "@prisma/client";
import { z } from "zod";

import type { FunnelEventName } from "@/lib/analytics/events";
import { recordFunnelEvent } from "@/lib/analytics/server";
import { smsOptInText } from "@/lib/borrower/shared";
import { sha256 } from "@/lib/consent/records";
import { assertTwilioStubAllowed } from "@/lib/integrations/twilio";
import {
  borrowerIdentityVaultData,
  borrowerPhoneHash,
  decryptBorrowerIdentityField,
  encryptBorrowerIdentityField,
} from "@/lib/security/borrower-identity-vault";

const activeListingStatuses = [
  ListingStatus.DRAFT,
  ListingStatus.LIVE,
  ListingStatus.IN_AUCTION,
  ListingStatus.MATCHED,
] as const;

export type OtpChallengeWithDemoCode = Awaited<
  ReturnType<PrismaClient["otpChallenge"]["create"]>
> & {
  demoCode?: string;
};

export const states = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
] as const;

export const stateSchema = z.enum(states);

export const propertyMatchSchema = z.object({
  address: z.string().min(5).max(240),
  state: stateSchema,
});

export const listingWizardSchema = z.object({
  balanceAmount: z.number().int().min(50_000).max(3_000_000),
  challengeId: z.string().min(1),
  county: z.string().min(2).max(80).optional(),
  creditBandStated: z.string().min(2),
  currentRateBand: z.string().min(2),
  estValueAmount: z.number().int().min(100_000).max(5_000_000),
  incomeBandStated: z.string().min(2),
  occupancy: z.string().min(2),
  propertyMatchOk: z.boolean(),
  propertyType: z.string().min(2),
  purpose: z.string().min(2),
  state: stateSchema,
  timeline: z.string().min(2),
});

export type ListingWizardInput = z.infer<typeof listingWizardSchema>;

export type PropertyMatchResult = {
  county?: string;
  gated: boolean;
  manualReview: boolean;
  propertyMatchOk: boolean;
  state: (typeof states)[number];
  stateStatus: StateStatus;
};

export class BorrowerFlowError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  return digits;
}

export function isBlockedPhone(phone: string): boolean {
  return (
    phone.length !== 10 ||
    phone.startsWith("000") ||
    phone.startsWith("555000") ||
    phone.endsWith("0000")
  );
}

export async function matchPropertyForListing(
  db: PrismaClient,
  input: z.infer<typeof propertyMatchSchema>,
): Promise<PropertyMatchResult> {
  const parsed = propertyMatchSchema.parse(input);
  const stateRule = await db.stateRule.findUnique({
    where: { state: parsed.state },
  });
  const stateStatus = stateRule?.status ?? StateStatus.YELLOW;
  const manualReview = /manual|unknown|po box|p\.o\./i.test(parsed.address);

  return {
    county: manualReview ? undefined : countyForState(parsed.state),
    gated: stateStatus !== StateStatus.GREEN,
    manualReview,
    propertyMatchOk: !manualReview,
    state: parsed.state,
    stateStatus,
  };
}

export async function saveListingDraft(
  db: PrismaClient,
  input: {
    data: Prisma.InputJsonValue;
    resumeToken?: string;
    state?: string;
  },
) {
  const resumeToken = input.resumeToken ?? randomToken();

  return db.listingDraft.upsert({
    where: { resumeToken },
    update: {
      data: input.data,
      email: null,
      phone: null,
      state: input.state,
    },
    create: {
      data: input.data,
      email: null,
      phone: null,
      resumeToken,
      state: input.state,
    },
  });
}

export async function startOtpChallenge(
  db: PrismaClient,
  input: { ip: string; now?: Date; phone: string },
): Promise<OtpChallengeWithDemoCode> {
  const phone = normalizePhone(input.phone);
  const now = input.now ?? new Date();
  const code = randomOtpCode();

  if (isBlockedPhone(phone)) {
    throw new BorrowerFlowError(
      "Use a mobile number that can receive verification texts.",
      "OTP_BLOCKED_PHONE",
      422,
    );
  }

  await assertNoActiveListingForPhone(db, phone);

  const windowStart = new Date(now.getTime() - 15 * 60 * 1000);
  const recentAttempts = await db.otpChallenge.count({
    where: {
      createdAt: { gte: windowStart },
      phoneHash: borrowerPhoneHash(phone),
    },
  });

  if (recentAttempts >= 3) {
    throw new BorrowerFlowError(
      "Too many code attempts. Try again later.",
      "OTP_RATE_LIMITED",
      429,
    );
  }

  // TODO(integration): real Twilio Verify code delivery.
  assertTwilioStubAllowed();

  const challenge = await db.otpChallenge.create({
    data: {
      codeHash: sha256(code),
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
      ip: input.ip,
      phone: encryptBorrowerIdentityField("phone", phone),
      phoneHash: borrowerPhoneHash(phone),
    },
  });

  return process.env.DEMO_MODE === "true"
    ? { ...challenge, demoCode: code }
    : challenge;
}

export async function verifyOtpChallenge(
  db: PrismaClient,
  input: {
    challengeId: string;
    code: string;
    ip: string;
    now?: Date;
    userAgent: string;
  },
) {
  const now = input.now ?? new Date();

  return db.$transaction(async (tx) => {
    const challenge = await tx.otpChallenge.findUnique({
      where: { id: input.challengeId },
    });
    const phone = challenge ? readOtpChallengePhone(challenge.phone) : "";

    if (!challenge || challenge.status !== "PENDING") {
      throw new BorrowerFlowError(
        "Verification code is not active.",
        "OTP_NOT_ACTIVE",
        400,
      );
    }

    if (challenge.expiresAt < now) {
      await tx.otpChallenge.update({
        where: { id: challenge.id },
        data: { status: "EXPIRED" },
      });
      throw new BorrowerFlowError(
        "Verification code expired.",
        "OTP_EXPIRED",
        400,
      );
    }

    if (challenge.attempts >= 4 || challenge.codeHash !== sha256(input.code)) {
      await tx.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BorrowerFlowError(
        "Verification code did not match.",
        "OTP_CODE_MISMATCH",
        400,
      );
    }

    const user = await tx.user.upsert({
      where: { clerkId: `borrower-phone:${phone}` },
      update: { role: Role.BORROWER },
      create: {
        clerkId: `borrower-phone:${phone}`,
        role: Role.BORROWER,
      },
    });

    await tx.borrowerIdentity.upsert({
      where: { userId: user.id },
      update: {
        ...borrowerIdentityVaultData({
          email: `${phone}@borrower.vierates.local`,
          firstName: "Anonymous",
          lastName: "Borrower",
          phone,
        }),
        phoneVerifiedAt: now,
      },
      create: {
        ...borrowerIdentityVaultData({
          email: `${phone}@borrower.vierates.local`,
          firstName: "Anonymous",
          lastName: "Borrower",
          phone,
        }),
        phoneVerifiedAt: now,
        userId: user.id,
      },
    });

    const consentRecord = await tx.consentRecord.create({
      data: {
        ip: input.ip,
        textShownSha256: sha256(smsOptInText(phone)),
        type: ConsentType.SMS_OPTIN,
        userAgent: input.userAgent,
        userId: user.id,
      },
    });

    await tx.otpChallenge.update({
      where: { id: challenge.id },
      data: { status: "VERIFIED" },
    });

    return {
      borrowerUserId: user.id,
      consentRecordId: consentRecord.id,
      phone,
    };
  });
}

export async function createListingFromWizard(
  db: PrismaClient,
  input: ListingWizardInput,
) {
  const parsed = listingWizardSchema.parse(input);

  const challenge = await db.otpChallenge.findUnique({
    where: { id: parsed.challengeId },
  });

  if (!challenge || challenge.status !== "VERIFIED") {
    throw new BorrowerFlowError(
      "Verify your phone before listing.",
      "PHONE_NOT_VERIFIED",
      400,
    );
  }

  const phone = readOtpChallengePhone(challenge.phone);
  const borrowerIdentity = await db.borrowerIdentity.findFirst({
    where: { phoneHash: borrowerPhoneHash(phone) },
    select: { userId: true },
  });

  if (!borrowerIdentity) {
    throw new BorrowerFlowError(
      "Verified borrower profile was not found.",
      "BORROWER_NOT_FOUND",
      400,
    );
  }

  const stateRule = await db.stateRule.findUnique({
    where: { state: parsed.state },
  });

  if ((stateRule?.status ?? StateStatus.YELLOW) !== StateStatus.GREEN) {
    throw new BorrowerFlowError(
      `VieRates is not live in ${parsed.state} yet.`,
      "STATE_NOT_LIVE",
      409,
    );
  }

  await assertNoActiveListingForPhone(db, phone);

  return db.$transaction(async (tx) => {
    const listing = await tx.listing.create({
      data: {
        borrowerUserId: borrowerIdentity.userId,
        county: parsed.county,
        creditBandStated: parsed.creditBandStated,
        currentRateBand: parsed.currentRateBand,
        estValueBand: valueBand(parsed.estValueAmount),
        incomeBandStated: parsed.incomeBandStated,
        loanAmount: parsed.balanceAmount,
        ltvBand: ltvBand(parsed.balanceAmount, parsed.estValueAmount),
        occupancy: parsed.occupancy,
        propertyMatchOk: parsed.propertyMatchOk,
        propertyType: parsed.propertyType,
        purpose: parsed.purpose,
        rateWatchNurtureFlag: parsed.timeline === "JUST_WATCHING",
        state: parsed.state,
        status: parsed.propertyMatchOk
          ? ListingStatus.LIVE
          : ListingStatus.DRAFT,
        timeline: parsed.timeline,
      },
    });

    if (!parsed.propertyMatchOk) {
      await tx.manualReviewCase.create({
        data: {
          listingId: listing.id,
          summary:
            "Property match did not return a confident ATTOM-style match. Borrower was told the listing is in manual review.",
          type: "PROPERTY_MATCH",
        },
      });
    }

    return listing;
  });
}

function readOtpChallengePhone(value: string): string {
  return value.startsWith("v1:")
    ? decryptBorrowerIdentityField("phone", value)
    : value;
}

export async function captureBorrowerFunnelEvent(
  db: PrismaClient,
  input: {
    event: FunnelEventName;
    metadata?: Prisma.InputJsonValue;
    sessionId: string;
    step: string;
    userId?: string;
  },
) {
  return recordFunnelEvent(db, input);
}

async function assertNoActiveListingForPhone(db: PrismaClient, phone: string) {
  const activeIdentity = await db.borrowerIdentity.findFirst({
    where: {
      phoneHash: borrowerPhoneHash(phone),
      user: {
        listings: {
          some: {
            deletedAt: null,
            status: { in: [...activeListingStatuses] },
          },
        },
      },
    },
    select: { id: true },
  });

  if (activeIdentity) {
    throw new BorrowerFlowError(
      "This number already has an active listing.",
      "OTP_ACTIVE_LISTING",
      409,
    );
  }
}

function countyForState(state: string): string {
  const counties: Record<string, string> = {
    CA: "Los Angeles",
    CO: "Denver",
    FL: "Orange",
    IL: "Cook",
    TX: "Travis",
  };

  return counties[state] ?? "Launch";
}

function ltvBand(balanceAmount: number, estValueAmount: number): string {
  const ltv = Math.round((balanceAmount / estValueAmount) * 100);
  const lower = Math.max(0, Math.floor(ltv / 10) * 10);
  const upper = Math.min(100, lower + 10);

  return `${lower}-${upper}`;
}

function valueBand(value: number): string {
  const lower = Math.floor(value / 50_000) * 50;
  return `$${lower}k-$${lower + 50}k`;
}

function randomToken(): string {
  return randomBytes(18).toString("base64url");
}

function randomOtpCode(): string {
  let code = "";

  do {
    code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  } while (code === "123456");

  return code;
}
