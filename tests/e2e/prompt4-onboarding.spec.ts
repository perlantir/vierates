import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

process.env.DATABASE_URL ??=
  "postgresql://vierates:vierates@localhost:54329/vierates?schema=public";

const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("lender onboarding creates a pending org with coverage and invite", async ({
  page,
}) => {
  const suffix = String(Date.now()).slice(-7);
  const nmlsId = `9${suffix}`;
  const adminEmail = `org-admin-${suffix}@example.com`;
  const inviteEmail = `loan-officer-${suffix}@example.com`;

  await page.goto("/lender/onboarding");
  await page
    .getByLabel("Organization legal name")
    .fill("Prompt Four Lending LLC");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("DBA").fill("Prompt Four");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("NMLS ID").fill(nmlsId);
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Org admin email").fill(adminEmail);
  await page.getByLabel("Invite LO email").fill(inviteEmail);
  await page.getByRole("button", { exact: true, name: "PRO" }).click();
  await page.getByRole("button", { name: "Submit for approval" }).click();

  await expect(
    page.getByText("Submitted for admin approval. Status: PENDING."),
  ).toBeVisible();

  const org = await prisma.lenderOrg.findUnique({
    include: {
      coverageBox: true,
      invites: true,
      wallet: true,
    },
    where: { nmlsId },
  });

  expect(org?.status).toBe("PENDING");
  expect(org?.coverageBox?.states).toContain("IL");
  expect(org?.wallet?.plan).toBe("PRO");
  expect(org?.wallet?.balance).toBe(0);
  expect(org?.invites.at(0)?.email).toBe(inviteEmail);
});
