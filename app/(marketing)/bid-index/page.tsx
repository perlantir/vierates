import { BidIndexTable } from "@/components/bid-index-table";
import { SectionHead } from "@/components/section-head";
import { WaitlistForm } from "@/components/waitlist-form";
import { bidIndexRows } from "@/lib/marketing/data";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  description:
    "Illustrative weekly mortgage bid index bands by credit profile, with the live index launching after the first auctions.",
  path: "/bid-index",
  title: "Bid index",
});

export default function BidIndexPage() {
  return (
    <main>
      <section className="vr-section bg-paper">
        <div className="vr-frame">
          <SectionHead
            sub="Illustrative weekly APR bands now. The live index launches with aggregate platform bids after the first auctions close."
            title="VieRates bid index"
          />
          <p className="vr-data mb-6 text-sm text-text-muted">
            As of June 11, 2026 · Illustrative data
          </p>
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <MarketChart />
            <BidIndexTable rows={bidIndexRows} />
          </div>
          <section className="mt-8 rounded-card border border-line bg-card p-5">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Get the weekly Bid index
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
              One email when your state opens, then weekly market context if you
              ask for it. No lender handoff from this form.
            </p>
            <div className="mt-4">
              <WaitlistForm source="bid-index" />
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function MarketChart() {
  const bands = [
    { band: "740+", max: 6.49, median: 6.08, min: 5.96 },
    { band: "700-739", max: 6.79, median: 6.32, min: 6.14 },
    { band: "660-699", max: 7.12, median: 6.71, min: 6.42 },
  ] as const;
  const chartMin = 5.8;
  const chartMax = 7.2;
  const xForApr = (apr: number) =>
    16 + ((apr - chartMin) / (chartMax - chartMin)) * 72;

  return (
    <div className="vr-card p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Median APR by credit band
        </h2>
        <span className="vr-data text-xs text-text-muted">As of Jun 11</span>
      </div>
      <svg
        aria-label="Illustrative chart of weekly APR bands by credit profile"
        className="h-64 w-full"
        role="img"
        viewBox="0 0 100 100"
      >
        {[6, 6.5, 7].map((tick) => {
          const x = xForApr(tick);
          return (
            <g key={tick}>
              <line
                stroke="var(--line)"
                strokeWidth="0.6"
                x1={x}
                x2={x}
                y1="12"
                y2="82"
              />
              <text
                fill="var(--text-muted)"
                fontFamily="var(--font-data)"
                fontSize="3"
                textAnchor="middle"
                x={x}
                y="94"
              >
                {tick.toFixed(1)}%
              </text>
            </g>
          );
        })}
        {bands.map((item, index) => {
          const y = 24 + index * 24;
          return (
            <g key={item.band}>
              <text
                fill="var(--text)"
                fontFamily="var(--font-body)"
                fontSize="4"
                fontWeight="700"
                x="0"
                y={y + 1.5}
              >
                {item.band}
              </text>
              <line
                stroke="var(--paddle)"
                strokeLinecap="round"
                strokeWidth="4"
                x1={xForApr(item.min)}
                x2={xForApr(item.max)}
                y1={y}
                y2={y}
              />
              <circle
                cx={xForApr(item.median)}
                cy={y}
                fill="var(--ink-700)"
                r="3"
              />
              <text
                fill="var(--text-muted)"
                fontFamily="var(--font-data)"
                fontSize="3.3"
                textAnchor="start"
                x={xForApr(item.max) + 3}
                y={y + 1.2}
              >
                {item.median.toFixed(2)}%
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-5 text-xs leading-5 text-text-muted">
        Illustrative data. No specific lender pricing is displayed. Production
        charts use aggregate platform bids only.
      </p>
    </div>
  );
}
