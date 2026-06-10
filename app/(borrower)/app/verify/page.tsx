import { VerificationFlow } from "@/components/borrower/verify/verification-flow";
import { FooterDisclosures } from "@/components/footer-disclosures";
import { NavBar } from "@/components/nav-bar";
import { getCurrentBorrowerUserId } from "@/lib/borrower/current";
import { getVerificationFlowData } from "@/lib/borrower/verification";

export default async function BorrowerVerifyPage() {
  const borrowerUserId = await getCurrentBorrowerUserId();
  const data = borrowerUserId
    ? await getVerificationFlowData(borrowerUserId)
    : { listing: null };
  const listing = data.listing
    ? {
        auction: data.listing.auction
          ? {
              opensAt: data.listing.auction.opensAt.toISOString(),
              status: data.listing.auction.status,
            }
          : null,
        id: data.listing.id,
        state: data.listing.state,
      }
    : null;

  return (
    <>
      <NavBar />
      <VerificationFlow listing={listing} />
      <FooterDisclosures />
    </>
  );
}
