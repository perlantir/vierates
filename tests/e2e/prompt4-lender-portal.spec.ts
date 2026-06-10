import {
  AuctionStatus,
  ListingStatus,
  PrismaClient,
  Role,
} from "@prisma/client";
import { expect, test } from "@playwright/test";

process.env.DATABASE_URL ??=
  "postgresql://vierates:vierates@localhost:54329/vierates?schema=public";

const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("approved lender can submit a computed-APR bid from the board", async ({
  page,
}) => {
  const suffix = String(Date.now());
  const borrower = await prisma.user.create({
    data: {
      clerkId: `portal-borrower:${suffix}`,
      role: Role.BORROWER,
    },
  });
  const lenderUserRecord = await prisma.user.create({
    data: {
      clerkId: `portal-lender:${suffix}`,
      role: Role.LENDER,
    },
  });
  const org = await prisma.lenderOrg.create({
    data: {
      legalName: `Portal Lender ${suffix}`,
      nmlsId: `7${suffix.slice(-7)}`,
      statesLicensed: ["IL"],
      status: "APPROVED",
    },
  });
  await prisma.coverageBox.create({
    data: {
      ficoMin: 640,
      lenderOrgId: org.id,
      loanMax: 900000,
      loanMin: 100000,
      ltvMaxBp: 9000,
      products: ["30Y_FIXED"],
      purposes: ["REFINANCE"],
      states: ["IL"],
    },
  });
  await prisma.creditWallet.create({
    data: {
      balance: 10,
      lenderOrgId: org.id,
      plan: "TEST",
    },
  });
  await prisma.lenderUser.create({
    data: {
      lenderOrgId: org.id,
      orgRole: "ORG_ADMIN",
      userId: lenderUserRecord.id,
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
  await prisma.verificationBundle.create({
    data: {
      creditBandVerified: "740_PLUS",
      dtiBand: "25-30",
      listingId: listing.id,
      scoreModel: "FICO_10T_SANDBOX",
      status: "VERIFIED",
      vendorRefs: {},
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

  await page.context().addCookies([
    {
      domain: "127.0.0.1",
      name: "vierates_e2e_lender_org_id",
      path: "/",
      value: org.id,
    },
  ]);

  await page.goto("/lender");
  await expect(
    page.getByRole("heading", { name: "Lender board" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Submit demo bid" }).click();
  await expect(page.getByText(/Bid submitted at APR/)).toBeVisible();

  const bid = await prisma.bid.findFirst({
    where: {
      auctionId: auction.id,
      lenderOrgId: org.id,
    },
  });
  const wallet = await prisma.creditWallet.findUnique({
    where: { lenderOrgId: org.id },
  });

  expect(bid?.aprBp).toBeGreaterThan(bid?.rateBp ?? 0);
  expect(wallet?.balance).toBe(9);
});
