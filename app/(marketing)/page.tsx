import Link from "next/link";

import { FooterDisclosures } from "@/components/footer-disclosures";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1100px] flex-col px-6 py-8">
      <header className="flex items-center justify-between gap-6 py-4">
        <Link className="font-display text-2xl font-semibold" href="/">
          VieRates
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-5 text-sm">
          <a className="text-slate hover:text-ink" href="/lender">
            Lenders
          </a>
          <a className="text-slate hover:text-ink" href="/admin">
            Admin
          </a>
        </nav>
      </header>
      <section className="grid flex-1 items-center gap-10 py-16 md:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <h1 className="max-w-3xl font-display text-5xl font-semibold leading-tight tracking-normal md:text-6xl">
            Lenders bid. You choose. Your name stays hidden until you do.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate">
            List your loan anonymously and watch verified lenders compete with
            firm bids for 48 hours. Free for borrowers.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button href="/app">Start my free listing</Button>
            <Button href="/lender" variant="ghost">
              Lender access
            </Button>
          </div>
        </div>
        <div className="rounded-ui border border-ink/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-ink/10 pb-3">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate">
              Example bid room
            </p>
            <p className="font-mono text-sm text-funded">3 active bids</p>
          </div>
          <div className="space-y-3 font-mono text-sm tabular-nums">
            <div className="grid grid-cols-3 gap-4 rounded-ui bg-paddle/15 p-3">
              <span>30Y fixed</span>
              <span className="text-right">6.125%</span>
              <span className="text-right text-funded">APR 6.32%</span>
            </div>
            <div className="grid grid-cols-3 gap-4 rounded-ui border border-ink/10 p-3">
              <span>30Y fixed</span>
              <span className="text-right">6.250%</span>
              <span className="text-right">APR 6.48%</span>
            </div>
            <div className="grid grid-cols-3 gap-4 rounded-ui border border-ink/10 p-3">
              <span>20Y fixed</span>
              <span className="text-right">5.875%</span>
              <span className="text-right">APR 6.11%</span>
            </div>
          </div>
        </div>
      </section>
      <FooterDisclosures />
    </main>
  );
}
