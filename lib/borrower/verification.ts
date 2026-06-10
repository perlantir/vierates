import {
  AuctionStatus,
  ConsentType,
  ListingStatus,
  Prisma,
  PrismaClient,
  Role,
} from "@prisma/client";

import { maskedPreviewFromLenderView } from "@/lib/borrower/masked-preview";
import { createConsentRecord } from "@/lib/consent/records";
import { HPPA_OPTIN_TEXT, SOFT_PULL_SENTENCE } from "@/lib/consent/text";
import { lenderView } from "@/lib/dal/listings";
import { prisma } from "@/lib/prisma";

export type VerificationFlowData = Awaited<
  ReturnType<typeof getVerificationFlowData>
>;

export class VerificationFlowError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

export async function getVerificationFlowData(borrowerUserId: string) {
  const listing = await prisma.listing.findFirst({
    include: {
      auction: true,
      verificationBundle: true,
    },
    orderBy: { createdAt: "desc" },
    where: {
      borrowerUserId,
      deletedAt: null,
    },
  });

  return { listing };
}

export async function recordCreditVerification(
  db: PrismaClient,
  input: {
    borrowerUserId: string;
    ip: string;
    listingId: string;
    simulateFailure?: boolean;
    userAgent: string;
  },
) {
  if (input.simulateFailure) {
    return createVerificationFailure(db, {
      borrowerUserId: input.borrowerUserId,
      listingId: input.listingId,
      summary: "Sandbox credit verification failed and needs human review.",
      type: "CREDIT_VERIFICATION",
    });
  }

  return db.$transaction(async (tx) => {
    await assertBorrowerListing(tx, input.borrowerUserId, input.listingId);

    const consentRecord = await createConsentRecord(tx, {
      ip: input.ip,
      textShown: SOFT_PULL_SENTENCE,
      type: ConsentType.CREDIT_SOFT_PULL,
      userAgent: input.userAgent,
      userId: input.borrowerUserId,
    });

    const verificationBundle = await tx.verificationBundle.upsert({
      create: {
        creditBandVerified: "740_PLUS",
        listingId: input.listingId,
        scoreModel: "FICO_10T_SANDBOX",
        status: "CREDIT_VERIFIED",
        vendorRefs: {
          array: {
            reissueToken: `array_reissue_${input.listingId}`,
            sandboxRef: `array_sandbox_${input.listingId}`,
          },
        },
      },
      update: {
        creditBandVerified: "740_PLUS",
        scoreModel: "FICO_10T_SANDBOX",
        status: "CREDIT_VERIFIED",
        vendorRefs: {
          array: {
            reissueToken: `array_reissue_${input.listingId}`,
            sandboxRef: `array_sandbox_${input.listingId}`,
          },
        },
      },
      where: { listingId: input.listingId },
    });

    return { consentRecord, verificationBundle };
  });
}

export async function recordIncomeVerification(
  db: PrismaClient,
  input: {
    borrowerUserId: string;
    ip: string;
    listingId: string;
    simulateFailure?: boolean;
    userAgent: string;
  },
) {
  if (input.simulateFailure) {
    return createVerificationFailure(db, {
      borrowerUserId: input.borrowerUserId,
      listingId: input.listingId,
      summary: "Sandbox income verification failed and needs human review.",
      type: "INCOME_VERIFICATION",
    });
  }

  return db.$transaction(async (tx) => {
    const listing = await assertBorrowerListing(
      tx,
      input.borrowerUserId,
      input.listingId,
    );
    const currentBundle = await tx.verificationBundle.findUnique({
      where: { listingId: listing.id },
    });
    const currentRefs = readVendorRefs(currentBundle?.vendorRefs);

    const consentRecord = await createConsentRecord(tx, {
      ip: input.ip,
      textShown: HPPA_OPTIN_TEXT,
      type: ConsentType.HPPA_OPTIN,
      userAgent: input.userAgent,
      userId: input.borrowerUserId,
    });

    const verificationBundle = await tx.verificationBundle.upsert({
      create: {
        dtiBand: "25-30",
        incomeVerifiedAt: new Date(),
        listingId: input.listingId,
        status: "VERIFIED",
        vendorRefs: {
          truv: {
            reissueToken: `truv_reissue_${input.listingId}`,
            sandboxRef: `truv_sandbox_${input.listingId}`,
          },
        },
      },
      update: {
        dtiBand: "25-30",
        incomeVerifiedAt: new Date(),
        status: "VERIFIED",
        vendorRefs: {
          ...currentRefs,
          truv: {
            reissueToken: `truv_reissue_${input.listingId}`,
            sandboxRef: `truv_sandbox_${input.listingId}`,
          },
        },
      },
      where: { listingId: input.listingId },
    });

    return { consentRecord, verificationBundle };
  });
}

export async function getMaskedPreviewForBorrower(
  db: PrismaClient,
  input: { borrowerUserId: string; listingId: string },
) {
  const listing = await assertBorrowerListing(
    db,
    input.borrowerUserId,
    input.listingId,
  );
  const lender = await db.lenderOrg.findFirst({
    include: { coverageBox: true },
    orderBy: { legalName: "asc" },
    where: {
      coverageBox: {
        states: { has: listing.state },
      },
      status: "APPROVED",
    },
  });

  if (!lender) {
    throw new VerificationFlowError(
      "No eligible lender preview is available.",
      "NO_PREVIEW_LENDER",
      404,
    );
  }

  const maskedListing = await lenderView(
    {
      lenderOrgId: lender.id,
      role: Role.LENDER,
      userId: "masked-preview",
    },
    listing.id,
  );

  if (!maskedListing) {
    throw new VerificationFlowError(
      "Masked preview could not be built.",
      "MASKED_PREVIEW_UNAVAILABLE",
      404,
    );
  }

  return maskedPreviewFromLenderView(maskedListing);
}

export async function scheduleBorrowerAuction(
  db: PrismaClient,
  input: { borrowerUserId: string; listingId: string; now?: Date },
) {
  const now = input.now ?? new Date();

  return db.$transaction(async (tx) => {
    const listing = await assertBorrowerListing(
      tx,
      input.borrowerUserId,
      input.listingId,
    );
    const existing = await tx.auction.findUnique({
      where: { listingId: listing.id },
    });

    if (existing) {
      return existing;
    }

    const auction = await tx.auction.create({
      data: {
        closesAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        listingId: listing.id,
        opensAt: now,
        status: AuctionStatus.SCHEDULED,
      },
    });

    await tx.listing.update({
      data: { status: ListingStatus.IN_AUCTION },
      where: { id: listing.id },
    });

    return auction;
  });
}

async function createVerificationFailure(
  db: PrismaClient,
  input: {
    borrowerUserId: string;
    listingId: string;
    summary: string;
    type: string;
  },
) {
  return db.$transaction(async (tx) => {
    await assertBorrowerListing(tx, input.borrowerUserId, input.listingId);

    return tx.manualReviewCase.create({
      data: {
        listingId: input.listingId,
        summary: input.summary,
        type: input.type,
      },
    });
  });
}

async function assertBorrowerListing(
  db: PrismaClient | Prisma.TransactionClient,
  borrowerUserId: string,
  listingId: string,
) {
  const listing = await db.listing.findFirst({
    where: {
      borrowerUserId,
      deletedAt: null,
      id: listingId,
    },
  });

  if (!listing) {
    throw new VerificationFlowError(
      "Listing not found.",
      "LISTING_NOT_FOUND",
      404,
    );
  }

  return listing;
}

function readVendorRefs(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}
