import { SectionHead } from "@/components/section-head";
import { SOFT_PULL_SENTENCE } from "@/lib/marketing/data";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  description:
    "VieRates trust principles: free for borrowers, never sold data, no bait numbers, and identity reveal only by borrower consent.",
  path: "/trust",
  title: "Trust",
});

export default function TrustPage() {
  return (
    <main className="vr-section bg-paper">
      <div className="vr-frame">
        <SectionHead
          sub="The marketplace is designed so lenders compete before identity is shared."
          title="Trust is an architecture choice"
        />
        <div className="grid gap-5 md:grid-cols-2">
          {[
            [
              "Free for borrowers — always",
              "Borrowers never pay VieRates. Lenders pay flat marketplace fees that are not tied to whether a loan closes.",
            ],
            [
              "Your data is never sold",
              "Lenders see a masked loan profile. Name, phone, email, and street address stay hidden unless you choose one lender.",
            ],
            [
              "No bait numbers",
              "Displayed rates and APRs must include assumptions and an as-of date. Firm bids are keyed to a verified profile, not teaser copy.",
            ],
            ["Soft pull only", SOFT_PULL_SENTENCE],
            [
              "Consent ledger",
              "Every contact or reveal moment records what you saw, who received permission, and when you gave it. Contact cannot be enabled without that record.",
            ],
            [
              "Anonymity gate",
              "Our systems cannot show a lender your identity until you choose them. That permission is created only by your action, and it is logged.",
            ],
            [
              "Vendor-handled verification",
              "Sensitive verification steps run through embedded specialist providers. VieRates does not ask you to send bank credentials to our support team.",
            ],
            [
              "Security posture",
              "Borrower identity is encrypted at rest, logs redact PII, and an independent human penetration test remains required before real borrower data.",
            ],
          ].map(([title, body]) => (
            <article className="vr-card p-6" key={title}>
              <h2 className="font-display text-2xl font-semibold text-ink">
                {title}
              </h2>
              <p className="mt-3 leading-7 text-text">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
