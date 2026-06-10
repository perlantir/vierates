import { AuctionStatus, Role } from "@prisma/client";

export type AuctionEvent = "open" | "close" | "pick" | "expire" | "cancel";

export const allowedAuctionTransitions: Record<
  AuctionStatus,
  readonly AuctionEvent[]
> = {
  [AuctionStatus.SCHEDULED]: ["open", "cancel"],
  [AuctionStatus.OPEN]: ["close", "cancel"],
  [AuctionStatus.CLOSED]: ["pick", "expire", "cancel"],
  [AuctionStatus.REVEALED]: [],
  [AuctionStatus.EXPIRED]: [],
  [AuctionStatus.CANCELLED]: [],
};

const transitionTargets: Record<AuctionEvent, AuctionStatus> = {
  cancel: AuctionStatus.CANCELLED,
  close: AuctionStatus.CLOSED,
  expire: AuctionStatus.EXPIRED,
  open: AuctionStatus.OPEN,
  pick: AuctionStatus.REVEALED,
};

export function transitionAuctionStatus(
  current: AuctionStatus,
  event: AuctionEvent,
  actorRole: Role | "SYSTEM" = "SYSTEM",
): AuctionStatus {
  if (event === "cancel" && actorRole !== Role.ADMIN) {
    throw new Error("Only admins can cancel auctions");
  }

  if (!allowedAuctionTransitions[current].includes(event)) {
    throw new Error(`Cannot ${event} auction from ${current}`);
  }

  return transitionTargets[event];
}
