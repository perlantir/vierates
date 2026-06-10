import {
  AuctionStatus,
  BidStatus,
  ConsentType,
  Prisma,
  PrismaClient,
  Role,
} from "@prisma/client";

import { calculateAprBp } from "@/lib/apr";
import { createConsentRecord } from "@/lib/consent/records";
import { transitionAuctionStatus } from "@/lib/services/auction/state";

export class AuctionServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

export type BidInput = {
  auctionId: string;
  conditions?: string;
  idempotencyKey: string;
  itemizedFees: number[];
  lenderOrgId: string;
  lenderUserId: string;
  lockDays: number;
  points: number;
  product: string;
  program: string;
  rateBp: number;
};

export async function openAuction(db: PrismaClient, auctionId: string) {
  const auction = await db.auction.findUniqueOrThrow({
    where: { id: auctionId },
  });
  const status = transitionAuctionStatus(auction.status, "open");

  return db.auction.update({
    data: { status },
    where: { id: auction.id },
  });
}

export async function closeAuction(db: PrismaClient, auctionId: string) {
  const auction = await db.auction.findUniqueOrThrow({
    where: { id: auctionId },
  });
  const status = transitionAuctionStatus(auction.status, "close");

  return db.auction.update({
    data: {
      pickDeadline: new Date(
        auction.closesAt.getTime() + 7 * 24 * 60 * 60 * 1000,
      ),
      status,
    },
    where: { id: auction.id },
  });
}

export async function submitBid(db: PrismaClient, input: BidInput) {
  return db.$transaction(async (tx) => {
    const existingTxn = await tx.creditTransaction.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });

    if (existingTxn) {
      const existingBid = await tx.bid.findFirst({
        where: { creditTxnId: existingTxn.id },
      });

      if (existingBid) {
        return existingBid;
      }
    }

    const auction = await tx.auction.findUnique({
      include: { listing: true },
      where: { id: input.auctionId },
    });

    if (!auction || auction.status !== AuctionStatus.OPEN) {
      throw new AuctionServiceError(
        "Auction is not open.",
        "AUCTION_NOT_OPEN",
        409,
      );
    }

    const lenderUser = await tx.lenderUser.findFirst({
      include: {
        lenderOrg: {
          include: { wallet: true },
        },
      },
      where: {
        id: input.lenderUserId,
        lenderOrgId: input.lenderOrgId,
      },
    });

    if (!lenderUser?.lenderOrg.wallet) {
      throw new AuctionServiceError(
        "Wallet not found.",
        "WALLET_NOT_FOUND",
        404,
      );
    }

    const existingBids = await tx.bid.findMany({
      where: {
        auctionId: auction.id,
        lenderOrgId: input.lenderOrgId,
        status: { in: [BidStatus.ACTIVE, BidStatus.IMPROVED] },
      },
    });

    if (existingBids.some((bid) => bid.status === BidStatus.IMPROVED)) {
      throw new AuctionServiceError(
        "Only one improvement is allowed.",
        "IMPROVE_LIMIT",
        409,
      );
    }

    const activeBid = existingBids.find(
      (bid) => bid.status === BidStatus.ACTIVE,
    );

    if (activeBid) {
      await tx.bid.update({
        data: { status: BidStatus.IMPROVED },
        where: { id: activeBid.id },
      });
    }

    const aprBp = calculateAprBp({
      financeChargeFees: input.itemizedFees,
      loanAmount: auction.listing.loanAmount,
      noteRateBp: input.rateBp,
      points: input.points,
      termMonths: 360,
    });

    const creditTxn = await tx.creditTransaction.create({
      data: {
        delta: -1,
        idempotencyKey: input.idempotencyKey,
        reason: "BID",
        refId: auction.id,
        walletId: lenderUser.lenderOrg.wallet.id,
      },
    });

    await tx.creditWallet.update({
      data: { balance: { decrement: 1 } },
      where: { id: lenderUser.lenderOrg.wallet.id },
    });

    const bid = await tx.bid.create({
      data: {
        aprBp,
        auctionId: auction.id,
        conditions: input.conditions,
        creditTxnId: creditTxn.id,
        lenderFees: { itemized: input.itemizedFees },
        lenderOrgId: input.lenderOrgId,
        lenderUserId: input.lenderUserId,
        lockDays: input.lockDays,
        points: new Prisma.Decimal(input.points),
        product: input.product,
        program: input.program,
        rateBp: input.rateBp,
        status: BidStatus.ACTIVE,
      },
    });

    const activeBids = await tx.bid.findMany({
      select: { aprBp: true },
      where: {
        auctionId: auction.id,
        status: { in: [BidStatus.ACTIVE, BidStatus.IMPROVED] },
      },
    });

    await tx.auction.update({
      data: {
        bestAprBp: Math.min(...activeBids.map((active) => active.aprBp)),
        bidCount: activeBids.length,
      },
      where: { id: auction.id },
    });

    return bid;
  });
}

export async function pickWinningBid(
  db: PrismaClient,
  input: {
    bidId: string;
    borrowerUserId: string;
    ip: string;
    userAgent: string;
  },
) {
  return db.$transaction(async (tx) => {
    const bid = await tx.bid.findUnique({
      include: {
        auction: {
          include: { listing: true },
        },
      },
      where: { id: input.bidId },
    });

    if (!bid || bid.auction.listing.borrowerUserId !== input.borrowerUserId) {
      throw new AuctionServiceError("Bid not found.", "BID_NOT_FOUND", 404);
    }

    if (bid.auction.status !== AuctionStatus.CLOSED) {
      throw new AuctionServiceError(
        "Auction is not closed.",
        "AUCTION_NOT_CLOSED",
        409,
      );
    }

    const updated = await tx.auction.updateMany({
      data: { status: AuctionStatus.REVEALED },
      where: {
        id: bid.auction.id,
        status: AuctionStatus.CLOSED,
      },
    });

    if (updated.count !== 1) {
      throw new AuctionServiceError(
        "Winner already picked.",
        "PICK_CONFLICT",
        409,
      );
    }

    const consentRecord = await createConsentRecord(tx, {
      grantedToLenderOrgId: bid.lenderOrgId,
      ip: input.ip,
      textShown: `I choose lender ${bid.lenderOrgId} and agree VieRates may reveal my identity to that lender.`,
      type: ConsentType.TCPA_REVEAL,
      userAgent: input.userAgent,
      userId: input.borrowerUserId,
    });

    await tx.bid.update({
      data: { status: BidStatus.WON },
      where: { id: bid.id },
    });
    await tx.bid.updateMany({
      data: { status: BidStatus.LOST },
      where: {
        auctionId: bid.auction.id,
        id: { not: bid.id },
      },
    });

    const identityGrant = await tx.identityGrant.create({
      data: {
        consentRecordId: consentRecord.id,
        lenderOrgId: bid.lenderOrgId,
        listingId: bid.auction.listingId,
      },
    });

    return { consentRecord, identityGrant };
  });
}

export function authorizePusherChannel(input: {
  channelName: string;
  listingId?: string;
  role: Role;
}): boolean {
  if (input.channelName.startsWith("private-borrower-")) {
    return (
      input.role === Role.BORROWER &&
      input.channelName === `private-borrower-${input.listingId}`
    );
  }

  if (input.channelName.startsWith("private-lender-auction-")) {
    return input.role === Role.LENDER;
  }

  return false;
}
