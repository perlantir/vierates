import { LegalTemplate } from "@/components/legal-template";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  description:
    "How VieRates records borrower consent before introductions, texts, soft checks, and identity reveal moments.",
  path: "/legal/consent",
  title: "Consent records",
});

export default function ConsentPage() {
  return (
    <LegalTemplate
      title="Consent records"
      updated="Last updated June 11, 2026"
      sections={[
        [
          "TCPA consent",
          "Every contact checkbox names the lender or service receiving consent and records the exact language shown at that moment.",
        ],
        [
          "The Reveal",
          "Your identity is shared only with the lender you choose, and only after you confirm that reveal.",
        ],
        [
          "SMS",
          "Text messages are used for verification and borrower-requested updates. Every text includes a STOP instruction where required.",
        ],
      ]}
    />
  );
}
