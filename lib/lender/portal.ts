import { AuctionStatus, ListingStatus, StateStatus } from "@prisma/client";

import { lenderListingSelect } from "@/lib/dal/listings";
import { prisma } from "@/lib/prisma";

export type LenderPortalData = Awaited<ReturnType<typeof getLenderPortalData>>;

export async function getLenderPortalData(lenderOrgId: string) {
  const org = await prisma.lenderOrg.findUnique({
    include: {
      coverageBox: true,
      wallet: {
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      },
    },
    where: { id: lenderOrgId },
  });

  if (!org || org.status !== "APPROVED" || !org.coverageBox) {
    return { auctions: [], bids: [], org, wallet: org?.wallet ?? null };
  }

  const greenRules = await prisma.stateRule.findMany({
    select: { state: true },
    where: { status: StateStatus.GREEN },
  });
  const greenStates = new Set(greenRules.map((rule) => rule.state));
  const allowedStates = org.coverageBox.states.filter((state) =>
    greenStates.has(state),
  );

  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    select: lenderListingSelect,
    where: {
      auction: {
        status: {
          in: [
            AuctionStatus.SCHEDULED,
            AuctionStatus.OPEN,
            AuctionStatus.CLOSED,
          ],
        },
      },
      deletedAt: null,
      loanAmount: {
        gte: org.coverageBox.loanMin,
        lte: org.coverageBox.loanMax,
      },
      purpose: { in: org.coverageBox.purposes },
      state: { in: allowedStates },
      status: {
        in: [
          ListingStatus.LIVE,
          ListingStatus.IN_AUCTION,
          ListingStatus.MATCHED,
        ],
      },
    },
    take: 20,
  });

  const bids = await prisma.bid.findMany({
    include: {
      auction: {
        select: {
          listingId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    where: { lenderOrgId },
  });

  return {
    auctions: listings,
    bids,
    org,
    wallet: org.wallet,
  };
}
