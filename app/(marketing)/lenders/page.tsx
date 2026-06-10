import { FaqAccordion } from "@/components/faq-accordion";
import { FoundingLenderWizard } from "@/components/founding-lender-wizard";
import { SectionHead } from "@/components/section-head";
import { lenderFaqItems } from "@/lib/marketing/data";

export default function LendersPage() {
  return (
    <main>
      <section className="bg-ink text-on-ink">
        <div className="vr-frame grid gap-10 py-14 md:grid-cols-[1.08fr_0.92fr] md:items-center md:py-20">
          <div>
            <h1 className="font-display text-5xl font-semibold leading-tight md:text-6xl">
              Your next funded loan for ~
              <span className="vr-data text-funded">$300</span> in marketing
              cost. Not <span className="vr-data text-on-ink-dim">$3,000</span>.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-on-ink-dim">
              Bid on verified borrowers — soft-pull credit band and verified
              income before you spend a credit. Flat pricing, never a success
              fee. Every connection carries timestamped, named consent.
            </p>
          </div>
          <CostComparison />
        </div>
      </section>

      <section className="vr-section bg-paper">
        <div className="vr-frame">
          <SectionHead
            sub="Coverage-matched auctions appear on your board. You spend credits only when you choose to bid or connect."
            title="How bidding works for lenders"
          />
          <div className="grid gap-5 md:grid-cols-3">
            {[
              [
                "01",
                "Set your Coverage Box",
                "Choose states, products, purposes, FICO floor, LTV limit, and loan size.",
              ],
              [
                "02",
                "Review masked verified profiles",
                "See credit band, DTI band, income status, LTV band, county, and auction timer.",
              ],
              [
                "03",
                "Place firm bids",
                "The borrower compares bids. Identity is revealed only to the winner they pick.",
              ],
            ].map(([number, title, body]) => (
              <article className="border-t-2 border-ink pt-5" key={title}>
                <p className="vr-data text-sm font-semibold text-slate">
                  {number}
                </p>
                <h2 className="mt-3 font-display text-2xl font-semibold text-ink">
                  {title}
                </h2>
                <p className="mt-3 leading-7 text-ink-90">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="vr-section bg-bone">
        <div className="vr-frame grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <SectionHead
              eyebrow="Founding Lender"
              sub="Charter cohort applications go to the admin approval queue. Approved organizations can configure Coverage Boxes and wallet plans later."
              title="Apply to bid on the platform"
            />
          </div>
          <FoundingLenderWizard />
        </div>
      </section>

      <section className="vr-section bg-paper">
        <div className="vr-frame">
          <SectionHead eyebrow="Lender FAQ" title="Operational answers." />
          <FaqAccordion items={lenderFaqItems} />
        </div>
      </section>
    </main>
  );
}

function CostComparison() {
  return (
    <div className="rounded-lg border border-ink-line bg-ink-raised p-6">
      <p className="vr-eyebrow mb-5 text-on-ink-dim">Cost per funded loan</p>
      {[
        ["Legacy paid channels", "$3,000", "62%"],
        ["Aggregator channels", "$1,400", "34%"],
        ["VieRates", "~$300", "12%"],
      ].map(([label, value, width]) => (
        <div className="mb-5" key={label}>
          <div className="mb-2 flex items-center justify-between gap-4">
            <span className="text-sm text-on-ink">{label}</span>
            <span
              className={[
                "vr-data text-base font-semibold",
                label === "VieRates" ? "text-funded" : "text-on-ink-dim",
              ].join(" ")}
            >
              {value}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10">
            <div
              className={[
                "h-full rounded-full",
                label === "VieRates" ? "bg-funded" : "bg-slate",
              ].join(" ")}
              style={{ width }}
            />
          </div>
        </div>
      ))}
      <p className="text-xs leading-5 text-on-ink-dim">
        Example figures shown. Replace with real platform data. [STAT]
      </p>
    </div>
  );
}
