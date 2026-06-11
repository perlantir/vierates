import {
  AuctionStatus,
  ListingStatus,
  PrismaClient,
  Role,
} from "@prisma/client";
import Stripe from "stripe";
import { describe, expect, it } from "vitest";

import { grantCredits } from "../../lib/services/billing";
import { AuctionServiceError, submitBid } from "../../lib/services/auction";
import { POST as stripeWebhook } from "../../app/api/stripe/webhook/route";
import { setValidTestEnv } from "../helpers/env";

setValidTestEnv();

const prisma = new PrismaClient();

describe("security: ledger integrity", () => {
  it("rejects bids that would drive a wallet negative", async () => {
    const fixture = await createOpenAuctionFixture(0);

    await expect(
      submitBid(prisma, {
        auctionId: fixture.auctionId,
        idempotencyKey: `security-bid:${Date.now()}`,
        itemizedFees: [
          { amountCents: 99_500, financeCharge: true, label: "Origination" },
        ],
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

  it.each(["PENDING", "SUSPENDED"] as const)(
    "rejects bids from %s lender orgs",
    async (orgStatus) => {
      const fixture = await createOpenAuctionFixture(10, orgStatus);

      await expect(
        submitBid(prisma, {
          auctionId: fixture.auctionId,
          idempotencyKey: `security-org-status:${orgStatus}:${Date.now()}`,
          itemizedFees: [
            {
              amountCents: 99_500,
              financeCharge: true,
              label: "Origination",
            },
          ],
          lenderOrgId: fixture.lenderOrgId,
          lenderUserId: fixture.lenderUserId,
          lockDays: 45,
          points: 0,
          product: "30Y_FIXED",
          program: "Verified",
          rateBp: 600,
        }),
      ).rejects.toMatchObject({
        code: "ORG_NOT_APPROVED",
        status: 403,
      } satisfies Partial<AuctionServiceError>);
    },
  );

  it("prevents concurrent bid debits from taking a wallet negative", async () => {
    const fixture = await createOpenAuctionFixture(2);
    const auctionIds = await Promise.all(
      Array.from({ length: 4 }, () =>
        createAuctionForBorrower(fixture.borrowerUserId),
      ),
    );

    const results = await Promise.allSettled(
      auctionIds.map((auctionId, index) =>
        submitBid(prisma, {
          auctionId,
          idempotencyKey: `security-concurrent:${fixture.lenderOrgId}:${index}:${Date.now()}`,
          itemizedFees: [
            {
              amountCents: 99_500,
              financeCharge: true,
              label: "Origination",
            },
          ],
          lenderOrgId: fixture.lenderOrgId,
          lenderUserId: fixture.lenderUserId,
          lockDays: 45,
          points: 0,
          product: "30Y_FIXED",
          program: "Verified",
          rateBp: 600 + index,
        }),
      ),
    );
    const wallet = await prisma.creditWallet.findUniqueOrThrow({
      where: { lenderOrgId: fixture.lenderOrgId },
    });

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter(
        (result) =>
          result.status === "rejected" &&
          result.reason instanceof AuctionServiceError &&
          result.reason.code === "INSUFFICIENT_CREDITS",
      ),
    ).toHaveLength(3);
    expect(wallet.balance).toBe(0);
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

  it("accepts signed Stripe credit events", async () => {
    const fixture = await createOpenAuctionFixture(0);
    const eventId = `evt_security_${Date.now()}`;
    const payload = JSON.stringify({
      data: {
        object: {
          metadata: {
            credits: "4",
            lenderOrgId: fixture.lenderOrgId,
          },
        },
      },
      id: eventId,
      type: "invoice.paid",
    });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    });

    const response = await stripeWebhook(
      new Request("http://localhost/api/stripe/webhook", {
        body: payload,
        headers: { "stripe-signature": signature },
        method: "POST",
      }),
    );
    const wallet = await prisma.creditWallet.findUnique({
      where: { lenderOrgId: fixture.lenderOrgId },
    });

    expect(response.status).toBe(200);
    expect(wallet?.balance).toBe(4);
  });
});

async function createOpenAuctionFixture(
  walletBalance: number,
  orgStatus = "APPROVED",
) {
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
      status: orgStatus,
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
    borrowerUserId: borrower.id,
    lenderOrgId: lenderOrg.id,
    lenderUserId: lenderUser.id,
  };
}

async function createAuctionForBorrower(borrowerUserId: string) {
  const suffix = String(Date.now()) + Math.random().toString(16).slice(2);
  const listing = await prisma.listing.create({
    data: {
      borrowerUserId,
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
      timeline: `ASAP_${suffix}`,
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

  return auction.id;
}
