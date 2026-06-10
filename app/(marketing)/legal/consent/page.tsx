import { LegalTemplate } from "@/components/legal-template";

export default function ConsentPage() {
  return (
    <LegalTemplate
      title="Consent records"
      updated="Counsel draft slot"
      sections={[
        [
          "TCPA consent",
          "Every consent checkbox names the party receiving consent and stores a hash of the exact text shown.",
        ],
        [
          "The Reveal",
          "Identity is shared only with the selected lender after a reveal consent record is written.",
        ],
        ["SMS", "SMS templates include Reply STOP to opt out."],
      ]}
    />
  );
}
