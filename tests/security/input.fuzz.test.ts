import { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { POST as lenderOnboarding } from "../../app/api/lender/onboarding/route";
import { POST as waitlistPost } from "../../app/api/waitlist/route";

process.env.DATABASE_URL ??=
  "postgresql://vierates:vierates@localhost:54329/vierates?schema=public";

const prisma = new PrismaClient();

describe("security: input and mass-assignment fuzz", () => {
  it("rejects malformed API payloads", async () => {
    const response = await waitlistPost(
      new Request("http://localhost/api/waitlist", {
        body: JSON.stringify({
          email: "not-an-email",
          source: "x".repeat(200),
        }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("ignores client-supplied lender status and wallet balance", async () => {
    const suffix = String(Date.now()).slice(-7);
    const nmlsId = `1${suffix}`;
    const response = await lenderOnboarding(
      new Request("http://localhost/api/lender/onboarding", {
        body: JSON.stringify({
          coverage: {
            ficoMin: 660,
            loanMax: 900000,
            loanMin: 150000,
            ltvMaxBp: 8500,
            products: ["30Y_FIXED"],
            purposes: ["REFINANCE"],
            states: ["IL"],
          },
          legalName: "Mass Assignment Lending",
          nmlsId,
          orgAdminEmail: `mass-${suffix}@example.com`,
          plan: "PRO",
          statesLicensed: ["IL"],
          status: "APPROVED",
          wallet: { balance: 9999 },
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    const org = await prisma.lenderOrg.findUnique({
      include: { wallet: true },
      where: { nmlsId },
    });

    expect(org?.status).toBe("PENDING");
    expect(org?.wallet?.balance).toBe(0);
  });
});
