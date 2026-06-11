import { Role, StateStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { can } from "../../lib/authz";
import { getLenderPortalData } from "../../lib/lender/portal";
import { prisma } from "../../lib/prisma";

describe("security: authorization matrix", () => {
  it("fails closed for borrower to admin and cross-owner listing access", () => {
    expect(
      can({ role: Role.BORROWER, userId: "borrower_a" }, "stateRule:manage", {
        type: "admin",
      }),
    ).toBe(false);
    expect(
      can({ role: Role.BORROWER, userId: "borrower_a" }, "listing:read", {
        borrowerUserId: "borrower_b",
        loanAmount: 300000,
        purpose: "REFINANCE",
        state: "IL",
        stateStatus: StateStatus.GREEN,
        type: "listing",
      }),
    ).toBe(false);
  });

  it("allows lender masked reads only inside green coverage", () => {
    const actor = { lenderOrgId: "org_a", role: Role.LENDER, userId: "lo_a" };
    const coverageBox = {
      loanMax: 500000,
      loanMin: 100000,
      purposes: ["REFINANCE"],
      states: ["IL"],
    };

    expect(
      can(actor, "listing:read:masked", {
        borrowerUserId: "borrower_a",
        coverageBox,
        loanAmount: 300000,
        purpose: "REFINANCE",
        state: "IL",
        stateStatus: StateStatus.GREEN,
        type: "listing",
      }),
    ).toBe(true);
    expect(
      can(actor, "listing:read:masked", {
        borrowerUserId: "borrower_a",
        coverageBox,
        loanAmount: 300000,
        purpose: "REFINANCE",
        state: "NY",
        stateStatus: StateStatus.YELLOW,
        type: "listing",
      }),
    ).toBe(false);
  });

  it("blocks pending lender orgs from board data", async () => {
    const org = await prisma.lenderOrg.create({
      data: {
        legalName: `Pending Matrix ${Date.now()}`,
        nmlsId: `3${String(Date.now()).slice(-7)}`,
        statesLicensed: ["IL"],
        status: "PENDING",
      },
    });

    const data = await getLenderPortalData(org.id);

    expect(data.auctions).toEqual([]);
  });
});
