import type { LenderListingView } from "@/lib/dal/listings";

export type MaskedProfilePreview = {
  county?: string | null;
  creditBandVerified?: string | null;
  dtiBand?: string | null;
  hiddenFields: readonly ["Name", "Phone", "Street address"];
  incomeVerifiedAt?: string | null;
  loanAmount: number;
  ltvBand: string;
  occupancy: string;
  propertyType: string;
  purpose: string;
  state: string;
};

export function maskedPreviewFromLenderView(
  listing: LenderListingView,
): MaskedProfilePreview {
  return {
    county: listing.county,
    creditBandVerified:
      listing.verificationBundle?.creditBandVerified ??
      listing.creditBandStated,
    dtiBand: listing.verificationBundle?.dtiBand,
    hiddenFields: ["Name", "Phone", "Street address"],
    incomeVerifiedAt:
      listing.verificationBundle?.incomeVerifiedAt?.toISOString() ?? null,
    loanAmount: listing.loanAmount,
    ltvBand: listing.ltvBand,
    occupancy: listing.occupancy,
    propertyType: listing.propertyType,
    purpose: listing.purpose,
    state: listing.state,
  };
}
