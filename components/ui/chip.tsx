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
        "min-h-11 rounded-ui border px-4 text-left text-sm font-semibold transition-colors",
        selected
          ? "border-ink bg-ink text-on-ink"
          : "border-line bg-paper text-ink hover:border-line-strong",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
