import { BidIndexTable } from "@/components/bid-index-table";
import { SectionHead } from "@/components/section-head";
import { bidIndexRows } from "@/lib/marketing/data";

export default function BidIndexPage() {
  return (
    <main>
      <section className="vr-section bg-bone">
        <div className="vr-frame">
          <SectionHead
            sub="Median bid APR by credit band over time. Development uses clearly labeled demo data; production uses aggregate platform bids only."
            title="VieRates bid index"
          />
          <p className="vr-data mb-6 text-sm text-slate">
            Updated weekly · Demo data
          </p>
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <MarketChart />
            <BidIndexTable rows={bidIndexRows} />
          </div>
        </div>
      </section>
    </main>
  );
}

function MarketChart() {
  const bands = [
    ["740+", 34],
    ["700-739", 45],
    ["660-699", 62],
  ];

  return (
    <div className="vr-card p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Median bid APR trend
        </h2>
        <span className="vr-data text-xs text-slate">12 weeks</span>
      </div>
      <div className="grid gap-4">
        {bands.map(([band, width]) => (
          <div key={band}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-ink">{band}</span>
              <span className="vr-data text-slate">{`${width}% range`}</span>
            </div>
            <div className="h-3 rounded-full bg-[var(--paddle-tint)]">
              <div
                className="h-full rounded-full bg-ink-700"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs leading-5 text-slate">
        Demo data shown for local development. No specific lender pricing is
        displayed.
      </p>
    </div>
  );
}
