import { LegalTemplate } from "@/components/legal-template";

export default function LicensesPage() {
  return (
    <LegalTemplate
      title="Licenses"
      updated="Counsel draft slot"
      sections={[
        [
          "NMLS Consumer Access",
          "Participating lender NMLS IDs link to nmlsconsumeraccess.org.",
        ],
        [
          "State availability",
          "VieRates state launch status is controlled by StateRule records.",
        ],
        [
          "Counsel content",
          "State-specific marketplace and advertising notices belong here.",
        ],
      ]}
    />
  );
}
