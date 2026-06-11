"use client";

import { useState } from "react";

import { TwoDoors } from "@/components/borrower/two-doors";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { captureFunnelEvent } from "@/lib/analytics/client";

export type BorrowerDashboardListing = {
  auction?: {
    bestAprBp?: number | null;
    bidCount: number;
    closesAt: string;
    id: string;
    status: string;
  } | null;
  connections: {
    createdAt: string;
    lenderName: string;
    nmlsId: string;
    status: string;
  }[];
  county?: string | null;
  creditBandStated: string;
  id: string;
  incomeBandStated: string;
  loanAmount: number;
  ltvBand: string;
  propertyMatchOk: boolean;
  propertyType: string;
  purpose: string;
  rateWatchNurtureFlag: boolean;
  state: string;
  status: string;
  timeline: string;
};

type BorrowerDashboardProps = {
  listing?: BorrowerDashboardListing | null;
};

export function BorrowerDashboard({ listing }: BorrowerDashboardProps) {
  const [rateWatchEnabled, setRateWatchEnabled] = useState(
    Boolean(listing?.rateWatchNurtureFlag),
  );
  const [confirmText, setConfirmText] = useState("");
  const [message, setMessage] = useState<string>();
  const [deleted, setDeleted] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  if (!listing || deleted) {
    return (
      <main className="vr-section min-h-screen bg-paper">
        <div className="vr-frame">
          <EmptyState
            actionHref="/app/new"
            actionLabel="Start my listing"
            body="Create an anonymous profile before lenders see anything."
            title="No active listing"
          />
        </div>
      </main>
    );
  }

  async function toggleRateWatch(enabled: boolean) {
    if (!listing) {
      return;
    }

    setRateWatchEnabled(enabled);
    setMessage(undefined);

    const response = await fetch(
      `/api/borrower/listings/${listing.id}/rate-watch`,
      {
        body: JSON.stringify({ enabled }),
        headers: { "content-type": "application/json" },
        method: "POST",
      },
    );

    if (!response.ok) {
      setRateWatchEnabled(!enabled);
      setMessage("Rate watch could not be updated.");
      return;
    }

    if (enabled) {
      void captureFunnelEvent("ratewatch_enabled", "borrower_dashboard", {
        listingId: listing.id,
        status: "enabled",
      });
    }

    setMessage(enabled ? "Rate watch is on." : "Rate watch is off.");
  }

  async function deleteListing() {
    if (!listing || confirmText !== "DELETE") {
      return;
    }

    setIsBusy(true);
    setMessage(undefined);

    const response = await fetch(`/api/borrower/listings/${listing.id}`, {
      method: "DELETE",
    });

    setIsBusy(false);

    if (!response.ok) {
      setMessage("Listing and data could not be deleted.");
      return;
    }

    setDeleted(true);
  }

  return (
    <main className="vr-section min-h-screen bg-paper">
      <div className="vr-frame grid gap-6">
        <header className="flex flex-col justify-between gap-4 border-b border-line pb-6 md:flex-row md:items-end">
          <div>
            <h1 className="font-sans text-4xl font-semibold leading-tight text-ink md:text-5xl">
              Borrower dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-text-muted">
              Your listing stays anonymous until you choose a lender.
            </p>
          </div>
          <span className="w-fit rounded-ui border border-line bg-card px-3 py-2 text-sm font-semibold text-ink">
            {listing.status}
          </span>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="vr-card p-5">
            <div className="flex flex-col justify-between gap-4 border-b border-line pb-4 md:flex-row md:items-start">
              <div>
                <h2 className="font-sans text-2xl font-semibold text-ink">
                  Listing status
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  {listing.county ?? "Matched county"}, {listing.state} ·{" "}
                  {humanize(listing.propertyType)} · {humanize(listing.purpose)}
                </p>
              </div>
              <span className="rounded-ui border border-line bg-paper px-3 py-2 text-sm font-semibold text-text-muted">
                {listing.propertyMatchOk ? "Property matched" : "Manual review"}
              </span>
            </div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Loan amount"
                value={currency(listing.loanAmount)}
              />
              <Metric label="LTV band" value={`${listing.ltvBand}%`} />
              <Metric
                label="Credit band"
                value={humanize(listing.creditBandStated)}
              />
              <Metric label="Timeline" value={humanize(listing.timeline)} />
            </dl>
          </article>

          {listing.auction ? (
            <article className="vr-card p-5">
              <h2 className="font-sans text-2xl font-semibold text-ink">
                Bid Room
              </h2>
              <div className="mt-4 grid gap-3">
                <p className="text-sm text-text-muted">
                  Auction {humanize(listing.auction.status)} · closes{" "}
                  <span className="vr-data">
                    {new Date(listing.auction.closesAt).toLocaleString()}
                  </span>
                </p>
                <p className="font-mono text-4xl font-semibold text-paddle">
                  {listing.auction.bidCount}
                </p>
                <p className="text-sm text-text-muted">bids received</p>
                <div>
                  <Button href={`/app/auction/${listing.auction.id}`}>
                    Compare bids
                  </Button>
                </div>
              </div>
            </article>
          ) : (
            <TwoDoors
              assumptions={`${currency(listing.loanAmount)} loan, ${listing.ltvBand}% LTV, ${humanize(listing.creditBandStated)} stated credit band, 45-day lock. Illustrative data until aggregate VieRates auction data is available.`}
              highApr="6.72"
              lowApr="6.21"
            />
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="vr-card p-5">
            <h2 className="font-sans text-2xl font-semibold text-ink">
              Connect activity
            </h2>
            <ol className="mt-5 grid gap-3">
              {listing.connections.length > 0 ? (
                listing.connections.map((connection) => (
                  <li
                    className="grid gap-1 border-l-2 border-line pl-4"
                    key={`${connection.lenderName}-${connection.createdAt}`}
                  >
                    <p className="font-semibold text-ink">
                      {connection.lenderName}
                    </p>
                    <p className="text-sm text-text-muted">
                      {humanize(connection.status)} · NMLS {connection.nmlsId}
                    </p>
                  </li>
                ))
              ) : (
                <>
                  <TimelineStub label="Requested" />
                  <TimelineStub label="Delivered" />
                  <TimelineStub label="They reached out" />
                </>
              )}
            </ol>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="vr-card p-5">
            <h2 className="font-sans text-2xl font-semibold text-ink">
              Rate watch
            </h2>
            <label className="mt-4 flex min-h-11 items-center justify-between gap-4 rounded-ui border border-line bg-card p-3">
              <span className="text-sm font-semibold text-ink">
                Keep watching this market
              </span>
              <input
                aria-label="Rate watch"
                checked={rateWatchEnabled}
                className="h-5 w-5 accent-ink"
                onChange={(event) => void toggleRateWatch(event.target.checked)}
                type="checkbox"
              />
            </label>
          </article>

          <article className="vr-card border-alert p-5">
            <h2 className="font-sans text-2xl font-semibold text-ink">
              Delete listing and data
            </h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              This removes your identity vault details and closes the listing.
              Type DELETE to confirm.
            </p>
            <label className="mt-4 grid gap-2 text-sm font-semibold text-ink">
              Confirmation
              <input
                className="min-h-11 rounded-ui border border-line bg-card px-3 text-base font-normal"
                onChange={(event) => setConfirmText(event.target.value)}
                value={confirmText}
              />
            </label>
            <div className="mt-4">
              <Button
                disabled={confirmText !== "DELETE" || isBusy}
                onClick={() => void deleteListing()}
                variant="danger"
              >
                Delete my listing & data
              </Button>
            </div>
          </article>
        </section>

        {message ? (
          <p className="rounded-ui border border-line bg-card p-3 text-sm text-text-muted">
            {message}
          </p>
        ) : null}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-text-muted">{label}</dt>
      <dd className="vr-data mt-1 text-base font-semibold text-ink">{value}</dd>
    </div>
  );
}

function TimelineStub({ label }: { label: string }) {
  return (
    <li className="grid gap-1 border-l-2 border-line pl-4">
      <p className="font-semibold text-ink">{label}</p>
      <p className="text-sm text-text-muted">Waiting for a selected lender.</p>
    </li>
  );
}

function currency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
