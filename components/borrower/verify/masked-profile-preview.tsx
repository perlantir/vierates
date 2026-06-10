import type { MaskedProfilePreview as MaskedProfilePreviewData } from "@/lib/borrower/masked-preview";

type MaskedProfilePreviewProps = {
  preview: MaskedProfilePreviewData;
};

export function MaskedProfilePreview({ preview }: MaskedProfilePreviewProps) {
  return (
    <article className="vr-card grid gap-5 p-5" data-testid="masked-preview">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">
          Here&apos;s what lenders see - and what they don&apos;t.
        </h2>
        <p className="mt-2 text-sm font-semibold text-signal">
          Hidden until you pick.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {preview.hiddenFields.map((field) => (
          <div
            className="rounded-ui border border-signal bg-[var(--signal-tint)] p-3"
            key={field}
          >
            <p className="text-xs font-semibold text-signal line-through">
              {field}
            </p>
            <p className="mt-1 text-sm text-slate">Not shared</p>
          </div>
        ))}
      </div>
      <dl className="grid gap-4 sm:grid-cols-2">
        <Metric label="State" value={preview.state} />
        <Metric label="County" value={preview.county ?? "Hidden"} />
        <Metric label="Purpose" value={humanize(preview.purpose)} />
        <Metric label="Property" value={humanize(preview.propertyType)} />
        <Metric label="Occupancy" value={humanize(preview.occupancy)} />
        <Metric label="Loan amount" value={currency(preview.loanAmount)} />
        <Metric label="LTV band" value={`${preview.ltvBand}%`} />
        <Metric
          label="Verified credit"
          value={humanize(preview.creditBandVerified ?? "Pending")}
        />
        <Metric label="Verified DTI" value={preview.dtiBand ?? "Pending"} />
      </dl>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate">{label}</dt>
      <dd className="vr-data mt-1 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}

function currency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
