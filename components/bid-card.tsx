import { RateDisplay } from "@/components/rate-display";

export type BidCardProps = {
  apr: string;
  asOfDate: string;
  assumptions: string;
  lenderName: string;
  lockDays: number;
  points: string;
  rate: string;
};

export function BidCard({
  apr,
  asOfDate,
  assumptions,
  lenderName,
  lockDays,
  points,
  rate,
}: BidCardProps) {
  return (
    <article className="vr-card grid gap-4 p-5">
      <div className="flex items-center justify-between gap-4 border-b border-line pb-3">
        <h3 className="font-semibold text-ink">{lenderName}</h3>
        <p className="vr-data text-sm text-slate">{lockDays} day lock</p>
      </div>
      <RateDisplay
        apr={apr}
        asOfDate={asOfDate}
        assumptions={assumptions}
        rate={rate}
      />
      <p className="vr-data text-right text-sm text-slate">{points} points</p>
    </article>
  );
}
