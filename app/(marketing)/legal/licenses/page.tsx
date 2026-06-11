import { LegalTemplate } from "@/components/legal-template";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  description:
    "VieRates state availability, lender licensing checks, and NMLS lookup information.",
  path: "/legal/licenses",
  title: "Licenses",
});

export default function LicensesPage() {
  return (
    <LegalTemplate
      title="Licenses"
      updated="Last updated June 11, 2026"
      sections={[
        [
          "NMLS Consumer Access",
          "Participating lender profiles include NMLS IDs so borrowers can check license records through NMLS Consumer Access.",
        ],
        [
          "State availability",
          "VieRates opens anonymous listings only in states where the marketplace is ready to operate. If your state is not open yet, you can join the waitlist.",
        ],
        [
          "Marketplace role",
          "VieRates is a marketplace. Participating lenders make all loan, pricing, underwriting, and credit decisions.",
        ],
      ]}
    />
  );
}
