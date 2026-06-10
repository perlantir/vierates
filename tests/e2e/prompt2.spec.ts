import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

process.env.DATABASE_URL ??=
  "postgresql://vierates:vierates@localhost:54329/vierates?schema=public";

const prisma = new PrismaClient();
const nextButton = { exact: true, name: "Next" };

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("home renders the live bid ledger", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Lenders bid. You choose. Your name stays hidden until you do.",
    }),
  ).toBeVisible();
  await expect(page.getByLabel("$450K · 30-yr fixed · 75% LTV")).toBeVisible();
  await expect(
    page.getByText("Example bids from participating lenders"),
  ).toBeVisible();
});

test("waitlist saves an email", async ({ page }) => {
  const email = `waitlist-${Date.now()}@example.com`;

  await page.goto("/waitlist");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Join waitlist" }).click();

  await expect(page.getByTestId("waitlist-success")).toBeVisible();

  const entry = await prisma.waitlistEntry.findUnique({ where: { email } });
  expect(entry?.email).toBe(email);
});

test("lender form writes application and consent record", async ({ page }) => {
  const timestamp = Date.now();
  const email = `lender-${timestamp}@example.com`;

  await page.goto("/lenders");
  await page
    .getByLabel("Organization legal name")
    .fill("Prompt Two Lending LLC");
  await page.getByRole("button", nextButton).click();
  await page.getByLabel("NMLS ID").fill(`${timestamp}`.slice(0, 7));
  await page.getByRole("button", nextButton).click();
  await page.getByRole("button", { name: "IL" }).click();
  await page.getByRole("button", nextButton).click();
  await page.getByLabel("Contact name").fill("Alex Morgan");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Direct line").fill("3125550188");
  await page.getByRole("button", nextButton).click();
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Apply to become a Founding Lender" })
    .click();

  await expect(
    page.getByText("Application queued for admin review."),
  ).toBeVisible();

  const application = await prisma.lenderApplication.findFirst({
    include: { consentRecord: true },
    where: { email },
  });
  expect(application?.consentRecord.textShownSha256).toHaveLength(64);
});

test("gated state shows waitlist screen", async ({ page }) => {
  await page.goto("/app/new?state=NY");

  await expect(page.getByTestId("gated-state")).toBeVisible();
  await expect(page.getByText("VieRates isn't live in NY yet.")).toBeVisible();
});
