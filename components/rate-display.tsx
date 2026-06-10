type RateDisplayProps = {
  rate: string;
  apr: string;
  asOfDate: string;
  assumptions: string;
};

export function RateDisplay({
  rate,
  apr,
  asOfDate,
  assumptions,
}: RateDisplayProps) {
  if (process.env.NODE_ENV !== "production") {
    const missingFields = Object.entries({ rate, apr, asOfDate, assumptions })
      .filter(([, value]) => value.length === 0)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      throw new Error(
        `RateDisplay missing compliance props: ${missingFields.join(", ")}`,
      );
    }
  }

  return (
    <figure className="font-mono tabular-nums">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-2xl font-semibold">{rate}</span>
        <span className="text-sm text-slate">APR {apr}</span>
      </div>
      <figcaption className="mt-2 text-xs leading-5 text-slate">
        As of {asOfDate}. {assumptions}
      </figcaption>
    </figure>
  );
}
