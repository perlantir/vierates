export function ProgressBar({ value }: { value: number }) {
  const normalized = Math.min(100, Math.max(0, value));

  return (
    <div
      aria-label="Progress"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={normalized}
      className="h-1 w-full overflow-hidden rounded-full bg-line"
      role="progressbar"
    >
      <div
        className="h-full rounded-full bg-ink"
        style={{ width: `${normalized}%` }}
      />
    </div>
  );
}
