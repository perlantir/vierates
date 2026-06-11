"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type NavLink = {
  href: string;
  label: string;
};

const primaryLinks: NavLink[] = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/bid-index", label: "Bid index" },
  { href: "/lenders", label: "For lenders" },
];

const mobileActions: NavLink[] = [
  { href: "/app", label: "Dashboard" },
  { href: "/lender", label: "Lender portal" },
];

export function NavBar() {
  const pathname = usePathname();
  const [heroVisible, setHeroVisible] = useState(pathname === "/");
  const [menuOpen, setMenuOpen] = useState(false);
  const primaryCtaVariant =
    pathname === "/" && heroVisible ? "secondary" : "primary";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") {
      setHeroVisible(false);
      return;
    }

    const hero = document.getElementById("home-hero");

    if (!hero) {
      setHeroVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { rootMargin: "-72px 0px 0px 0px", threshold: 0.2 },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur">
      <div className="vr-frame flex min-h-16 items-center justify-between gap-3 md:min-h-[68px] md:gap-6">
        <Link
          aria-label="VieRates home"
          className="flex min-h-11 shrink-0 items-center no-underline"
          href="/"
        >
          <Image
            alt="VieRates"
            className="h-8 w-[136px] md:h-10 md:w-auto"
            height={44}
            priority
            src="/assets/wordmark.svg"
            width={190}
          />
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-6 text-sm font-medium text-text-muted md:flex"
        >
          {primaryLinks.map((link) => (
            <DesktopNavLink
              active={isActivePath(pathname, link.href)}
              key={link.href}
              {...link}
            />
          ))}
        </nav>

        <div className="hidden items-center md:flex">
          <Button href="/app/new" size="sm" variant={primaryCtaVariant}>
            Start my listing
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Button href="/app/new" size="sm" variant={primaryCtaVariant}>
            Start my listing
          </Button>
          <button
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            className="inline-flex h-11 w-11 items-center justify-center rounded-button border border-line-strong bg-card text-ink transition-colors duration-150 hover:border-ink"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <>
          <button
            aria-label="Dismiss navigation menu"
            className="fixed inset-x-0 bottom-0 top-16 z-20 cursor-default bg-ink/20 md:hidden"
            onClick={() => setMenuOpen(false)}
            tabIndex={-1}
            type="button"
          />
          <div
            className="absolute inset-x-0 top-full z-30 border-b border-line bg-paper shadow-[0_18px_44px_rgb(7_33_27_/_14%)] md:hidden"
            id="mobile-navigation"
          >
            <div className="vr-frame max-h-[calc(100dvh-4rem)] overflow-y-auto pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
              <nav aria-label="Mobile primary" className="grid gap-1">
                <MobileNavLink
                  active={pathname === "/"}
                  href="/"
                  label="Home"
                />
                {primaryLinks.map((link) => (
                  <MobileNavLink
                    active={isActivePath(pathname, link.href)}
                    key={link.href}
                    {...link}
                  />
                ))}
              </nav>

              <div className="mt-3 grid gap-2 border-t border-line pt-3">
                <Button fullWidth href="/app/new" size="lg">
                  Start my listing
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  {mobileActions.map((action) => (
                    <MobileActionLink
                      active={isActivePath(pathname, action.href)}
                      key={action.href}
                      {...action}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}

function DesktopNavLink({
  active,
  href,
  label,
}: NavLink & { active: boolean }) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={[
        "py-2 no-underline transition-colors duration-150 hover:text-ink",
        active ? "text-ink" : "text-text-muted",
      ].join(" ")}
      href={href}
    >
      {label}
    </Link>
  );
}

function MobileNavLink({ active, href, label }: NavLink & { active: boolean }) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={[
        "flex min-h-[52px] items-center justify-between rounded-card border px-4 text-base font-semibold no-underline transition-colors duration-150",
        active
          ? "border-ink bg-ink text-on-ink"
          : "border-line bg-card text-ink hover:border-line-strong",
      ].join(" ")}
      href={href}
    >
      <span>{label}</span>
      <ChevronIcon />
    </Link>
  );
}

function MobileActionLink({
  active,
  href,
  label,
}: NavLink & { active: boolean }) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={[
        "inline-flex min-h-12 items-center justify-center rounded-button border px-3 text-center text-sm font-semibold leading-tight no-underline transition-colors duration-150",
        active
          ? "border-ink bg-ink text-on-ink"
          : "border-line-strong bg-transparent text-ink hover:border-ink hover:bg-ink/[0.03]",
      ].join(" ")}
      href={href}
    >
      {label}
    </Link>
  );
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.75"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-text-faint"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}
