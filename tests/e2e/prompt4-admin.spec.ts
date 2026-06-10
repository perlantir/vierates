import { expect, test } from "@playwright/test";

test("admin console renders operational queues", async ({ page }) => {
  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: "Admin console" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Lender approval queue" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "State launch editor" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Manual review" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Auction monitor" }),
  ).toBeVisible();
});
