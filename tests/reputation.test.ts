import { ConsentType, ListingStatus, PrismaClient, Role } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  createDisputeCase,
  createPostRevealRating,
  resolveDisputeCase,
} from "../lib/services/reputation";

process.env.DATABASE_URL ??=
  "postgresql://vierates:vierates@localhost:54329/vierates?schema=public";

const prisma = new PrismaClient();

describe("ratings and disputes", () => {
  it("requires reveal before rating and suspends repeat dispute violations", async () => {
    const suffix = String(Date.now());
    const borrower = await prisma.user.create({
      data: {
        clerkId: `reputation-borrower:${suffix}`,
        role: Role.BORROWER,
      },
    });
    const lender = await prisma.lenderOrg.create({
      data: {
        legalName: `Reputation Lender ${suffix}`,
        nmlsId: `4${suffix.slice(-7)}`,
        statesLicensed: ["IL"],
        status: "APPROVED",
      },
    });
    const listing = await prisma.listing.create({
      data: {
        borrowerUserId: borrower.id,
        county: "Cook",
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
        state: "IL",
        status: ListingStatus.MATCHED,
        timeline: "ASAP",
      },
    });
    const consent = await prisma.consentRecord.create({
      data: {
        grantedToLenderOrgId: lender.id,
        ip: "198.51.100.91",
        textShownSha256: "a".repeat(64),
        type: ConsentType.TCPA_REVEAL,
        userAgent: "vitest",
        userId: borrower.id,
      },
    });
    await prisma.identityGrant.create({
      data: {
        consentRecordId: consent.id,
        lenderOrgId: lender.id,
        listingId: listing.id,
      },
    });

    const rating = await createPostRevealRating(prisma, {
      borrowerUserId: borrower.id,
      lenderOrgId: lender.id,
      listingId: listing.id,
      stars: 4,
    });
    expect(rating.stars).toBe(4);

    const first = await createDisputeCase(prisma, {
      borrowerUserId: borrower.id,
      lenderOrgId: lender.id,
      listingId: listing.id,
      summary: "Final terms did not match the bid.",
      type: "BAIT_AND_SWITCH",
    });
    const second = await createDisputeCase(prisma, {
      borrowerUserId: borrower.id,
      lenderOrgId: lender.id,
      listingId: listing.id,
      summary: "Final terms changed again.",
      type: "BAIT_AND_SWITCH",
    });

    await resolveDisputeCase(prisma, {
      disputeId: first.id,
      resolution: "Borrower evidence accepted.",
    });
    await resolveDisputeCase(prisma, {
      disputeId: second.id,
      resolution: "Repeat issue accepted.",
    });

    const suspended = await prisma.lenderOrg.findUnique({
      where: { id: lender.id },
    });
    expect(suspended?.status).toBe("SUSPENDED");
  });
});
