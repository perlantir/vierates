import Link from "next/link";

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "danger" | "secondary" | "dark";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "border-paddle bg-paddle text-ink-900 hover:border-paddle-deep hover:bg-paddle-deep",
  secondary:
    "border-line-strong bg-transparent text-ink hover:border-ink hover:bg-ink/[0.03]",
  ghost: "border-transparent bg-transparent text-ink hover:bg-ink/[0.05]",
  danger: "border-alert bg-transparent text-alert hover:bg-[var(--alert-tint)]",
  dark: "border-ink bg-ink text-on-ink hover:border-ink-700 hover:bg-ink-700",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "min-h-11 px-3.5 text-sm",
  md: "min-h-11 px-[18px] text-base",
  lg: "min-h-[52px] px-7 text-lg",
};

export function Button({
  children,
  href,
  type = "button",
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  onClick,
}: ButtonProps) {
  const className = [
    "inline-flex items-center justify-center gap-2 rounded-button border font-semibold leading-none transition-colors duration-150",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]",
    "disabled:cursor-not-allowed disabled:opacity-60",
    fullWidth ? "w-full" : "w-auto",
    sizeClasses[size],
    variantClasses[variant],
  ].join(" ");

  if (href) {
    return (
      <Link className={className} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={className}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}
