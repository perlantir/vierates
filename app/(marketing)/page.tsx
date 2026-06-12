import Link from "next/link";

import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
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

export const metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <main>
      <section className="vr-ruled border-b border-line" id="home-hero">
        <div className="vr-frame grid gap-10 py-12 md:grid-cols-[1.02fr_0.98fr] md:items-center md:py-16 lg:py-20">
          <div className="flex flex-col justify-center">
            <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.12] text-ink md:text-[52px] md:leading-[58px]">
              Lenders compete. You stay anonymous. You choose.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-text">
              List your loan in 60 seconds — free, no spam calls, no score
              impact. Verified borrowers get firm bids from licensed lenders in
              a 48-hour auction.
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
              maxRows={6}
              surface="dark"
              title="Example bids"
              windowLabel="48-hour window"
            />
          </div>
        </div>
      </section>

      <section className="bg-ink">
        <div className="vr-frame">
          <TrustBar surface="dark" />
        </div>
      </section>

      <section className="border-b border-line bg-paper">
        <div className="vr-frame py-6">
          <MarketContextBand />
        </div>
      </section>

      <section className="vr-section bg-paper">
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
            ].map(([number, title, body], index) => (
              <article className="border-t-2 border-ink pt-5" key={title}>
                <p className="vr-data text-sm font-semibold text-text-muted">
                  {number}
                </p>
                <h3 className="mt-3 font-display text-2xl font-semibold text-ink">
                  {title}
                </h3>
                <p className="mt-3 leading-7 text-text">{body}</p>
                <ProductMiniature step={index} />
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
            title="Connect — or open the Bid Room."
          />
          <TierExplainer />
        </div>
      </section>

      <section className="vr-section bg-paper">
        <div className="vr-frame">
          <SectionHead
            eyebrow="The old way vs VieRates"
            title="The borrower holds the gavel."
          />
          <div className="grid gap-4 md:grid-cols-[0.96fr_1.04fr]">
            <ComparisonColumn
              items={[
                "Your number is shared with multiple lenders",
                "Relentless calls",
                "Advertised rates that change later",
                "You become the product",
              ]}
              title="The old way"
              tone="old"
            />
            <ComparisonColumn
              items={[
                "Anonymous listing",
                "Silent bids",
                "Firm bids keyed to your verified profile",
                "You hold the gavel",
              ]}
              title="VieRates"
              tone="vierates"
            />
          </div>
        </div>
      </section>

      <section className="vr-section bg-paper">
        <div className="vr-frame grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-end">
          <div>
            <SectionHead
              eyebrow="Bid index"
              sub="Illustrative market bands now. The live index launches with aggregate auction data after the first VieRates bid rooms close."
              title="See where bids are moving."
            />
            <Button href="/bid-index" variant="secondary">
              View bid index
            </Button>
          </div>
          <BidIndexTeaser />
        </div>
      </section>

      <section className="vr-section bg-paper">
        <div className="vr-frame">
          <SectionHead eyebrow="Questions" title="Straight answers." />
          <div id="faq" className="scroll-mt-24" />
          <FaqAccordion items={homeFaqItems} />
        </div>
      </section>

      <section className="border-t border-line bg-paper py-12">
        <div className="vr-frame grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold text-ink">
              Not ready to list?
            </h2>
            <p className="mt-3 leading-7 text-text">
              Watch your state instead. We will send one email when anonymous
              mortgage bidding opens in your market.
            </p>
          </div>
          <div className="vr-card p-5">
            <WaitlistInlineLink />
          </div>
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
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: homeFaqItems.map((item) => ({
            "@type": "Question",
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
            name: item.question,
          })),
        }}
      />
    </main>
  );
}

function MarketContextBand() {
  return (
    <div className="grid gap-4 rounded-card border border-line bg-card p-5 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <p className="vr-eyebrow text-text-muted">Market context</p>
        <p className="mt-2 text-lg font-semibold leading-7 text-ink">
          Verified borrowers like you will see weekly bid ranges here as soon as
          the first auctions close.
        </p>
      </div>
      <div className="vr-data grid justify-items-center rounded-ui border border-line bg-paper px-4 py-3 text-center text-ink md:min-w-64">
        <p className="text-2xl font-semibold">6.08%-6.49%</p>
        <p className="mt-1 text-xs text-text-muted">
          Illustrative range · as of June 11, 2026
        </p>
      </div>
    </div>
  );
}

function ProductMiniature({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div className="mt-5 grid gap-2 rounded-card border border-line bg-card p-3">
        {["Lower my payment", "Get cash out", "Just see bids"].map((label) => (
          <span
            className="rounded-full border border-line bg-paper px-3 py-2 text-sm font-semibold text-ink"
            key={label}
          >
            {label}
          </span>
        ))}
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="mt-5 rounded-card border border-line bg-card p-3">
        <div className="mb-2 flex items-center justify-between text-xs text-text-muted">
          <span>Bid Room</span>
          <span className="vr-data">48h</span>
        </div>
        {["6.08% APR", "6.21% APR", "6.49% APR"].map((label, index) => (
          <div
            className="grid grid-cols-[1fr_auto] border-t border-line py-2 text-sm first:border-t-0"
            key={label}
          >
            <span>Paddle #{index + 1}</span>
            <span className="vr-data font-semibold text-ink">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-card border border-line bg-card p-3">
      {["Name", "Phone", "Street address"].map((label, index) => (
        <div
          className="flex items-center justify-between gap-4 border-t border-line py-2 text-sm first:border-t-0"
          key={label}
        >
          <span>{label}</span>
          <span
            className="vr-redaction h-3"
            style={{ width: `${60 + index * 12}%` }}
          />
        </div>
      ))}
      <p className="mt-2 text-xs font-semibold text-verified">
        Reveal to one lender
      </p>
    </div>
  );
}

function WaitlistInlineLink() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-6 text-text-muted">
        Prefer a softer step? Join the state waitlist instead of starting a
        listing today.
      </p>
      <Button href="/waitlist" variant="secondary">
        Join waitlist
      </Button>
    </div>
  );
}

function ComparisonColumn({
  items,
  tone,
  title,
}: {
  items: string[];
  tone: "old" | "vierates";
  title: string;
}) {
  const isVieRates = tone === "vierates";
  const rowBorder = isVieRates ? "border-ink-line" : "border-line";
  const mutedText = isVieRates ? "text-on-ink-dim" : "text-text-muted";

  return (
    <article
      className={[
        "relative overflow-hidden rounded-card border shadow-[var(--shadow-1)]",
        isVieRates
          ? "border-ink bg-ink text-on-ink"
          : "border-line bg-card text-ink",
      ].join(" ")}
    >
      <div
        aria-hidden="true"
        className={[
          "absolute inset-x-0 top-0 h-1.5",
          isVieRates ? "bg-verified" : "bg-alert",
        ].join(" ")}
      />
      <div className="grid gap-5 p-6 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <p className={["vr-eyebrow", mutedText].join(" ")}>
            {isVieRates ? "Sealed bid path" : "Shared contact path"}
          </p>
          <h3 className="mt-2 font-display text-3xl font-semibold leading-tight">
            {title}
          </h3>
        </div>
        <ComparisonBadge tone={tone} />
      </div>
      <ul className={["border-t", rowBorder].join(" ")}>
        {items.map((item) => (
          <li
            className={[
              "grid min-h-16 grid-cols-[2rem_1fr] items-center gap-3 border-t px-6 py-4 text-sm font-semibold leading-6 first:border-t-0",
              rowBorder,
              isVieRates ? "text-on-ink" : "text-text",
            ].join(" ")}
            key={item}
          >
            <ComparisonStatusIcon tone={tone} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <ComparisonMiniature tone={tone} />
    </article>
  );
}

function ComparisonBadge({ tone }: { tone: "old" | "vierates" }) {
  const isVieRates = tone === "vierates";

  return (
    <div
      className={[
        "inline-flex min-h-11 items-center gap-2 rounded-button border px-3 text-sm font-semibold",
        isVieRates
          ? "border-white/20 bg-white/5 text-on-ink"
          : "border-alert/30 bg-[var(--alert-tint)] text-alert",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "h-2.5 w-2.5 rounded-full",
          isVieRates ? "bg-verified" : "bg-alert",
        ].join(" ")}
      />
      {isVieRates ? "Identity sealed" : "Contact shared"}
    </div>
  );
}

function ComparisonStatusIcon({ tone }: { tone: "old" | "vierates" }) {
  const isVieRates = tone === "vierates";

  return (
    <span
      aria-hidden="true"
      className={[
        "grid h-8 w-8 place-items-center rounded-full border",
        isVieRates
          ? "border-verified/50 bg-[var(--verified-tint)]"
          : "border-alert/40 bg-[var(--alert-tint)]",
      ].join(" ")}
    >
      {isVieRates ? (
        <span className="h-3 w-1.5 rotate-45 border-b-2 border-r-2 border-verified" />
      ) : (
        <span className="h-0.5 w-3.5 bg-alert" />
      )}
    </span>
  );
}

function ComparisonMiniature({ tone }: { tone: "old" | "vierates" }) {
  const isVieRates = tone === "vierates";

  if (!isVieRates) {
    return (
      <div className="border-t border-line bg-paper p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-text-muted">Shared number</p>
          <p className="vr-data text-xs font-semibold text-alert">4 lenders</p>
        </div>
        <div className="grid gap-2">
          {["Lender A", "Lender B", "Lender C"].map((label) => (
            <div
              className="grid grid-cols-[0.75rem_1fr_auto] items-center gap-3 border-t border-line py-2 text-sm first:border-t-0"
              key={label}
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-alert"
              />
              <span className="font-semibold text-ink">{label}</span>
              <span className="vr-data text-xs text-text-muted">call</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-ink-line bg-white/5 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-on-ink-dim">Identity vault</p>
        <p className="vr-data text-xs font-semibold text-verified">
          one reveal
        </p>
      </div>
      <div className="grid gap-2">
        {[
          ["Name", "62%"],
          ["Phone", "74%"],
          ["Street address", "88%"],
        ].map(([label, width]) => (
          <div
            className="grid grid-cols-[6.5rem_1fr] items-center gap-3 border-t border-ink-line py-2 text-sm first:border-t-0"
            key={label}
          >
            <span className="font-semibold text-on-ink">{label}</span>
            <span
              aria-hidden="true"
              className="inline-block h-2 bg-on-ink"
              style={{ width }}
            />
          </div>
        ))}
      </div>
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
    <div className="rounded-card border border-line bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="font-semibold text-ink">Median bid APR by credit band</p>
        <p className="vr-data text-xs text-text-muted">
          As of Jun 11 · Illustrative
        </p>
      </div>
      <svg
        aria-label="Illustrative chart of how the weekly bid index will display"
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
