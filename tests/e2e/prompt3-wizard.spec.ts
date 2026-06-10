import { ConsentType, PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

process.env.DATABASE_URL ??=
  "postgresql://vierates:vierates@localhost:54329/vierates?schema=public";

const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("borrower completes the listing wizard and writes SMS consent", async ({
  page,
}) => {
  const suffix = String(1000 + (Date.now() % 8000)).padStart(4, "0");
  const phone = `312777${suffix}`;

  await page.goto("/app/new");
  await page.getByRole("button", { name: "Lower my payment" }).click();
  await page.getByLabel("Street address").fill("123 Main St");
  await page.getByLabel("State").selectOption("IL");
  await page.getByRole("button", { name: "Match property" }).click();
  await page.getByRole("button", { name: "Single-family" }).click();
  await page.getByRole("button", { name: "I live there" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "6.5-7%" }).click();
  await page.getByRole("button", { name: "Good 700-739" }).click();
  await page.getByRole("button", { name: "$150k-$200k" }).click();
  await page.getByRole("button", { name: "ASAP" }).click();
  await page.getByLabel("Mobile phone").fill(phone);
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByLabel("Verification code").fill("123456");
  await page.getByRole("button", { name: "Verify and list me" }).click();

  await expect(page.getByTestId("listing-done")).toBeVisible();
  await expect(
    page.getByText("You are listed. Here is your market."),
  ).toBeVisible();

  const identity = await prisma.borrowerIdentity.findFirst({
    include: {
      user: {
        include: {
          consentRecords: true,
          listings: true,
        },
      },
    },
    where: { phone },
  });

  expect(identity?.user.listings.at(0)?.state).toBe("IL");
  expect(identity?.user.listings.at(0)?.propertyMatchOk).toBe(true);
  expect(
    identity?.user.consentRecords.some(
      (record) =>
        record.type === ConsentType.SMS_OPTIN &&
        record.textShownSha256.length === 64,
    ),
  ).toBe(true);

  const funnelEvent = await prisma.funnelEvent.findFirst({
    where: {
      event: "wizard_step_completed",
      step: "phone_otp",
    },
  });
  expect(funnelEvent?.id).toBeTruthy();
});
