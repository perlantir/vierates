import { FaqAccordion } from "@/components/faq-accordion";
import { FoundingLenderWizard } from "@/components/founding-lender-wizard";
import { SectionHead } from "@/components/section-head";
import { Button } from "@/components/ui/button";
import { lenderFaqItems } from "@/lib/marketing/data";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  description:
    "Apply for VieRates founding lender access and see how flat-fee mortgage auctions work.",
  path: "/lenders",
  title: "For lenders",
});

export default function LendersPage() {
  return (
    <main>
      <section className="bg-ink text-on-ink">
        <div className="vr-frame grid gap-10 py-14 md:grid-cols-[1.08fr_0.92fr] md:items-center md:py-20">
          <div>
            <h1 className="font-display text-5xl font-semibold leading-tight md:text-6xl">
              Stop buying leads. Start winning borrowers.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-on-ink-dim">
              Verified, consented borrowers. Exclusive introductions and
              firm-bid auctions — at a fraction of your current cost per funded
              loan.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-on-ink-dim">
              Flat pricing. Never a success fee.
            </p>
            <div className="mt-8">
              <Button href="#founding-lender" size="lg">
                Apply for a Founding Lender seat
              </Button>
            </div>
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
                <p className="vr-data text-sm font-semibold text-text-muted">
                  {number}
                </p>
                <h2 className="mt-3 font-display text-2xl font-semibold text-ink">
                  {title}
                </h2>
                <p className="mt-3 leading-7 text-text">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="vr-section bg-paper" id="founding-lender">
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
      <p className="vr-eyebrow mb-5 text-on-ink-dim">
        Example marketplace spend
      </p>
      {[
        ["Shared internet leads", "$1,500-$4,000+", "68%"],
        ["VieRates auction", "$150-$300", "28%"],
        ["VieRates connection", "$600", "16%"],
      ].map(([label, value, width]) => (
        <div className="mb-5" key={label}>
          <div className="mb-2 flex items-center justify-between gap-4">
            <span className="text-sm text-on-ink">{label}</span>
            <span
              className={[
                "vr-data text-base font-semibold",
                label.startsWith("VieRates")
                  ? "text-verified"
                  : "text-on-ink-dim",
              ].join(" ")}
            >
              {value}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10">
            <div
              className={[
                "h-full rounded-full",
                label.startsWith("VieRates") ? "bg-verified" : "bg-text-muted",
              ].join(" ")}
              style={{ width }}
            />
          </div>
        </div>
      ))}
      <p className="text-xs leading-5 text-on-ink-dim">
        Assumes purchased leads at $75-$200 each, 20:1 to 30:1 lead-to-verified
        efficiency, and flat VieRates marketplace pricing that is never tied to
        whether a loan funds.
      </p>
    </div>
  );
}
