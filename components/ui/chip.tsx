type ChipProps = {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
};

export function Chip({ children, selected = false, onClick }: ChipProps) {
  return (
    <button
      aria-pressed={selected}
      className={[
        "min-h-14 rounded-full border px-5 text-left text-sm font-semibold transition-colors",
        selected
          ? "border-ink bg-ink text-on-ink"
          : "border-line bg-card text-ink hover:border-line-strong",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
