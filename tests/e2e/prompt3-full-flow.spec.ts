import { AuctionStatus, ConsentType, PrismaClient } from "@prisma/client";
import { expect, type Page, test } from "@playwright/test";

import { borrowerPhoneHash } from "../../lib/security/borrower-identity-vault";

process.env.DATABASE_URL ??=
  "postgresql://vierates:vierates@localhost:54329/vierates?schema=public";
process.env.BORROWER_IDENTITY_KEY ??=
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("full borrower flow writes all prompt 3 consents and schedules auction", async ({
  page,
}) => {
  const phone = `312781${String(1000 + (Date.now() % 8000)).padStart(4, "0")}`;
  await page.context().setExtraHTTPHeaders({
    "x-forwarded-for": `198.51.101.${1 + (Date.now() % 200)}`,
  });

  await page.goto("/app/new");
  await page.getByRole("button", { name: "Lower my payment" }).click();
  await page.getByLabel("Street address").fill("123 Main St");
  await page.getByLabel("State").selectOption("IL");
  await page.getByRole("button", { name: "Match property" }).click();
  await page.getByRole("button", { name: "Single-family" }).click();
  await page.getByRole("button", { name: "I live there" }).click();
  await page.getByRole("button", { name: "Save estimated value" }).click();
  await page.getByRole("button", { name: "Save loan balance" }).click();
  await page.getByRole("button", { name: "6.5-7%" }).click();
  await page.getByRole("button", { name: "Excellent 740+" }).click();
  await page.getByRole("button", { name: "$200k+" }).click();
  await page.getByRole("button", { name: "ASAP" }).click();
  await page.getByLabel("Mobile phone").fill(phone);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send code" }).click();
  await page
    .getByRole("textbox", { name: "Verification code" })
    .fill(await demoCodeFromPage(page));
  await page
    .getByRole("button", { name: "Create my anonymous listing" })
    .click();
  await expect(page.getByTestId("listing-done")).toBeVisible();

  const createdIdentity = await prisma.borrowerIdentity.findFirstOrThrow({
    select: { userId: true },
    where: { phoneHash: borrowerPhoneHash(phone) },
  });
  const suffix = String(Date.now());
  const lender = await prisma.lenderOrg.create({
    data: {
      legalName: `000 Full Flow Lender ${suffix}`,
      nmlsId: `92${suffix.slice(-6)}`,
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
  await prisma.creditWallet.create({
    data: {
      balance: 3,
      lenderOrgId: lender.id,
      plan: "TEST",
    },
  });
  await page.context().addCookies([
    {
      domain: "127.0.0.1",
      name: "vierates_e2e_borrower_user_id",
      path: "/",
      value: createdIdentity.userId,
    },
  ]);

  await page.goto("/app/lenders");
  await page
    .getByTestId(`lender-option-${lender.id}`)
    .getByRole("button", { name: "Request introduction" })
    .click();
  const consentPanel = page.getByTestId("connect-consent");
  await consentPanel.getByRole("checkbox").check();
  await consentPanel
    .getByRole("button", { name: "Request introduction" })
    .click();
  await expect(page.getByText("Introduction delivered.")).toBeVisible();

  await page.goto("/app/verify");
  await page.getByRole("button", { name: "Start credit step" }).click();
  await page.getByRole("button", { name: "Connect to Array sandbox" }).click();
  await page.getByRole("button", { name: "Connect to Truv sandbox" }).click();
  await expect(page.getByTestId("masked-preview")).toBeVisible();
  await page.getByRole("button", { name: "Open my auction now" }).click();
  await expect(page.getByTestId("verify-done")).toBeVisible();

  const identity = await prisma.borrowerIdentity.findFirstOrThrow({
    include: {
      user: {
        include: {
          consentRecords: true,
          listings: {
            include: { auction: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    where: { phoneHash: borrowerPhoneHash(phone) },
  });

  const consentTypes = new Set(
    identity.user.consentRecords.map((record) => record.type),
  );
  const listing = identity.user.listings[0];

  expect(consentTypes.has(ConsentType.SMS_OPTIN)).toBe(true);
  expect(consentTypes.has(ConsentType.TCPA_CONNECT)).toBe(true);
  expect(consentTypes.has(ConsentType.CREDIT_SOFT_PULL)).toBe(true);
  expect(consentTypes.has(ConsentType.HPPA_OPTIN)).toBe(true);
  for (const record of identity.user.consentRecords) {
    expect(record.textShownSha256).toHaveLength(64);
  }
  expect(listing?.auction?.status).toBe(AuctionStatus.SCHEDULED);
});

async function demoCodeFromPage(page: Page) {
  const message = await page
    .getByText(/Demo code sent\. Use \d{6}\./)
    .textContent();
  const code = message?.match(/\d{6}/)?.[0];

  expect(code).toBeTruthy();

  return code ?? "";
}
