import Link from "next/link";

import { Button } from "@/components/ui/button";

export function NavBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bone/95 backdrop-blur">
      <div className="vr-frame flex min-h-16 items-center justify-between gap-6">
        <Link
          className="font-display text-2xl font-extrabold no-underline"
          href="/"
        >
          VieRates
        </Link>
        <nav
          aria-label="Primary"
          className="hidden items-center gap-6 text-sm font-medium text-slate md:flex"
        >
          <Link href="/how-it-works">How it works</Link>
          <Link href="/bid-index">Bid index</Link>
          <Link href="/trust">Trust</Link>
          <Link href="/lenders">Lenders</Link>
        </nav>
        <Button href="/app/new" size="sm">
          Start my listing
        </Button>
      </div>
    </header>
  );
}
