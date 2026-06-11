"use client";

import { useState } from "react";

import { RateDisplay } from "@/components/rate-display";
import { Button } from "@/components/ui/button";

export type BorrowerBidRoomBid = {
  aprBp: number;
  asOfDate: string;
  conditions?: string | null;
  feesLabel: string;
  id: string;
  lenderName: string;
  lockDays: number;
  points: string;
  product: string;
  program: string;
  rateBp: number;
};

type BorrowerBidRoomProps = {
  auction: {
    closesAt: string;
    id: string;
    pickDeadline?: string | null;
    status: string;
  };
  bids: BorrowerBidRoomBid[];
};

export function BorrowerBidRoom({ auction, bids }: BorrowerBidRoomProps) {
  const [selectedBidId, setSelectedBidId] = useState(bids[0]?.id);
  const [message, setMessage] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);
  const selectedBid = bids.find((bid) => bid.id === selectedBidId);
  const canPick = auction.status === "CLOSED" && Boolean(selectedBid);

  async function pickBid() {
    if (!selectedBid) {
      return;
    }

    setIsBusy(true);
    setMessage(undefined);

    const response = await fetch(`/api/borrower/auctions/${auction.id}/pick`, {
      body: JSON.stringify({ bidId: selectedBid.id }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string; ok?: boolean };

    setIsBusy(false);

    if (!response.ok || !result.ok) {
      setMessage(result.error ?? "Bid could not be picked.");
      return;
    }

    setMessage(
      `Your identity goes to ${selectedBid.lenderName} only. The other lenders never learn who you were.`,
    );
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-6 md:px-8 md:py-10">
      <section className="mx-auto grid max-w-5xl gap-6">
        <header className="grid gap-3 border-b border-line pb-5">
          <p className="vr-data text-sm text-text-muted">
            Auction {humanize(auction.status)} · closes{" "}
            {new Date(auction.closesAt).toLocaleString()}
          </p>
          <h1 className="font-sans text-3xl font-semibold leading-tight text-ink md:text-4xl">
            Compare your bids.
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-text-muted">
            Every offer shows APR first, then note rate, fees, points, lock
            length, and conditions.
          </p>
        </header>

        {bids.length === 0 ? (
          <div className="rounded-card border border-line bg-card p-6">
            <p className="text-sm leading-6 text-text-muted">
              Your Bid Room is warming up. You will see firm, comparable bids
              here as lenders respond.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="grid gap-3">
              {bids.map((bid, index) => (
                <button
                  aria-pressed={bid.id === selectedBidId}
                  className={[
                    "rounded-card border bg-card p-4 text-left transition-colors",
                    bid.id === selectedBidId
                      ? "border-ink shadow-[var(--shadow-1)]"
                      : "border-line hover:border-line-strong",
                  ].join(" ")}
                  key={bid.id}
                  onClick={() => setSelectedBidId(bid.id)}
                  type="button"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-sm font-semibold text-text-muted">
                        Paddle #{index + 1}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-ink">
                        {bid.lenderName}
                      </h2>
                      <p className="mt-1 text-sm text-text-muted">
                        {humanize(bid.product)} · {bid.program}
                      </p>
                    </div>
                    <div className="max-w-sm text-left sm:text-right">
                      <RateDisplay
                        apr={formatBp(bid.aprBp)}
                        asOfDate={formatDisplayDate(bid.asOfDate)}
                        assumptions={bidAssumptions(bid)}
                        rate={formatBp(bid.rateBp)}
                      />
                    </div>
                  </div>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                    <Metric label="Points" value={bid.points} />
                    <Metric label="Lock" value={`${bid.lockDays} days`} />
                    <Metric label="Fees" value={bid.feesLabel} />
                  </dl>
                  {bid.conditions ? (
                    <p className="mt-3 rounded-ui border border-caution bg-caution-tint p-3 text-xs leading-5 text-caution">
                      {bid.conditions}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>

            <aside className="rounded-card border border-line bg-card p-5">
              <h2 className="font-sans text-2xl font-semibold text-ink">
                Pick and reveal
              </h2>
              <p className="mt-3 text-sm leading-6 text-text-muted">
                {selectedBid
                  ? `Your identity goes to ${selectedBid.lenderName} only. The other lenders never learn who you were.`
                  : "Select a bid to review the reveal consent."}
              </p>
              <div className="mt-5">
                <Button
                  disabled={!canPick || isBusy}
                  fullWidth
                  onClick={() => void pickBid()}
                >
                  {selectedBid
                    ? `Reveal my identity to ${selectedBid.lenderName}`
                    : "Reveal my identity"}
                </Button>
              </div>
              {!canPick ? (
                <p className="mt-3 text-xs leading-5 text-text-muted">
                  Picking opens after the auction closes.
                </p>
              ) : null}
              {message ? (
                <p className="mt-4 rounded-ui border border-line bg-paper p-3 text-sm leading-6 text-text-muted">
                  {message}
                </p>
              ) : null}
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-text-muted">{label}</dt>
      <dd className="vr-data mt-1 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}

function formatBp(value: number): string {
  return `${(value / 100).toFixed(2)}%`;
}

function formatDisplayDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function bidAssumptions(bid: BorrowerBidRoomBid): string {
  return `${humanize(bid.product)} ${bid.program}; ${bid.lockDays}-day lock; fees ${bid.feesLabel}; ${bid.points} points.`;
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
