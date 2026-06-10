import { describe, expect, it } from "vitest";

import {
  borrowerIdentityFieldNames,
  lenderListingSelect,
  lenderViewTypeHasNoIdentityKeys,
  type LenderListingView,
} from "../lib/dal/listings";

describe("lenderView masking", () => {
  it("uses a projection that cannot select borrower identity fields", () => {
    const serializedSelect = JSON.stringify(lenderListingSelect);

    for (const field of borrowerIdentityFieldNames) {
      expect(serializedSelect).not.toContain(field);
    }

    expect(lenderViewTypeHasNoIdentityKeys).toBeNull();
  });

  it("returns a masked shape without identity fields", () => {
    const maskedListing = {
      id: "listing_1",
      status: "IN_AUCTION",
      purpose: "REFINANCE",
      propertyType: "SINGLE_FAMILY",
      occupancy: "PRIMARY",
      state: "IL",
      county: "Cook",
      estValueBand: "$400k-$450k",
      loanAmount: 320000,
      ltvBand: "70-80",
      currentRateBand: "6.5-7",
      creditBandStated: "700-739",
      incomeBandStated: "$150k-$200k",
      timeline: "ASAP",
      propertyMatchOk: true,
      createdAt: new Date("2026-06-10T00:00:00.000Z"),
      verificationBundle: {
        creditBandVerified: "700-739",
        scoreModel: "FICO_10T",
        dtiBand: "30-35",
        incomeVerifiedAt: new Date("2026-06-10T00:00:00.000Z"),
        status: "VERIFIED",
      },
      auction: {
        id: "auction_1",
        status: "OPEN",
        opensAt: new Date("2026-06-10T00:00:00.000Z"),
        closesAt: new Date("2026-06-12T00:00:00.000Z"),
        bestAprBp: 632,
        bidCount: 3,
      },
    } satisfies LenderListingView;

    const serialized = JSON.stringify(maskedListing);

    for (const field of borrowerIdentityFieldNames) {
      expect(serialized).not.toContain(field);
    }
  });
});
