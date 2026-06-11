import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

process.env.DATABASE_URL ??=
  "postgresql://vierates:vierates@localhost:54329/vierates?schema=public";

const prisma = new PrismaClient();
const foundingLenderStepButtons = [
  "Save organization name",
  "Save NMLS ID",
  "Save licensed states",
  "Save contact details",
];

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("home renders the live bid ledger", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Lenders compete. You stay anonymous. You choose.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Example bids" }),
  ).toBeVisible();
  await expect(page.getByText("FICO 740+").first()).toBeVisible();
  await expect(
    page.getByText("Illustrative bids as of June 11, 2026"),
  ).toBeVisible();
});

test("waitlist saves an email", async ({ page }) => {
  const email = `waitlist-${Date.now()}@example.com`;

  await page.goto("/waitlist");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("State").selectOption("IL");
  await page.getByRole("button", { name: "Join waitlist" }).click();

  await expect(page.getByTestId("waitlist-success")).toBeVisible();

  const entry = await prisma.waitlistEntry.findUnique({ where: { email } });
  expect(entry?.email).toBe(email);
  expect(entry?.source).toContain("state:IL");
});

test("lender form writes application and consent record", async ({ page }) => {
  const timestamp = Date.now();
  const email = `lender-${timestamp}@example.com`;

  await page.goto("/lenders");
  await page
    .getByLabel("Organization legal name")
    .fill("Prompt Two Lending LLC");
  await page
    .getByRole("button", { name: foundingLenderStepButtons[0] })
    .click();
  await page.getByLabel("NMLS ID").fill(`${timestamp}`.slice(0, 7));
  await page
    .getByRole("button", { name: foundingLenderStepButtons[1] })
    .click();
  await page.getByRole("button", { name: "IL" }).click();
  await page
    .getByRole("button", { name: foundingLenderStepButtons[2] })
    .click();
  await page.getByLabel("Contact name").fill("Alex Morgan");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Direct line").fill("3125550188");
  await page
    .getByRole("button", { name: foundingLenderStepButtons[3] })
    .click();
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
