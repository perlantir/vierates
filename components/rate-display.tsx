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
    <figure className="vr-data">
      <div className="grid gap-1">
        <span className="text-xs font-semibold text-text-muted">APR</span>
        <span className="text-4xl font-medium leading-none text-ink md:text-[44px] md:leading-[48px]">
          {apr}
        </span>
        <span className="text-sm text-text-muted">note rate {rate}</span>
      </div>
      <figcaption className="mt-2 text-xs leading-5 text-text-muted">
        As of {asOfDate}. {assumptions}
      </figcaption>
    </figure>
  );
}
