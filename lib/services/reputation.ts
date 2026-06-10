import { PrismaClient } from "@prisma/client";

export class ReputationServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

export async function createPostRevealRating(
  db: PrismaClient,
  input: {
    borrowerUserId: string;
    comment?: string;
    lenderOrgId: string;
    listingId: string;
    stars: number;
  },
) {
  await assertRevealGrant(db, input);

  return db.rating.create({
    data: {
      comment: input.comment,
      lenderOrgId: input.lenderOrgId,
      listingId: input.listingId,
      stars: input.stars,
    },
  });
}

export async function createDisputeCase(
  db: PrismaClient,
  input: {
    borrowerUserId: string;
    lenderOrgId: string;
    listingId: string;
    summary: string;
    type: string;
  },
) {
  await assertRevealGrant(db, input);

  return db.disputeCase.create({
    data: {
      lenderOrgId: input.lenderOrgId,
      listingId: input.listingId,
      status: "OPEN",
      summary: input.summary,
      type: input.type,
    },
  });
}

export async function resolveDisputeCase(
  db: PrismaClient,
  input: {
    disputeId: string;
    repeatViolationThreshold?: number;
    resolution: string;
  },
) {
  return db.$transaction(async (tx) => {
    const dispute = await tx.disputeCase.update({
      data: {
        resolution: input.resolution,
        status: "RESOLVED",
      },
      where: { id: input.disputeId },
    });
    const violationCount = await tx.disputeCase.count({
      where: {
        lenderOrgId: dispute.lenderOrgId,
        status: "RESOLVED",
        type: dispute.type,
      },
    });

    if (violationCount >= (input.repeatViolationThreshold ?? 2)) {
      await tx.lenderOrg.update({
        data: { status: "SUSPENDED" },
        where: { id: dispute.lenderOrgId },
      });
    }

    return { dispute, violationCount };
  });
}

async function assertRevealGrant(
  db: PrismaClient,
  input: { borrowerUserId: string; lenderOrgId: string; listingId: string },
) {
  const grant = await db.identityGrant.findFirst({
    where: {
      lenderOrgId: input.lenderOrgId,
      listing: {
        borrowerUserId: input.borrowerUserId,
        id: input.listingId,
      },
    },
  });

  if (!grant) {
    throw new ReputationServiceError(
      "Identity has not been revealed to this lender.",
      "REVEAL_REQUIRED",
      403,
    );
  }
}
