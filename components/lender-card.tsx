import Link from "next/link";

export type LenderCardProps = {
  legalName: string;
  nmlsId: string;
  rating?: string;
  responseTime?: string;
  specialties: string[];
};

export function LenderCard({
  legalName,
  nmlsId,
  rating = "New",
  responseTime = "New",
  specialties,
}: LenderCardProps) {
  return (
    <article className="vr-card flex flex-col gap-4 p-5">
      <div>
        <h3 className="font-sans text-2xl font-semibold text-ink">
          {legalName}
        </h3>
        <Link
          className="vr-data mt-1 inline-block text-sm text-text-muted"
          href="https://www.nmlsconsumeraccess.org"
        >
          NMLS {nmlsId}
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {specialties.map((specialty) => (
          <span
            className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-semibold text-text-muted"
            key={specialty}
          >
            {specialty}
          </span>
        ))}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
        <div>
          <p className="text-xs text-text-muted">Avg response</p>
          <p className="vr-data mt-1 font-semibold">{responseTime}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Rating</p>
          <p className="vr-data mt-1 font-semibold">{rating}</p>
        </div>
      </div>
    </article>
  );
}
