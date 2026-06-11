import {
  AuctionStatus,
  BidStatus,
  ListingStatus,
  PrismaClient,
  Role,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { pickWinningBid, submitBid } from "../lib/services/auction";

process.env.DATABASE_URL ??=
  "postgresql://vierates:vierates@localhost:54329/vierates?schema=public";

const prisma = new PrismaClient();

describe("auction service", () => {
  it("submits bids idempotently and creates the reveal gate on pick", async () => {
    const fixture = await createOpenAuctionFixture({
      orgStatus: "APPROVED",
      walletBalance: 10,
    });

    const bidInput = {
      auctionId: fixture.auctionId,
      idempotencyKey: `bid:${fixture.suffix}`,
      itemizedFees: [
        { amountCents: 99_500, financeCharge: true, label: "Origination" },
      ],
      lenderOrgId: fixture.lenderOrgId,
      lenderUserId: fixture.lenderUserId,
      lockDays: 45,
      points: 0.25,
      product: "30Y_FIXED",
      program: "Verified profile",
      rateBp: 600,
    };
    const firstBid = await submitBid(prisma, bidInput);
    const secondBid = await submitBid(prisma, bidInput);

    expect(secondBid.id).toBe(firstBid.id);
    expect(firstBid.aprBp).toBeGreaterThan(firstBid.rateBp);

    const refreshedWallet = await prisma.creditWallet.findUnique({
      include: { transactions: true },
      where: { id: fixture.walletId },
    });
    expect(refreshedWallet?.balance).toBe(8);
    expect(refreshedWallet?.transactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ delta: -1, reason: "BID" }),
        expect.objectContaining({ delta: -1, reason: "SURCHARGE" }),
      ]),
    );

    await prisma.auction.update({
      data: { status: AuctionStatus.CLOSED },
      where: { id: fixture.auctionId },
    });
    const reveal = await pickWinningBid(prisma, {
      bidId: firstBid.id,
      borrowerUserId: fixture.borrowerUserId,
      ip: "198.51.100.90",
      userAgent: "vitest",
    });

    expect(reveal.identityGrant.lenderOrgId).toBe(fixture.lenderOrgId);
    const wonBid = await prisma.bid.findUnique({ where: { id: firstBid.id } });
    expect(wonBid?.status).toBe(BidStatus.WON);
  });
});

async function createOpenAuctionFixture(input: {
  orgStatus: "APPROVED" | "PENDING" | "SUSPENDED";
  walletBalance: number;
}) {
  const suffix = String(Date.now()) + Math.random().toString(16).slice(2);
  const borrower = await prisma.user.create({
    data: {
      clerkId: `auction-borrower:${suffix}`,
      role: Role.BORROWER,
    },
  });
  const lenderUserRecord = await prisma.user.create({
    data: {
      clerkId: `auction-lender:${suffix}`,
      role: Role.LENDER,
    },
  });
  const lenderOrg = await prisma.lenderOrg.create({
    data: {
      legalName: `Auction Lender ${suffix}`,
      nmlsId: `8${String(Date.now()).slice(-7)}${suffix.slice(0, 1)}`,
      statesLicensed: ["IL"],
      status: input.orgStatus,
    },
  });
  const lenderUser = await prisma.lenderUser.create({
    data: {
      lenderOrgId: lenderOrg.id,
      orgRole: "ORG_ADMIN",
      userId: lenderUserRecord.id,
    },
  });
  const wallet = await prisma.creditWallet.create({
    data: {
      balance: input.walletBalance,
      lenderOrgId: lenderOrg.id,
      plan: "TEST",
    },
  });
  const listing = await prisma.listing.create({
    data: {
      borrowerUserId: borrower.id,
      county: "Cook",
      creditBandStated: "740_PLUS",
      currentRateBand: "6_5_TO_7",
      estValueBand: "$550k-$600k",
      incomeBandStated: "200K_PLUS",
      loanAmount: 400000,
      ltvBand: "60-70",
      occupancy: "PRIMARY",
      propertyMatchOk: true,
      propertyType: "SINGLE_FAMILY",
      purpose: "REFINANCE",
      state: "IL",
      status: ListingStatus.IN_AUCTION,
      timeline: "ASAP",
    },
  });
  const auction = await prisma.auction.create({
    data: {
      closesAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      listingId: listing.id,
      opensAt: new Date(),
      status: AuctionStatus.OPEN,
    },
  });

  return {
    auctionId: auction.id,
    borrowerUserId: borrower.id,
    lenderOrgId: lenderOrg.id,
    lenderUserId: lenderUser.id,
    suffix,
    walletId: wallet.id,
  };
}
