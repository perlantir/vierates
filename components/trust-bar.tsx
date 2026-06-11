const defaultItems = [
  "Free for borrowers — always",
  "Your data is never sold",
  "Soft check only — no score impact",
  "Licensed, NMLS-verified lenders",
];

export function TrustBar({
  items = defaultItems,
  surface = "light",
}: {
  items?: string[];
  surface?: "light" | "dark";
}) {
  const dark = surface === "dark";

  return (
    <div
      className={[
        "flex flex-wrap items-center gap-x-7 gap-y-3 border-y py-4 text-xs font-semibold tracking-[0.06em]",
        dark ? "border-ink-line text-on-ink" : "border-line text-ink-90",
      ].join(" ")}
      role="list"
    >
      {items.map((item) => (
        <span
          className="inline-flex items-center gap-2"
          key={item}
          role="listitem"
        >
          <CheckIcon />
          {item}
        </span>
      ))}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 flex-none text-funded"
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
