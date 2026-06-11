import { LegalTemplate } from "@/components/legal-template";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  description:
    "VieRates marketplace terms covering borrower use, lender participation, platform role, and conduct rules.",
  path: "/legal/terms",
  title: "Terms of service",
});

export default function TermsPage() {
  return (
    <LegalTemplate
      title="Terms of service"
      updated="Last updated June 11, 2026"
      sections={[
        [
          "Marketplace role",
          "VieRates is a marketplace, not a lender, mortgage broker, or loan originator.",
        ],
        [
          "Borrower use",
          "Borrowers may create anonymous listings, request verification, compare bids, and choose whether to reveal identity to one lender. Borrowers are responsible for giving accurate information.",
        ],
        [
          "Lender use",
          "Lenders must be approved, licensed where they operate, and accountable for honoring firm bids subject to normal underwriting and appraisal conditions.",
        ],
      ]}
    />
  );
}
