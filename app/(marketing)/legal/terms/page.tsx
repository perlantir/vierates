import { LegalTemplate } from "@/components/legal-template";

export default function TermsPage() {
  return (
    <LegalTemplate
      title="Terms of service"
      updated="Counsel draft slot"
      sections={[
        [
          "Marketplace role",
          "VieRates is a marketplace, not a lender, mortgage broker, or loan originator.",
        ],
        [
          "Borrower use",
          "Borrower-facing terms, account responsibilities, and platform rules belong here.",
        ],
        [
          "Lender use",
          "Lender participation, billing, wallet, and conduct terms belong here.",
        ],
      ]}
    />
  );
}
