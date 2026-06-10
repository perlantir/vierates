import { ConsentType, ListingStatus, PrismaClient, Role } from "@prisma/client";
import { expect, test } from "@playwright/test";

process.env.DATABASE_URL ??=
  "postgresql://vierates:vierates@localhost:54329/vierates?schema=public";

const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("borrower requests and closes a lender introduction", async ({ page }) => {
  const suffix = String(Date.now());
  const user = await prisma.user.create({
    data: {
      clerkId: `connect-borrower:${suffix}`,
      role: Role.BORROWER,
    },
  });
  await prisma.borrowerIdentity.create({
    data: {
      email: `connect-${suffix}@example.com`,
      firstName: "Connect",
      lastName: "Borrower",
      phone: `312779${String(1000 + (Date.now() % 8000)).padStart(4, "0")}`,
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
  const lender = await prisma.lenderOrg.findFirstOrThrow({
    include: { wallet: true },
    orderBy: { legalName: "asc" },
    where: { statesLicensed: { has: "IL" }, status: "APPROVED" },
  });
  const startingBalance = lender.wallet?.balance ?? 0;

  await page.goto("/app/lenders");
  await expect(
    page.getByRole("heading", { name: "Lender directory" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Request introduction" })
    .first()
    .click();
  await expect(page.getByTestId("connect-consent")).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send introduction" }).click();

  await expect(page.getByText("Introduction delivered.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Request introduction" }).first(),
  ).toBeDisabled();

  const connection = await prisma.connection.findFirst({
    include: {
      consentRecord: true,
      creditTxn: true,
      lenderOrg: { include: { wallet: true } },
    },
    where: {
      listingId: listing.id,
      lenderOrgId: lender.id,
    },
  });

  expect(connection?.status).toBe("DELIVERED");
  expect(connection?.consentRecord.type).toBe(ConsentType.TCPA_CONNECT);
  expect(connection?.consentRecord.textShownSha256).toHaveLength(64);
  expect(connection?.consentRecord.trustedFormCertUrl).toContain("trustedform");
  expect(connection?.creditTxn.delta).toBe(-1);
  expect(connection?.creditTxn.reason).toBe("CONNECTION");
  expect(connection?.lenderOrg.wallet?.balance).toBe(startingBalance - 1);

  await page.getByRole("button", { name: "Close and pick another" }).click();
  await expect(
    page.getByText("Introduction closed. You can pick another lender."),
  ).toBeVisible();

  const closedConnection = await prisma.connection.findUnique({
    where: { id: connection?.id },
  });
  expect(closedConnection?.status).toBe("CLOSED");
});
