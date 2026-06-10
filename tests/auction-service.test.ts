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
    const suffix = String(Date.now());
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
        nmlsId: `8${suffix.slice(-7)}`,
        statesLicensed: ["IL"],
        status: "APPROVED",
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
        balance: 10,
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

    const bidInput = {
      auctionId: auction.id,
      idempotencyKey: `bid:${suffix}`,
      itemizedFees: [995],
      lenderOrgId: lenderOrg.id,
      lenderUserId: lenderUser.id,
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
      where: { id: wallet.id },
    });
    expect(refreshedWallet?.balance).toBe(9);

    await prisma.auction.update({
      data: { status: AuctionStatus.CLOSED },
      where: { id: auction.id },
    });
    const reveal = await pickWinningBid(prisma, {
      bidId: firstBid.id,
      borrowerUserId: borrower.id,
      ip: "198.51.100.90",
      userAgent: "vitest",
    });

    expect(reveal.identityGrant.lenderOrgId).toBe(lenderOrg.id);
    const wonBid = await prisma.bid.findUnique({ where: { id: firstBid.id } });
    expect(wonBid?.status).toBe(BidStatus.WON);
  });
});
