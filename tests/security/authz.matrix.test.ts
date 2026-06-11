import { Role, StateStatus } from "@prisma/client";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { can } from "../../lib/authz";
import { getLenderPortalData } from "../../lib/lender/portal";
import { prisma } from "../../lib/prisma";

describe("security: authorization matrix", () => {
  const listing = {
    borrowerUserId: "borrower_a",
    loanAmount: 300000,
    purpose: "REFINANCE",
    state: "IL",
    stateStatus: StateStatus.GREEN,
    type: "listing" as const,
  };
  const coverageBox = {
    loanMax: 500000,
    loanMin: 100000,
    purposes: ["REFINANCE"],
    states: ["IL"],
  };

  it("keeps a repo-owned authorization matrix", () => {
    const matrix = readFileSync("docs/authorization-matrix.md", "utf8");

    for (const phrase of [
      "Unauthenticated",
      "Borrower",
      "Lender LO",
      "Lender org admin",
      "Pending lender org",
      "Admin",
    ]) {
      expect(matrix).toContain(phrase);
    }
  });

  it.each([
    {
      action: "listing:read" as const,
      actor: null,
      allowed: false,
      name: "unauthenticated actors fail closed",
      resource: listing,
    },
    {
      action: "listing:read" as const,
      actor: { role: Role.BORROWER, userId: "borrower_a" },
      allowed: true,
      name: "borrowers read own listings",
      resource: listing,
    },
    {
      action: "listing:update" as const,
      actor: { role: Role.BORROWER, userId: "borrower_b" },
      allowed: false,
      name: "borrowers cannot update other borrower listings",
      resource: listing,
    },
    {
      action: "listing:read:masked" as const,
      actor: { lenderOrgId: "org_a", role: Role.LENDER, userId: "lo_a" },
      allowed: true,
      name: "lenders can read masked covered green listings",
      resource: { ...listing, coverageBox },
    },
    {
      action: "listing:read:masked" as const,
      actor: { lenderOrgId: "org_a", role: Role.LENDER, userId: "lo_a" },
      allowed: false,
      name: "lenders cannot read masked non-green listings",
      resource: {
        ...listing,
        coverageBox,
        stateStatus: StateStatus.YELLOW,
      },
    },
    {
      action: "identity:read" as const,
      actor: { lenderOrgId: "org_a", role: Role.LENDER, userId: "lo_a" },
      allowed: false,
      name: "lenders cannot read identity before grant",
      resource: {
        borrowerUserId: "borrower_a",
        hasIdentityGrant: false,
        lenderOrgId: "org_a",
        type: "identity" as const,
      },
    },
    {
      action: "identity:read" as const,
      actor: { lenderOrgId: "org_a", role: Role.LENDER, userId: "lo_a" },
      allowed: true,
      name: "lenders can read identity after same-org grant",
      resource: {
        borrowerUserId: "borrower_a",
        hasIdentityGrant: true,
        lenderOrgId: "org_a",
        type: "identity" as const,
      },
    },
    {
      action: "billing:manage" as const,
      actor: {
        lenderOrgId: "org_a",
        orgRole: "LO" as const,
        role: Role.LENDER,
        userId: "lo_a",
      },
      allowed: false,
      name: "LOs cannot manage billing",
      resource: { lenderOrgId: "org_a", type: "lenderOrg" as const },
    },
    {
      action: "billing:manage" as const,
      actor: {
        lenderOrgId: "org_a",
        orgRole: "ORG_ADMIN" as const,
        role: Role.LENDER,
        userId: "admin_a",
      },
      allowed: true,
      name: "org admins can manage same-org billing",
      resource: { lenderOrgId: "org_a", type: "lenderOrg" as const },
    },
    {
      action: "wallet:read" as const,
      actor: {
        lenderOrgId: "org_b",
        orgRole: "ORG_ADMIN" as const,
        role: Role.LENDER,
        userId: "admin_b",
      },
      allowed: false,
      name: "lenders cannot read another org wallet",
      resource: { lenderOrgId: "org_a", type: "lenderOrg" as const },
    },
    {
      action: "stateRule:manage" as const,
      actor: { role: Role.ADMIN, userId: "admin" },
      allowed: true,
      name: "admins manage state rules",
      resource: { type: "admin" as const },
    },
  ])("$name", ({ action, actor, allowed, resource }) => {
    expect(can(actor, action, resource)).toBe(allowed);
  });

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
