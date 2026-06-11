import { describe, expect, it } from "vitest";

import {
  allowedFunnelMetadataKeys,
  funnelEvents,
} from "@/lib/analytics/events";

const conversionSpecEvents = [
  "page_view",
  "wizard_started",
  "wizard_step_viewed",
  "wizard_step_completed",
  "wizard_abandoned",
  "listing_published",
  "doors_viewed",
  "door_selected",
  "verify_started",
  "verify_credit_done",
  "verify_income_done",
  "masked_preview_confirmed",
  "auction_scheduled",
  "first_bid_received",
  "bidroom_opened",
  "auction_closed",
  "compare_viewed",
  "pick_confirmed",
  "reveal_completed",
  "pick_expired",
  "ratewatch_enabled",
  "board_viewed",
  "bid_composer_opened",
  "bid_placed",
  "bid_improved",
  "connection_purchased",
  "roi_viewed",
] as const;

describe("conversion analytics taxonomy", () => {
  it("keeps the conversion spec event list wired as a shared contract", () => {
    expect(funnelEvents).toEqual(conversionSpecEvents);
  });

  it("keeps funnel metadata useful without allowing contact PII", () => {
    expect(allowedFunnelMetadataKeys).toEqual(
      new Set([
        "auctionId",
        "bidAttempt",
        "bidId",
        "bidsVisible",
        "count",
        "door",
        "field",
        "gated",
        "lenderOrgId",
        "listingId",
        "path",
        "propertyMatchOk",
        "reason",
        "source",
        "state",
        "status",
        "surface",
      ]),
    );

    expect(allowedFunnelMetadataKeys.has("address")).toBe(false);
    expect(allowedFunnelMetadataKeys.has("email")).toBe(false);
    expect(allowedFunnelMetadataKeys.has("phone")).toBe(false);
    expect(allowedFunnelMetadataKeys.has("streetAddress")).toBe(false);
  });
});
