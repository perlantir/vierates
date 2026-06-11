"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { captureFunnelEvent } from "@/lib/analytics/client";

type TwoDoorsProps = {
  assumptions?: string;
  asOfDate?: string;
  highApr?: string;
  lowApr?: string;
};

export function TwoDoors({
  assumptions = "Illustrative data until aggregate VieRates auction data is available for similar verified profiles.",
  asOfDate = "June 11, 2026",
  highApr = "6.41",
  lowApr = "6.13",
}: TwoDoorsProps) {
  useEffect(() => {
    void captureFunnelEvent("doors_viewed", "two_doors");
  }, []);

  return (
    <section className="grid gap-5" data-testid="two-doors">
      <div>
        <h2 className="font-sans text-3xl font-semibold leading-tight text-ink">
          You&apos;re listed. Here&apos;s your market.
        </h2>
        <div className="mt-5 rounded-card border border-line bg-card p-5">
          <p className="text-sm leading-6 text-text-muted">
            Verified borrowers like you received bids between{" "}
            <span className="vr-data text-2xl font-medium text-ink">
              {lowApr}%–{highApr}%
            </span>{" "}
            this week.{" "}
            <span className="vr-data text-xs text-text-muted">
              (as-of {asOfDate})
            </span>
          </p>
          <p className="mt-3 text-xs leading-5 text-text-muted">
            {assumptions}
          </p>
        </div>
      </div>

      <article className="rounded-card border border-paddle bg-card p-5">
        <h3 className="text-sm font-semibold tracking-[0.06em] text-text-muted">
          Open my Bid Room
        </h3>
        <p className="mt-3 text-sm leading-6 text-text">
          Lenders compete with firm, lockable offers. About 3 minutes · soft
          check only · no score impact · you stay anonymous.
        </p>
        <div className="mt-5">
          <Button
            href="/app/verify"
            onClick={() =>
              void captureFunnelEvent("door_selected", "two_doors", {
                door: "bidroom",
              })
            }
          >
            Open my Bid Room
          </Button>
        </div>
      </article>

      <article className="rounded-card border border-line bg-card p-5">
        <h3 className="text-sm font-semibold tracking-[0.06em] text-text-muted">
          Connect with one lender
        </h3>
        <p className="mt-3 text-sm leading-6 text-text">
          Browse verified lenders and introduce yourself to one. No verification
          needed.
        </p>
        <div className="mt-5">
          <Button
            href="/app/lenders"
            onClick={() =>
              void captureFunnelEvent("door_selected", "two_doors", {
                door: "connect",
              })
            }
            variant="secondary"
          >
            Browse lenders
          </Button>
        </div>
      </article>

      <Link
        className="w-fit text-sm font-semibold text-ink no-underline underline-offset-4 hover:underline"
        href="/how-it-works"
      >
        What&apos;s the difference?
      </Link>
    </section>
  );
}
