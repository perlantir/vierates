import { notFound } from "next/navigation";

import {
  BorrowerBidRoom,
  type BorrowerBidRoomBid,
} from "@/components/borrower/bid-room";
import { getCurrentBorrowerUserId } from "@/lib/borrower/current";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type BorrowerAuctionPageProps = {
  params: Promise<{ auctionId: string }>;
};

export default async function BorrowerAuctionPage({
  params,
}: BorrowerAuctionPageProps) {
  const borrowerUserId = await getCurrentBorrowerUserId();
  const { auctionId } = await params;

  if (!borrowerUserId) {
    notFound();
  }

  const auction = await prisma.auction.findFirst({
    include: {
      bids: {
        include: {
          lenderOrg: {
            select: {
              dba: true,
              legalName: true,
            },
          },
        },
        orderBy: [{ aprBp: "asc" }, { createdAt: "asc" }],
      },
      listing: {
        select: {
          borrowerUserId: true,
        },
      },
    },
    where: {
      id: auctionId,
      listing: {
        borrowerUserId,
        deletedAt: null,
      },
    },
  });

  if (!auction) {
    notFound();
  }

  const bids: BorrowerBidRoomBid[] = auction.bids.map((bid) => ({
    aprBp: bid.aprBp,
    asOfDate: bid.createdAt.toISOString(),
    conditions: bid.conditions,
    feesLabel: feeSummary(bid.lenderFees),
    id: bid.id,
    lenderName: bid.lenderOrg.dba ?? bid.lenderOrg.legalName,
    lockDays: bid.lockDays,
    points: bid.points.toFixed(2),
    product: bid.product,
    program: bid.program,
    rateBp: bid.rateBp,
  }));

  return (
    <BorrowerBidRoom
      auction={{
        closesAt: auction.closesAt.toISOString(),
        id: auction.id,
        pickDeadline: auction.pickDeadline?.toISOString() ?? null,
        status: auction.status,
      }}
      bids={bids}
    />
  );
}

function feeSummary(value: unknown): string {
  if (!isFeePayload(value)) {
    return "See itemization";
  }

  const total = value.itemized.reduce(
    (sum, fee) => sum + Math.max(0, fee.amountCents),
    0,
  );

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(total / 100);
}

function isFeePayload(
  value: unknown,
): value is { itemized: { amountCents: number }[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "itemized" in value &&
    Array.isArray((value as { itemized?: unknown }).itemized) &&
    (value as { itemized: unknown[] }).itemized.every(
      (fee) =>
        typeof fee === "object" &&
        fee !== null &&
        typeof (fee as { amountCents?: unknown }).amountCents === "number",
    )
  );
}
