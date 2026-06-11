import Link from "next/link";

import { FaqAccordion } from "@/components/faq-accordion";
import { LiveBidLedger } from "@/components/live-bid-ledger";
import { SectionHead } from "@/components/section-head";
import { TierExplainer } from "@/components/tier-explainer";
import { TrustBar } from "@/components/trust-bar";
import { Button } from "@/components/ui/button";
import {
  exampleBidFeed,
  exampleBids,
  homeFaqItems,
} from "@/lib/marketing/data";

export default function HomePage() {
  return (
    <main>
      <section className="vr-ruled border-b border-line">
        <div className="vr-frame grid gap-10 py-12 md:grid-cols-[1.02fr_0.98fr] md:items-center md:py-16 lg:py-20">
          <div className="flex flex-col justify-center">
            <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.12] text-ink md:text-[52px] md:leading-[58px]">
              Lenders compete. You stay anonymous. You choose.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-90">
              List your loan in 60 seconds — free, no spam calls, no credit hit.
              Verified borrowers get firm bids from licensed lenders in a
              48-hour auction.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Button href="/app/new" size="lg">
                Start my listing
              </Button>
              <Link
                className="text-base font-semibold text-ink no-underline underline-offset-4 hover:underline"
                href="/how-it-works"
              >
                See how it works
              </Link>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <LiveBidLedger
              bids={exampleBids}
              feed={exampleBidFeed}
              interval={2600}
              live
              surface="dark"
              title="Example bids"
              windowLabel="41:12:08 left"
            />
          </div>
        </div>
      </section>

      <section className="bg-ink">
        <div className="vr-frame">
          <TrustBar surface="dark" />
        </div>
      </section>

      <section className="vr-section bg-bone">
        <div className="vr-frame">
          <SectionHead
            eyebrow="How it works"
            sub="One anonymous listing. One 48-hour Bid Room. One lender receives your identity only when you choose."
            title="List anonymously. Open your Bid Room. Pick your winner."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {[
              [
                "01",
                "List anonymously",
                "Share the numbers lenders need in about 60 seconds. Your name, phone, and street address stay hidden.",
              ],
              [
                "02",
                "Open your Bid Room",
                "Verify once. Lenders compete with firm bids against the same profile for 48 hours.",
              ],
              [
                "03",
                "Pick your winner",
                "Compare bids side by side. The lender you choose receives your identity at the Reveal.",
              ],
            ].map(([number, title, body]) => (
              <article className="border-t-2 border-ink pt-5" key={title}>
                <p className="vr-data text-sm font-semibold text-slate">
                  {number}
                </p>
                <h3 className="mt-3 font-display text-2xl font-semibold text-ink">
                  {title}
                </h3>
                <p className="mt-3 leading-7 text-ink-90">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="vr-section bg-paper">
        <div className="vr-frame">
          <SectionHead
            eyebrow="Two ways in"
            sub="Connect lets you talk to one lender. The Bid Room lets verified lenders compete with firm bids."
            title="Connect, or open the Bid Room."
          />
          <TierExplainer />
        </div>
      </section>

      <section className="vr-section bg-bone">
        <div className="vr-frame">
          <SectionHead
            eyebrow="The old way vs VieRates"
            title="The borrower holds the gavel."
          />
          <div className="overflow-hidden rounded-ui border border-line bg-paper">
            <div className="grid md:grid-cols-2">
              <ComparisonColumn
                items={[
                  "Your number is shared with multiple lenders",
                  "Relentless calls",
                  "Advertised rates that change later",
                  "You become the product",
                ]}
                title="The old way"
              />
              <ComparisonColumn
                items={[
                  "Anonymous listing",
                  "Silent bids",
                  "Firm bids keyed to your verified profile",
                  "You hold the gavel",
                ]}
                title="VieRates"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="vr-section bg-paper">
        <div className="vr-frame grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-end">
          <div>
            <SectionHead
              eyebrow="Bid index"
              sub="A weekly market report built from platform demo data in development. Production charts use real aggregate bids only."
              title="See where bids are moving."
            />
            <Button href="/bid-index" variant="secondary">
              View bid index
            </Button>
          </div>
          <BidIndexTeaser />
        </div>
      </section>

      <section className="vr-section bg-bone">
        <div className="vr-frame">
          <SectionHead eyebrow="Questions" title="Straight answers." />
          <FaqAccordion items={homeFaqItems} />
        </div>
      </section>

      <section className="bg-ink py-14 text-on-ink">
        <div className="vr-frame flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-4xl font-semibold">
              Start with one anonymous listing.
            </h2>
            <p className="mt-3 max-w-2xl text-on-ink-dim">
              Free for borrowers. Your identity stays hidden until you choose.
            </p>
          </div>
          <Button href="/app/new" size="lg">
            Start my listing
          </Button>
        </div>
      </section>
    </main>
  );
}

function ComparisonColumn({
  items,
  title,
}: {
  items: string[];
  title: string;
}) {
  return (
    <div className="border-b border-line p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <h3 className="font-display text-2xl font-semibold text-ink">{title}</h3>
      <ul className="mt-5 grid gap-3 text-sm leading-6 text-ink-90">
        {items.map((item) => (
          <li className="border-t border-line pt-3" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BidIndexTeaser() {
  const points = [
    [0, 80],
    [22, 58],
    [44, 49],
    [66, 36],
    [88, 29],
    [100, 22],
  ];
  const line = points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");

  return (
    <div className="rounded-card border border-line bg-paper p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="font-semibold text-ink">Median bid APR by credit band</p>
        <p className="vr-data text-xs text-slate">Updated weekly · Demo</p>
      </div>
      <svg
        aria-label="Demo median bid APR line trending lower over the week"
        className="h-56 w-full"
        role="img"
        viewBox="0 0 100 100"
      >
        {[25, 50, 75].map((y) => (
          <line
            key={y}
            stroke="var(--line-strong)"
            strokeWidth="0.7"
            x1="0"
            x2="100"
            y1={y}
            y2={y}
          />
        ))}
        <path
          d="M 0 90 L 0 68 L 22 46 L 44 37 L 66 24 L 88 17 L 100 10 L 100 34 L 88 41 L 66 48 L 44 61 L 22 70 L 0 92 Z"
          fill="var(--paddle-tint)"
        />
        <path d={line} fill="none" stroke="var(--ink-700)" strokeWidth="2.4" />
      </svg>
    </div>
  );
}
