import { ListingStatus, PrismaClient, Role } from "@prisma/client";
import { expect, test } from "@playwright/test";

process.env.DATABASE_URL ??=
  "postgresql://vierates:vierates@localhost:54329/vierates?schema=public";

const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("borrower dashboard toggles rate watch and deletes vault data", async ({
  page,
}) => {
  const suffix = String(Date.now());
  const phoneSuffix = String(1000 + (Date.now() % 8000)).padStart(4, "0");
  const phone = `312778${phoneSuffix}`;
  const user = await prisma.user.create({
    data: {
      clerkId: `dashboard-borrower:${suffix}`,
      role: Role.BORROWER,
    },
  });

  await prisma.borrowerIdentity.create({
    data: {
      email: `dashboard-${suffix}@example.com`,
      firstName: "Dashboard",
      lastName: "Borrower",
      phone,
      userId: user.id,
    },
  });

  const listing = await prisma.listing.create({
    data: {
      borrowerUserId: user.id,
      county: "Cook",
      creditBandStated: "700_739",
      currentRateBand: "6_5_TO_7",
      estValueBand: "$500k-$550k",
      incomeBandStated: "150K_200K",
      loanAmount: 330000,
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

  await page.goto("/app");
  await expect(
    page.getByRole("heading", { name: "Borrower dashboard" }),
  ).toBeVisible();
  await expect(
    page.getByText("$330,000", { exact: true }).first(),
  ).toBeVisible();

  await page.getByLabel("Rate watch").check();
  await expect(page.getByText("Rate watch is on.")).toBeVisible();

  const rateWatchListing = await prisma.listing.findUnique({
    where: { id: listing.id },
  });
  expect(rateWatchListing?.rateWatchNurtureFlag).toBe(true);

  await page.getByLabel("Confirmation").fill("DELETE");
  await page.getByRole("button", { name: "Delete my listing & data" }).click();
  await expect(page.getByText("No active listing")).toBeVisible();

  const deletedListing = await prisma.listing.findUnique({
    where: { id: listing.id },
  });
  const identity = await prisma.borrowerIdentity.findUnique({
    where: { userId: user.id },
  });
  const auditLog = await prisma.auditLog.findFirst({
    where: {
      action: "borrower.delete_listing_and_vault",
      entityId: listing.id,
    },
  });

  expect(deletedListing?.deletedAt).toBeTruthy();
  expect(identity).toBeNull();
  expect(auditLog?.id).toBeTruthy();
});
