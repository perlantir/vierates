"use client";

import { Button } from "@/components/ui/button";

export default function MarketingError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="vr-section min-h-[70vh] bg-paper">
      <div className="vr-frame max-w-3xl">
        <p className="vr-data text-sm text-text-muted">Page unavailable</p>
        <h1 className="mt-3 font-display text-5xl font-semibold leading-tight text-ink">
          This page did not load cleanly.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-text-muted">
          Try again, or return to the homepage while we keep the marketplace
          sealed.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={reset} variant="secondary">
            Try again
          </Button>
          <Button href="/">Go home</Button>
        </div>
      </div>
    </main>
  );
}
