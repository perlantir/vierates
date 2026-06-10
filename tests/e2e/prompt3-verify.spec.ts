import {
  AuctionStatus,
  ConsentType,
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

test("borrower verifies profile and schedules a Bid Room", async ({ page }) => {
  const suffix = String(Date.now());
  const user = await prisma.user.create({
    data: {
      clerkId: `verify-borrower:${suffix}`,
      role: Role.BORROWER,
    },
  });
  await prisma.borrowerIdentity.create({
    data: {
      email: `verify-${suffix}@example.com`,
      firstName: "Verify",
      lastName: "Borrower",
      phone: `312780${String(1000 + (Date.now() % 8000)).padStart(4, "0")}`,
      userId: user.id,
    },
  });
  const listing = await prisma.listing.create({
    data: {
      borrowerUserId: user.id,
      county: "Cook",
      creditBandStated: "740_PLUS",
      currentRateBand: "6_5_TO_7",
      estValueBand: "$550k-$600k",
      incomeBandStated: "200K_PLUS",
      loanAmount: 360000,
      ltvBand: "60-70",
      occupancy: "PRIMARY",
      propertyMatchOk: true,
      propertyType: "SINGLE_FAMILY",
      purpose: "REFINANCE",
      state: "IL",
      status: ListingStatus.LIVE,
      timeline: "ASAP",
    },
  });

  await page.context().addCookies([
    {
      domain: "127.0.0.1",
      name: "vierates_e2e_borrower_user_id",
      path: "/",
      value: user.id,
    },
  ]);

  await page.goto("/app/verify");
  await expect(
    page.getByText(
      "Checking your bids uses a soft inquiry and will not affect your credit score.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Run soft inquiry sandbox" }).click();
  await page.getByRole("button", { name: "Verify income sandbox" }).click();
  await expect(page.getByTestId("masked-preview")).toBeVisible();
  await expect(page.getByText("Hidden until you pick.")).toBeVisible();
  await page.getByRole("button", { name: "Schedule my Bid Room" }).click();
  await expect(page.getByTestId("verify-done")).toBeVisible();

  const refreshedListing = await prisma.listing.findUnique({
    include: {
      auction: true,
      borrower: {
        include: {
          consentRecords: true,
        },
      },
      verificationBundle: true,
    },
    where: { id: listing.id },
  });

  expect(refreshedListing?.verificationBundle?.status).toBe("VERIFIED");
  expect(refreshedListing?.auction?.status).toBe(AuctionStatus.SCHEDULED);
  expect(refreshedListing?.status).toBe(ListingStatus.IN_AUCTION);
  expect(
    refreshedListing?.borrower.consentRecords.some(
      (record) => record.type === ConsentType.CREDIT_SOFT_PULL,
    ),
  ).toBe(true);
  expect(
    refreshedListing?.borrower.consentRecords.some(
      (record) => record.type === ConsentType.HPPA_OPTIN,
    ),
  ).toBe(true);
});
