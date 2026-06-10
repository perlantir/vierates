import { AuctionStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  allowedAuctionTransitions,
  transitionAuctionStatus,
} from "../lib/services/auction/state";

const allStatuses = Object.values(AuctionStatus);
const allEvents = ["open", "close", "pick", "expire", "cancel"] as const;

describe("auction state machine", () => {
  it("allows the marketplace lifecycle transitions", () => {
    expect(transitionAuctionStatus(AuctionStatus.SCHEDULED, "open")).toBe(
      AuctionStatus.OPEN,
    );
    expect(transitionAuctionStatus(AuctionStatus.OPEN, "close")).toBe(
      AuctionStatus.CLOSED,
    );
    expect(transitionAuctionStatus(AuctionStatus.CLOSED, "pick")).toBe(
      AuctionStatus.REVEALED,
    );
    expect(transitionAuctionStatus(AuctionStatus.CLOSED, "expire")).toBe(
      AuctionStatus.EXPIRED,
    );
  });

  it("rejects every illegal transition explicitly", () => {
    for (const status of allStatuses) {
      for (const event of allEvents) {
        const allowed = allowedAuctionTransitions[status].includes(event);

        if (allowed) {
          expect(() =>
            transitionAuctionStatus(
              status,
              event,
              event === "cancel" ? "ADMIN" : "SYSTEM",
            ),
          ).not.toThrow();
        } else {
          expect(() =>
            transitionAuctionStatus(
              status,
              event,
              event === "cancel" ? "ADMIN" : "SYSTEM",
            ),
          ).toThrow(`Cannot ${event} auction from ${status}`);
        }
      }
    }
  });

  it("restricts cancellation to admins", () => {
    expect(() =>
      transitionAuctionStatus(AuctionStatus.OPEN, "cancel", "LENDER"),
    ).toThrow("Only admins can cancel auctions");

    expect(transitionAuctionStatus(AuctionStatus.OPEN, "cancel", "ADMIN")).toBe(
      AuctionStatus.CANCELLED,
    );
  });
});
