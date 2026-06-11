import {
  AuctionStatus,
  ListingStatus,
  PrismaClient,
  Role,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { grantCredits } from "../../lib/services/billing";
import { AuctionServiceError, submitBid } from "../../lib/services/auction";
import { POST as stripeWebhook } from "../../app/api/stripe/webhook/route";

process.env.DATABASE_URL ??=
  "postgresql://vierates:vierates@localhost:54329/vierates?schema=public";

const prisma = new PrismaClient();

describe("security: ledger integrity", () => {
  it("rejects bids that would drive a wallet negative", async () => {
    const fixture = await createOpenAuctionFixture(0);

    await expect(
      submitBid(prisma, {
        auctionId: fixture.auctionId,
        idempotencyKey: `security-bid:${Date.now()}`,
        itemizedFees: [995],
        lenderOrgId: fixture.lenderOrgId,
        lenderUserId: fixture.lenderUserId,
        lockDays: 45,
        points: 0,
        product: "30Y_FIXED",
        program: "Verified",
        rateBp: 600,
      }),
    ).rejects.toMatchObject({
      code: "INSUFFICIENT_CREDITS",
    } satisfies Partial<AuctionServiceError>);
  });

  it("blocks replayed credit grants by idempotency key", async () => {
    const fixture = await createOpenAuctionFixture(0);
    const idempotencyKey = `security-grant:${Date.now()}`;

    const first = await grantCredits(prisma, {
      credits: 10,
      idempotencyKey,
      lenderOrgId: fixture.lenderOrgId,
      reason: "GRANT",
    });
    const second = await grantCredits(prisma, {
      credits: 10,
      idempotencyKey,
      lenderOrgId: fixture.lenderOrgId,
      reason: "GRANT",
    });

    const wallet = await prisma.creditWallet.findUnique({
      where: { lenderOrgId: fixture.lenderOrgId },
    });
    expect(second.id).toBe(first.id);
    expect(wallet?.balance).toBe(10);
  });

  it("rejects unsigned Stripe webhook events", async () => {
    const response = await stripeWebhook(
      new Request("http://localhost/api/stripe/webhook", {
        body: JSON.stringify({}),
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
  });
});

async function createOpenAuctionFixture(walletBalance: number) {
  const suffix = String(Date.now()) + Math.random().toString(16).slice(2);
  const borrower = await prisma.user.create({
    data: {
      clerkId: `security-ledger-borrower:${suffix}`,
      role: Role.BORROWER,
    },
  });
  const lenderUserRecord = await prisma.user.create({
    data: {
      clerkId: `security-ledger-lender:${suffix}`,
      role: Role.LENDER,
    },
  });
  const lenderOrg = await prisma.lenderOrg.create({
    data: {
      legalName: `Security Ledger ${suffix}`,
      nmlsId: `2${String(Date.now()).slice(-7)}${suffix.slice(0, 1)}`,
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
  await prisma.creditWallet.create({
    data: {
      balance: walletBalance,
      lenderOrgId: lenderOrg.id,
      plan: "TEST",
    },
  });
  const listing = await prisma.listing.create({
    data: {
      borrowerUserId: borrower.id,
      creditBandStated: "740_PLUS",
      estValueBand: "$500k-$550k",
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
    lenderOrgId: lenderOrg.id,
    lenderUserId: lenderUser.id,
  };
}
