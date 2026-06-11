import { Role, StateStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { can } from "../../lib/authz";
import { getLenderPortalData } from "../../lib/lender/portal";
import { prisma } from "../../lib/prisma";

describe("security: authorization matrix", () => {
  it("fails closed for unauthenticated actors", () => {
    expect(
      can(null, "listing:read", {
        borrowerUserId: "borrower_a",
        loanAmount: 300000,
        purpose: "REFINANCE",
        state: "IL",
        stateStatus: StateStatus.GREEN,
        type: "listing",
      }),
    ).toBe(false);
  });

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

  it("allows borrowers to read and update only their own listings", () => {
    const ownListing = {
      borrowerUserId: "borrower_a",
      loanAmount: 300000,
      purpose: "REFINANCE",
      state: "IL",
      stateStatus: StateStatus.GREEN,
      type: "listing" as const,
    };
    const actor = { role: Role.BORROWER, userId: "borrower_a" };

    expect(can(actor, "listing:read", ownListing)).toBe(true);
    expect(can(actor, "listing:update", ownListing)).toBe(true);
    expect(
      can(actor, "listing:update", {
        ...ownListing,
        borrowerUserId: "borrower_b",
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

  it("enforces identity grant boundaries for borrowers and lenders", () => {
    expect(
      can({ role: Role.BORROWER, userId: "borrower_a" }, "identity:read", {
        borrowerUserId: "borrower_a",
        hasIdentityGrant: false,
        lenderOrgId: "org_a",
        type: "identity",
      }),
    ).toBe(true);
    expect(
      can(
        { lenderOrgId: "org_a", role: Role.LENDER, userId: "lo_a" },
        "identity:read",
        {
          borrowerUserId: "borrower_a",
          hasIdentityGrant: false,
          lenderOrgId: "org_a",
          type: "identity",
        },
      ),
    ).toBe(false);
    expect(
      can(
        { lenderOrgId: "org_a", role: Role.LENDER, userId: "lo_a" },
        "identity:read",
        {
          borrowerUserId: "borrower_a",
          hasIdentityGrant: true,
          lenderOrgId: "org_a",
          type: "identity",
        },
      ),
    ).toBe(true);
    expect(
      can(
        { lenderOrgId: "org_b", role: Role.LENDER, userId: "lo_b" },
        "identity:read",
        {
          borrowerUserId: "borrower_a",
          hasIdentityGrant: true,
          lenderOrgId: "org_a",
          type: "identity",
        },
      ),
    ).toBe(false);
  });

  it("separates lender wallet visibility from billing management", () => {
    expect(
      can(
        {
          lenderOrgId: "org_a",
          orgRole: "LO",
          role: Role.LENDER,
          userId: "lo_a",
        },
        "wallet:read",
        { lenderOrgId: "org_a", type: "lenderOrg" },
      ),
    ).toBe(true);
    expect(
      can(
        {
          lenderOrgId: "org_a",
          orgRole: "LO",
          role: Role.LENDER,
          userId: "lo_a",
        },
        "billing:manage",
        { lenderOrgId: "org_a", type: "lenderOrg" },
      ),
    ).toBe(false);
    expect(
      can(
        {
          lenderOrgId: "org_a",
          orgRole: "ORG_ADMIN",
          role: Role.LENDER,
          userId: "admin_a",
        },
        "billing:manage",
        { lenderOrgId: "org_a", type: "lenderOrg" },
      ),
    ).toBe(true);
    expect(
      can(
        {
          lenderOrgId: "org_b",
          orgRole: "ORG_ADMIN",
          role: Role.LENDER,
          userId: "admin_b",
        },
        "wallet:read",
        { lenderOrgId: "org_a", type: "lenderOrg" },
      ),
    ).toBe(false);
  });

  it("allows admins through admin-only resource actions", () => {
    const actor = { role: Role.ADMIN, userId: "admin" };

    expect(can(actor, "stateRule:manage", { type: "admin" })).toBe(true);
    expect(can(actor, "approval:manage", { type: "admin" })).toBe(true);
    expect(can(actor, "dispute:manage", { type: "admin" })).toBe(true);
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
