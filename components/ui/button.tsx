import Link from "next/link";

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "danger";
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-paddle text-ink hover:bg-paddle/90",
  ghost: "border border-ink/15 bg-transparent text-ink hover:bg-white",
  danger: "bg-signal text-white hover:bg-signal/90",
};

export function Button({
  children,
  href,
  type = "button",
  variant = "primary",
}: ButtonProps) {
  const className = `inline-flex min-h-11 items-center justify-center rounded-ui px-5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${variantClasses[variant]}`;

  if (href) {
    return (
      <Link className={className} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={className} type={type}>
      {children}
    </button>
  );
}
