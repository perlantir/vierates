import { FooterDisclosures } from "@/components/footer-disclosures";
import { LenderPortal } from "@/components/lender/portal/lender-portal";
import { NavBar } from "@/components/nav-bar";
import { getCurrentLenderOrgId } from "@/lib/lender/current";
import { getLenderPortalData } from "@/lib/lender/portal";

export default async function LenderPage() {
  const lenderOrgId = await getCurrentLenderOrgId();
  const data = lenderOrgId
    ? await getLenderPortalData(lenderOrgId)
    : { auctions: [], bids: [], org: null, wallet: null };

  const auctions = data.auctions.map((listing) => ({
    auction: listing.auction
      ? {
          bestAprBp: listing.auction.bestAprBp,
          bidCount: listing.auction.bidCount,
          closesAt: listing.auction.closesAt.toISOString(),
          id: listing.auction.id,
          status: listing.auction.status,
        }
      : null,
    county: listing.county,
    creditBandStated:
      listing.verificationBundle?.creditBandVerified ??
      listing.creditBandStated,
    dtiBand: listing.verificationBundle?.dtiBand,
    id: listing.id,
    loanAmount: listing.loanAmount,
    ltvBand: listing.ltvBand,
    occupancy: listing.occupancy,
    propertyType: listing.propertyType,
    purpose: listing.purpose,
    state: listing.state,
  }));
  const bids = data.bids.map((bid) => ({
    aprBp: bid.aprBp,
    auctionListingId: bid.auction.listingId,
    id: bid.id,
    product: bid.product,
    rateBp: bid.rateBp,
    status: bid.status,
  }));
  const wallet = data.wallet
    ? {
        balance: data.wallet.balance,
        plan: data.wallet.plan,
        transactions: data.wallet.transactions.map((txn) => ({
          createdAt: txn.createdAt.toISOString(),
          delta: txn.delta,
          id: txn.id,
          reason: txn.reason,
        })),
      }
    : null;

  return (
    <>
      <NavBar />
      <LenderPortal
        auctions={auctions}
        bids={bids}
        org={
          data.org
            ? { legalName: data.org.legalName, status: data.org.status }
            : null
        }
        wallet={wallet}
      />
      <FooterDisclosures />
    </>
  );
}
