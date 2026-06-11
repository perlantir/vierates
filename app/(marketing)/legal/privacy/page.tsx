import { LegalTemplate } from "@/components/legal-template";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  description:
    "VieRates privacy notice for sealed borrower identity, marketplace listings, analytics, and data rights.",
  path: "/legal/privacy",
  title: "Privacy policy",
});

export default function PrivacyPage() {
  return (
    <LegalTemplate
      title="Privacy policy"
      updated="Last updated June 11, 2026"
      sections={[
        [
          "Scope",
          "This notice describes how VieRates handles marketplace data, borrower identity, verification information, consent records, and basic site analytics.",
        ],
        [
          "Sealed identity",
          "VieRates stores your anonymous listing profile separately from your name, email, phone, and street address. Lenders see only the masked profile until you choose one lender.",
        ],
        [
          "Analytics",
          "VieRates measures page views and conversion events with a first-party session identifier so we can find broken flows and improve the marketplace. We do not sell analytics data, use advertising cookies, or send addresses, phone numbers, email addresses, or free-form borrower answers in analytics events.",
        ],
        [
          "Contact",
          "For privacy questions or data requests, contact privacy@vierates.com. State-specific rights notices will be updated as VieRates expands availability.",
        ],
      ]}
    />
  );
}
