import { SectionHead } from "@/components/section-head";
import { SOFT_PULL_SENTENCE } from "@/lib/marketing/data";

export default function TrustPage() {
  return (
    <main className="vr-section bg-bone">
      <div className="vr-frame">
        <SectionHead
          sub="The marketplace is designed so lenders compete before identity is shared."
          title="Trust is an architecture choice"
        />
        <div className="grid gap-5 md:grid-cols-2">
          {[
            [
              "Your data is never sold",
              "Lenders see a masked loan profile. Name, phone, email, and street address stay hidden unless you choose one lender.",
            ],
            ["Soft pull only", SOFT_PULL_SENTENCE],
            [
              "Consent records",
              "Every contact or reveal moment writes a timestamped consent record with a hash of the text shown.",
            ],
            [
              "Anonymity gate",
              "Lender identity access requires an IdentityGrant row for that lender organization.",
            ],
          ].map(([title, body]) => (
            <article className="vr-card p-6" key={title}>
              <h2 className="font-display text-2xl font-semibold text-ink">
                {title}
              </h2>
              <p className="mt-3 leading-7 text-ink-90">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
