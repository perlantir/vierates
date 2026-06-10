import { expect, test } from "@playwright/test";

test("home page renders the foundation shell", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Lenders bid. You choose. Your name stays hidden until you do.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Example bid room")).toBeVisible();
});
