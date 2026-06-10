import { Button } from "@/components/ui/button";

export function TierExplainer() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <TierCard
        body="Browse lender profiles and start a conversation with one lender you choose. No rates shown. Real numbers require real data."
        cta="Browse lenders"
        href="/app/lenders"
        points={[
          "Pick one lender for an introduction",
          "No soft pull, no commitment",
          "You control when you say hello",
        ]}
        title="Connect"
      />
      <TierCard
        accent
        body="Verify once and lenders place firm bids keyed to your actual numbers. This is where the competing happens."
        cta="Open my Bid Room"
        href="/app/new"
        points={[
          "Checking your bids uses a soft inquiry and will not affect your credit score.",
          "Firm bids, not teaser quotes",
          "Lenders bid against each other for 48 hours",
        ]}
        title="The Bid Room"
      />
    </div>
  );
}

function TierCard({
  accent = false,
  body,
  cta,
  href,
  points,
  title,
}: {
  accent?: boolean;
  body: string;
  cta: string;
  href: string;
  points: string[];
  title: string;
}) {
  return (
    <article
      className={[
        "vr-card flex flex-col gap-4 p-6",
        accent ? "border-paddle" : "",
      ].join(" ")}
    >
      <h3 className="font-display text-3xl font-semibold text-ink">{title}</h3>
      <p className="leading-7 text-ink-90">{body}</p>
      <ul className="flex flex-col gap-2 text-sm leading-6 text-ink-90">
        {points.map((point) => (
          <li className="flex gap-2" key={point}>
            <CheckIcon />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-2">
        <Button href={href} variant={accent ? "primary" : "secondary"}>
          {cta}
        </Button>
      </div>
    </article>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mt-1 h-4 w-4 flex-none text-funded"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
