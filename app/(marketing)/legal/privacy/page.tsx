import { LegalTemplate } from "@/components/legal-template";

export default function PrivacyPage() {
  return (
    <LegalTemplate
      title="Privacy policy"
      updated="Counsel draft slot"
      sections={[
        [
          "Scope",
          "This template describes how VieRates handles marketplace data. Counsel should replace this slot before launch.",
        ],
        [
          "Marketplace data",
          "VieRates stores anonymous listing data separately from borrower identity data and uses identity grants for reveal flows.",
        ],
        [
          "Contact",
          "Privacy contact details and state-specific rights notices belong here.",
        ],
      ]}
    />
  );
}
