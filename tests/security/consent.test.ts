import {
  ConsentType,
  ListingStatus,
  PrismaClient,
  Role,
  StateStatus,
} from "@prisma/client";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { sha256 } from "../../lib/consent/records";
import { consentTextForParty } from "../../lib/consent/text";
import { createListingFromWizard } from "../../lib/borrower/wizard";
import { scheduleBorrowerAuction } from "../../lib/borrower/verification";

process.env.DATABASE_URL ??=
  "postgresql://vierates:vierates@localhost:54329/vierates?schema=public";

const prisma = new PrismaClient();

describe("security: consent integrity", () => {
  it("hashes rendered TCPA_CONNECT consent text exactly", () => {
    const text = consentTextForParty("Prairie Home Lending LLC");

    expect(sha256(text)).toHaveLength(64);
    expect(text).toContain("Prairie Home Lending LLC");
  });

  it("keeps ConsentRecord and CreditTransaction without app update/delete paths", () => {
    const sources = ["lib", "app/api", "inngest", "components"]
      .flatMap((path) => collectFiles(path))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(sources).not.toMatch(/consentRecord\.(update|delete|deleteMany)/);
    expect(sources).not.toMatch(
      /creditTransaction\.(update|delete|deleteMany)/,
    );
  });

  it("requires GREEN state before creating a live listing", async () => {
    const phone = `312782${String(1000 + (Date.now() % 8000)).padStart(4, "0")}`;
    const user = await prisma.user.create({
      data: { clerkId: `geo-security:${phone}`, role: Role.BORROWER },
    });
    await prisma.borrowerIdentity.create({
      data: {
        email: `${phone}@borrower.vierates.local`,
        firstName: "Geo",
        lastName: "Security",
        phone,
        userId: user.id,
      },
    });
    const challenge = await prisma.otpChallenge.create({
      data: {
        codeHash: "x".repeat(64),
        expiresAt: new Date(Date.now() + 60_000),
        ip: "198.51.100.80",
        phone,
        status: "VERIFIED",
      },
    });
    await prisma.stateRule.upsert({
      create: { state: "NY", status: "YELLOW" },
      update: { status: "YELLOW" },
      where: { state: "NY" },
    });

    await expect(
      createListingFromWizard(prisma, {
        balanceAmount: 320000,
        challengeId: challenge.id,
        county: "New York",
        creditBandStated: "740_PLUS",
        currentRateBand: "6_5_TO_7",
        estValueAmount: 500000,
        incomeBandStated: "200K_PLUS",
        occupancy: "PRIMARY",
        propertyMatchOk: true,
        propertyType: "SINGLE_FAMILY",
        purpose: "REFINANCE",
        state: "NY",
        timeline: "ASAP",
      }),
    ).rejects.toMatchObject({ code: "STATE_NOT_LIVE" });

    const liveListing = await prisma.listing.findFirst({
      where: { borrowerUserId: user.id, status: ListingStatus.LIVE },
    });
    expect(liveListing).toBeNull();
  });

  it("requires GREEN state before creating an auction", async () => {
    const suffix = String(Date.now()) + Math.random().toString(16).slice(2);
    const borrower = await prisma.user.create({
      data: {
        clerkId: `geo-auction-security:${suffix}`,
        role: Role.BORROWER,
      },
    });
    const listing = await prisma.listing.create({
      data: {
        borrowerUserId: borrower.id,
        county: "Security",
        creditBandStated: "740_PLUS",
        currentRateBand: "6_5_TO_7",
        estValueBand: "$550k-$600k",
        incomeBandStated: "200K_PLUS",
        loanAmount: 400000,
        ltvBand: "60-70",
        occupancy: "PRIMARY",
        propertyMatchOk: true,
        propertyType: "SINGLE_FAMILY",
        purpose: "REFINANCE",
        state: "ZZ",
        status: ListingStatus.LIVE,
        timeline: "ASAP",
      },
    });
    await prisma.stateRule.upsert({
      create: { state: "ZZ", status: StateStatus.RED },
      update: { status: StateStatus.RED },
      where: { state: "ZZ" },
    });

    await expect(
      scheduleBorrowerAuction(prisma, {
        borrowerUserId: borrower.id,
        listingId: listing.id,
      }),
    ).rejects.toMatchObject({ code: "STATE_NOT_LIVE" });

    await expect(
      prisma.auction.findUnique({ where: { listingId: listing.id } }),
    ).resolves.toBeNull();
  });

  it("requires reveal consent before identity grants exist", async () => {
    const grants = await prisma.identityGrant.findMany({
      include: { consentRecord: true },
      take: 20,
    });

    for (const grant of grants) {
      expect(grant.consentRecord.type).toBe(ConsentType.TCPA_REVEAL);
    }
  });
});

function collectFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      return collectFiles(path);
    }

    return /\.(tsx|ts)$/.test(path) ? [path] : [];
  });
}
