import {
  AuctionStatus,
  ListingStatus,
  PrismaClient,
  Role,
  StateStatus,
} from "@prisma/client";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { lenderListingSelect, lenderView } from "../../lib/dal/listings";
import { getLenderPortalData } from "../../lib/lender/portal";
import { borrowerIdentityVaultData } from "../../lib/security/borrower-identity-vault";
import { authorizePusherChannel } from "../../lib/services/auction";
import { setValidTestEnv } from "../helpers/env";

setValidTestEnv();

const prisma = new PrismaClient();
const piiPattern =
  /borrowerIdentity|firstName|lastName|email|phone|phoneVerifiedAt|streetAddress|street address/i;
let anonymityPhoneCounter = 0;

describe("security: anonymity boundary fuzz", () => {
  it("keeps lender DAL projections free of identity fields", () => {
    expect(JSON.stringify(lenderListingSelect)).not.toMatch(piiPattern);
  });

  it("keeps lender board payloads free of borrower identity fields", async () => {
    const org = await prisma.lenderOrg.findFirstOrThrow({
      where: { status: "APPROVED" },
    });
    const data = await getLenderPortalData(org.id);

    expect(JSON.stringify(data.auctions)).not.toMatch(piiPattern);
  });

  it("rejects cross-subscription to borrower realtime channels", () => {
    expect(
      authorizePusherChannel({
        channelName: "private-borrower-listing_a",
        listingId: "listing_b",
        role: Role.BORROWER,
      }),
    ).toBe(false);
  });

  it("rejects cross-subscription to lender realtime auction channels", () => {
    expect(
      authorizePusherChannel({
        auctionId: "auction_a",
        channelName: "private-lender-auction-auction_b",
        role: Role.LENDER,
      }),
    ).toBe(false);
    expect(
      authorizePusherChannel({
        auctionId: "auction_a",
        channelName: "private-lender-auction-auction_a",
        role: Role.LENDER,
      }),
    ).toBe(true);
    expect(
      authorizePusherChannel({
        auctionId: "auction_a",
        channelName: "private-lender-auction-auction_a",
        role: Role.BORROWER,
      }),
    ).toBe(false);
  });

  it.each([
    AuctionStatus.SCHEDULED,
    AuctionStatus.OPEN,
    AuctionStatus.CLOSED,
    AuctionStatus.REVEALED,
    AuctionStatus.EXPIRED,
  ])("keeps lender listing view anonymous for %s auctions", async (status) => {
    const fixture = await createAnonymityFixture(status);

    const view = await lenderView(
      {
        lenderOrgId: fixture.lenderOrgId,
        role: Role.LENDER,
        userId: `security-anon-lender:${fixture.suffix}`,
      },
      fixture.listingId,
    );
    const payload = JSON.stringify(view);

    expect(payload).not.toMatch(piiPattern);
    expect(payload).not.toContain(fixture.email);
    expect(payload).not.toContain(fixture.firstName);
    expect(payload).not.toContain(fixture.lastName);
    expect(payload).not.toContain(fixture.phone);
  });

  it("does not persist street address on Listing schema", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    const listingModel = schema.slice(
      schema.indexOf("model Listing"),
      schema.indexOf("model VerificationBundle"),
    );

    expect(listingModel).not.toMatch(/street|address/i);
  });
});

async function createAnonymityFixture(auctionStatus: AuctionStatus) {
  const suffix = `${Date.now()}${Math.random().toString(16).slice(2)}`;
  const email = `alice.${suffix}@borrower.vierates.local`;
  const firstName = `Alice${suffix.slice(0, 4)}`;
  const lastName = `Private${suffix.slice(-4)}`;
  anonymityPhoneCounter += 1;
  const phone = `312555${suffix.replace(/\D/g, "")}${anonymityPhoneCounter}`;

  await prisma.stateRule.upsert({
    create: { state: "IL", status: StateStatus.GREEN },
    update: { status: StateStatus.GREEN },
    where: { state: "IL" },
  });

  const borrower = await prisma.user.create({
    data: {
      borrowerIdentity: {
        create: borrowerIdentityVaultData({
          email,
          firstName,
          lastName,
          phone,
        }),
      },
      clerkId: `security-anon-borrower:${suffix}`,
      role: Role.BORROWER,
    },
  });
  const lenderOrg = await prisma.lenderOrg.create({
    data: {
      coverageBox: {
        create: {
          ficoMin: 620,
          loanMax: 1_000_000,
          loanMin: 50_000,
          ltvMaxBp: 9500,
          products: ["30Y_FIXED"],
          purposes: ["REFINANCE"],
          states: ["IL"],
        },
      },
      legalName: `Security Anon Lender ${suffix}`,
      nmlsId: `9${suffix.slice(-8)}`,
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
      status:
        auctionStatus === AuctionStatus.EXPIRED
          ? ListingStatus.EXPIRED
          : ListingStatus.IN_AUCTION,
      timeline: "ASAP",
    },
  });
  await prisma.auction.create({
    data: {
      closesAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      listingId: listing.id,
      opensAt: new Date(),
      status: auctionStatus,
    },
  });

  return {
    email,
    firstName,
    lastName,
    lenderOrgId: lenderOrg.id,
    listingId: listing.id,
    phone,
    suffix,
  };
}
