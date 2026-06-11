import { LenderDirectory } from "@/components/borrower/connect/lender-directory";
import { FooterDisclosures } from "@/components/footer-disclosures";
import { NavBar } from "@/components/nav-bar";
import { getConnectDirectoryData } from "@/lib/borrower/connect";
import { getCurrentBorrowerUserId } from "@/lib/borrower/current";

export const dynamic = "force-dynamic";

export default async function BorrowerLendersPage() {
  const borrowerUserId = await getCurrentBorrowerUserId();
  const directory = borrowerUserId
    ? await getConnectDirectoryData(borrowerUserId)
    : { lenders: [], listing: null };

  const listing = directory.listing
    ? {
        connections: directory.listing.connections.map((connection) => ({
          createdAt: connection.createdAt.toISOString(),
          id: connection.id,
          lenderName:
            connection.lenderOrg.dba ?? connection.lenderOrg.legalName,
          nmlsId: connection.lenderOrg.nmlsId,
          status: connection.status,
        })),
        id: directory.listing.id,
        loanAmount: directory.listing.loanAmount,
        purpose: directory.listing.purpose,
        state: directory.listing.state,
      }
    : null;

  const lenders = directory.lenders.map((lender) => {
    const ratingAverage =
      lender.ratings.length > 0
        ? lender.ratings.reduce((sum, rating) => sum + rating.stars, 0) /
          lender.ratings.length
        : null;

    return {
      avgResponseTime: "[STAT]",
      id: lender.id,
      legalName: lender.legalName,
      nmlsId: lender.nmlsId,
      rating: ratingAverage ? ratingAverage.toFixed(1) : "New",
      specialties: lender.coverageBox?.products ?? ["30Y_FIXED"],
      statesLicensed: lender.statesLicensed,
    };
  });

  return (
    <>
      <NavBar />
      <LenderDirectory lenders={lenders} listing={listing} />
      <FooterDisclosures />
    </>
  );
}
