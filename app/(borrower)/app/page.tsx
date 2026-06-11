import { BorrowerDashboard } from "@/components/borrower/dashboard/borrower-dashboard";
import { FooterDisclosures } from "@/components/footer-disclosures";
import { NavBar } from "@/components/nav-bar";
import { getCurrentBorrowerUserId } from "@/lib/borrower/current";
import { getBorrowerDashboardData } from "@/lib/borrower/dashboard";

export const dynamic = "force-dynamic";

export default async function BorrowerDashboardPage() {
  const borrowerUserId = await getCurrentBorrowerUserId();
  const dashboard = borrowerUserId
    ? await getBorrowerDashboardData(borrowerUserId)
    : { listing: null };
  const listing = dashboard.listing
    ? {
        auction: dashboard.listing.auction
          ? {
              bestAprBp: dashboard.listing.auction.bestAprBp,
              bidCount: dashboard.listing.auction.bidCount,
              closesAt: dashboard.listing.auction.closesAt.toISOString(),
              id: dashboard.listing.auction.id,
              status: dashboard.listing.auction.status,
            }
          : null,
        connections: dashboard.listing.connections.map((connection) => ({
          createdAt: connection.createdAt.toISOString(),
          lenderName:
            connection.lenderOrg.dba ?? connection.lenderOrg.legalName,
          nmlsId: connection.lenderOrg.nmlsId,
          status: connection.status,
        })),
        county: dashboard.listing.county,
        creditBandStated: dashboard.listing.creditBandStated,
        id: dashboard.listing.id,
        incomeBandStated: dashboard.listing.incomeBandStated,
        loanAmount: dashboard.listing.loanAmount,
        ltvBand: dashboard.listing.ltvBand,
        propertyMatchOk: dashboard.listing.propertyMatchOk,
        propertyType: dashboard.listing.propertyType,
        purpose: dashboard.listing.purpose,
        rateWatchNurtureFlag: dashboard.listing.rateWatchNurtureFlag,
        state: dashboard.listing.state,
        status: dashboard.listing.status,
        timeline: dashboard.listing.timeline,
      }
    : null;

  return (
    <>
      <NavBar />
      <BorrowerDashboard listing={listing} />
      <FooterDisclosures />
    </>
  );
}
