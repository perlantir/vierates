import {
  AuctionStatus,
  ListingStatus,
  PrismaClient,
  Role,
} from "@prisma/client";
import { expect, test } from "@playwright/test";

import { submitBid } from "../../lib/services/auction";

process.env.DATABASE_URL ??=
  "postgresql://vierates:vierates@localhost:54329/vierates?schema=public";

const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("borrower can pick a winning bid and grant identity access", async ({
  page,
}) => {
  const suffix = String(Date.now());
  const borrower = await prisma.user.create({
    data: {
      clerkId: `pick-borrower:${suffix}`,
      role: Role.BORROWER,
    },
  });
  const lenderUserRecord = await prisma.user.create({
    data: {
      clerkId: `pick-lender:${suffix}`,
      role: Role.LENDER,
    },
  });
  const lenderOrg = await prisma.lenderOrg.create({
    data: {
      legalName: `Pick Lender ${suffix}`,
      nmlsId: `4${suffix.slice(-7)}`,
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
  const bid = await submitBid(prisma, {
    auctionId: auction.id,
    idempotencyKey: `pick:${suffix}`,
    itemizedFees: [
      { amountCents: 99_500, financeCharge: true, label: "Origination" },
    ],
    lenderOrgId: lenderOrg.id,
    lenderUserId: lenderUser.id,
    lockDays: 45,
    points: 0,
    product: "30Y_FIXED",
    program: "Verified profile",
    rateBp: 600,
  });
  await prisma.auction.update({
    data: { status: AuctionStatus.CLOSED },
    where: { id: auction.id },
  });

  await page.context().addCookies([
    {
      domain: "127.0.0.1",
      name: "vierates_e2e_borrower_user_id",
      path: "/",
      value: borrower.id,
    },
  ]);

  const response = await page.request.post(
    `/api/borrower/auctions/${auction.id}/pick`,
    { data: { bidId: bid.id } },
  );
  const body = (await response.json()) as {
    identityGrantId?: string;
    ok?: boolean;
  };
  const grant = await prisma.identityGrant.findUnique({
    where: { id: body.identityGrantId },
  });

  expect(response.ok()).toBe(true);
  expect(body.ok).toBe(true);
  expect(grant?.listingId).toBe(listing.id);
  expect(grant?.lenderOrgId).toBe(lenderOrg.id);
});
