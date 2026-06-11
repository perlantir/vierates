import { ConsentType, ListingStatus, PrismaClient, Role } from "@prisma/client";
import { expect, test } from "@playwright/test";

import { borrowerIdentityVaultData } from "../../lib/security/borrower-identity-vault";

process.env.DATABASE_URL ??=
  "postgresql://vierates:vierates@localhost:54329/vierates?schema=public";
process.env.BORROWER_IDENTITY_KEY ??=
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

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
      ...borrowerIdentityVaultData({
        email: `connect-${suffix}@example.com`,
        firstName: "Connect",
        lastName: "Borrower",
        phone: `312779${String(1000 + (Date.now() % 8000)).padStart(4, "0")}`,
      }),
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
  const lender = await prisma.lenderOrg.create({
    data: {
      legalName: `000 Connect Test Lender ${suffix}`,
      nmlsId: `91${String(Date.now()).slice(-6)}`,
      statesLicensed: ["IL"],
      status: "APPROVED",
    },
  });
  await prisma.coverageBox.create({
    data: {
      ficoMin: 640,
      lenderOrgId: lender.id,
      loanMax: 900000,
      loanMin: 100000,
      ltvMaxBp: 9000,
      products: ["30Y_FIXED"],
      purposes: ["REFINANCE"],
      states: ["IL"],
    },
  });
  const wallet = await prisma.creditWallet.create({
    data: {
      balance: 3,
      lenderOrgId: lender.id,
      plan: "TEST",
    },
  });
  const startingBalance = wallet.balance;

  await page.context().addCookies([
    {
      domain: "127.0.0.1",
      name: "vierates_e2e_borrower_user_id",
      path: "/",
      value: user.id,
    },
  ]);

  await page.goto("/app/lenders");
  await expect(
    page.getByRole("heading", { name: "Lender directory" }),
  ).toBeVisible();
  await page
    .getByTestId(`lender-option-${lender.id}`)
    .getByRole("button", { name: "Request introduction" })
    .click();
  const consentPanel = page.getByTestId("connect-consent");
  await expect(consentPanel).toBeVisible();
  await consentPanel.getByRole("checkbox").check();
  await consentPanel
    .getByRole("button", { name: "Request introduction" })
    .click();

  await expect(page.getByText("Introduction delivered.")).toBeVisible();
  await expect(
    page
      .getByTestId(`lender-option-${lender.id}`)
      .getByRole("button", { name: "Request introduction" }),
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
  expect(connection?.consentRecord.trustedFormCertUrl).toBeNull();
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
