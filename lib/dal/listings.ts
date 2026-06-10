import {
  BidStatus,
  ListingStatus,
  StateStatus,
  type Prisma,
} from "@prisma/client";

import { can, type Actor } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const borrowerListingInclude = {
  borrower: {
    include: {
      borrowerIdentity: true,
    },
  },
  verificationBundle: true,
  auction: {
    include: {
      bids: true,
    },
  },
} satisfies Prisma.ListingInclude;

export const lenderListingSelect = {
  id: true,
  status: true,
  purpose: true,
  propertyType: true,
  occupancy: true,
  state: true,
  county: true,
  estValueBand: true,
  loanAmount: true,
  ltvBand: true,
  currentRateBand: true,
  creditBandStated: true,
  incomeBandStated: true,
  timeline: true,
  propertyMatchOk: true,
  createdAt: true,
  verificationBundle: {
    select: {
      creditBandVerified: true,
      scoreModel: true,
      dtiBand: true,
      incomeVerifiedAt: true,
      status: true,
    },
  },
  auction: {
    select: {
      id: true,
      status: true,
      opensAt: true,
      closesAt: true,
      bestAprBp: true,
      bidCount: true,
    },
  },
} satisfies Prisma.ListingSelect;

export type BorrowerListingView = Prisma.ListingGetPayload<{
  include: typeof borrowerListingInclude;
}>;

export type LenderListingView = Prisma.ListingGetPayload<{
  select: typeof lenderListingSelect;
}>;

export const borrowerIdentityFieldNames = [
  "borrower",
  "borrowerIdentity",
  "firstName",
  "lastName",
  "email",
  "phone",
  "phoneVerifiedAt",
] as const;

type BorrowerIdentityField = (typeof borrowerIdentityFieldNames)[number];
type ForbiddenLenderTopLevelKeys = Extract<
  keyof LenderListingView,
  BorrowerIdentityField
>;
type AssertNever<T extends never> = T;
type NoForbiddenLenderTopLevelKeys = AssertNever<ForbiddenLenderTopLevelKeys>;

export const lenderViewTypeHasNoIdentityKeys: NoForbiddenLenderTopLevelKeys | null =
  null;

export async function borrowerView(
  borrowerUserId: string,
  listingId: string,
): Promise<BorrowerListingView | null> {
  return prisma.listing.findFirst({
    where: {
      id: listingId,
      borrowerUserId,
    },
    include: borrowerListingInclude,
  });
}

export async function lenderView(
  actor: Actor,
  listingId: string,
): Promise<LenderListingView | null> {
  if (actor.role !== "LENDER" || !actor.lenderOrgId) {
    return null;
  }

  const [listing, coverageBox] = await Promise.all([
    prisma.listing.findFirst({
      where: {
        id: listingId,
        status: {
          in: [
            ListingStatus.LIVE,
            ListingStatus.IN_AUCTION,
            ListingStatus.MATCHED,
          ],
        },
      },
      select: lenderListingSelect,
    }),
    prisma.coverageBox.findUnique({
      where: {
        lenderOrgId: actor.lenderOrgId,
      },
      select: {
        states: true,
        purposes: true,
        loanMin: true,
        loanMax: true,
      },
    }),
  ]);

  if (!listing || !coverageBox) {
    return null;
  }

  const stateRule = await prisma.stateRule.findUnique({
    where: {
      state: listing.state,
    },
  });

  const allowed = can(actor, "listing:read:masked", {
    type: "listing",
    borrowerUserId: "",
    state: listing.state,
    purpose: listing.purpose,
    loanAmount: listing.loanAmount,
    stateStatus: stateRule?.status ?? StateStatus.YELLOW,
    coverageBox,
  });

  return allowed ? listing : null;
}

export function isActiveBidStatus(status: BidStatus): boolean {
  return status === BidStatus.ACTIVE || status === BidStatus.IMPROVED;
}
