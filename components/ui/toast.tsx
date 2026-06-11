type ToastProps = {
  children: React.ReactNode;
  tone?: "success" | "danger" | "neutral";
};

const toneClasses: Record<NonNullable<ToastProps["tone"]>, string> = {
  success: "border-verified/30 bg-[var(--verified-tint)] text-ink",
  danger: "border-alert/30 bg-[var(--alert-tint)] text-ink",
  neutral: "border-line bg-card text-ink",
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
