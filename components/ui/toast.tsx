type ToastProps = {
  children: React.ReactNode;
  tone?: "success" | "danger" | "neutral";
};

const toneClasses: Record<NonNullable<ToastProps["tone"]>, string> = {
  success: "border-funded/30 bg-[var(--funded-tint)] text-ink",
  danger: "border-signal/30 bg-[var(--signal-tint)] text-ink",
  neutral: "border-line bg-paper text-ink",
};

export function Toast({ children, tone = "neutral" }: ToastProps) {
  return (
    <div
      className={`rounded-ui border px-4 py-3 text-sm leading-6 ${toneClasses[tone]}`}
      role="status"
    >
      {children}
    </div>
  );
}
