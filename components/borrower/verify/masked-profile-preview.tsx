import type { MaskedProfilePreview as MaskedProfilePreviewData } from "@/lib/borrower/masked-preview";

type MaskedProfilePreviewProps = {
  preview: MaskedProfilePreviewData;
};

export function MaskedProfilePreview({ preview }: MaskedProfilePreviewProps) {
  return (
    <article className="vr-card grid gap-5 p-5" data-testid="masked-preview">
      <div>
        <h2 className="font-sans text-2xl font-semibold text-ink">
          Here&apos;s what lenders see — and what they won&apos;t.
        </h2>
        <p className="mt-2 text-sm font-semibold text-slate">
          Hidden until you pick.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-card border border-line bg-paper p-4">
          <h3 className="text-sm font-semibold tracking-[0.06em] text-slate">
            Lenders see
          </h3>
          <dl className="mt-4 grid gap-3">
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
        </section>
        <section className="rounded-card border border-line bg-paper p-4">
          <h3 className="text-sm font-semibold tracking-[0.06em] text-slate">
            Lenders never see
          </h3>
          <div className="mt-4 grid gap-4">
            {preview.hiddenFields.map((field) => (
              <div className="grid gap-2" key={field}>
                <p className="text-xs font-semibold text-slate">{field}</p>
                <span className="vr-redaction h-3 w-full" />
              </div>
            ))}
            <div className="grid gap-2">
              <p className="text-xs font-semibold text-slate">Email</p>
              <span className="vr-redaction h-3 w-full" />
            </div>
          </div>
        </section>
      </div>
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
