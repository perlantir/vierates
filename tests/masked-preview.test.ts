import { describe, expect, it } from "vitest";

import { maskedPreviewFromLenderView } from "../lib/borrower/masked-preview";
import type { LenderListingView } from "../lib/dal/listings";

describe("masked borrower preview", () => {
  it("is derived from the lender DAL output without identity fields", () => {
    const lenderViewListing = {
      auction: {
        bestAprBp: null,
        bidCount: 0,
        closesAt: new Date("2026-06-12T12:00:00.000Z"),
        id: "auction_1",
        opensAt: new Date("2026-06-10T12:00:00.000Z"),
        status: "SCHEDULED",
      },
      county: "Cook",
      createdAt: new Date("2026-06-10T12:00:00.000Z"),
      creditBandStated: "740_PLUS",
      currentRateBand: "6_5_TO_7",
      estValueBand: "$550k-$600k",
      id: "listing_1",
      incomeBandStated: "200K_PLUS",
      loanAmount: 360000,
      ltvBand: "60-70",
      occupancy: "PRIMARY",
      propertyMatchOk: true,
      propertyType: "SINGLE_FAMILY",
      purpose: "REFINANCE",
      state: "IL",
      status: "LIVE",
      timeline: "ASAP",
      verificationBundle: {
        creditBandVerified: "740_PLUS",
        dtiBand: "25-30",
        incomeVerifiedAt: new Date("2026-06-10T13:00:00.000Z"),
        scoreModel: "FICO_10T_SANDBOX",
        status: "VERIFIED",
      },
    } satisfies LenderListingView;

    const preview = maskedPreviewFromLenderView(lenderViewListing);

    expect(Object.keys(preview)).not.toEqual(
      expect.arrayContaining([
        "borrowerIdentity",
        "email",
        "firstName",
        "lastName",
        "phone",
      ]),
    );
    expect(preview).toMatchInlineSnapshot(`
      {
        "county": "Cook",
        "creditBandVerified": "740_PLUS",
        "dtiBand": "25-30",
        "hiddenFields": [
          "Name",
          "Phone",
          "Street address",
        ],
        "incomeVerifiedAt": "2026-06-10T13:00:00.000Z",
        "loanAmount": 360000,
        "ltvBand": "60-70",
        "occupancy": "PRIMARY",
        "propertyType": "SINGLE_FAMILY",
        "purpose": "REFINANCE",
        "state": "IL",
      }
    `);
  });
});
