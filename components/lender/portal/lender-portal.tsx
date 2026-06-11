"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export type LenderAuctionCard = {
  auction?: {
    bestAprBp?: number | null;
    bidCount: number;
    closesAt: string;
    id: string;
    status: string;
  } | null;
  county?: string | null;
  creditBandStated: string;
  dtiBand?: string | null;
  id: string;
  loanAmount: number;
  ltvBand: string;
  occupancy: string;
  propertyType: string;
  purpose: string;
  state: string;
};

export type LenderPortalProps = {
  auctions: LenderAuctionCard[];
  bids: {
    aprBp: number;
    auctionId: string;
    auctionListingId: string;
    id: string;
    product: string;
    rateBp: number;
    status: string;
  }[];
  org?: {
    id: string;
    legalName: string;
    status: string;
  } | null;
  wallet?: {
    balance: number;
    plan: string;
    transactions: {
      createdAt: string;
      delta: number;
      id: string;
      reason: string;
    }[];
  } | null;
};

export function LenderPortal({
  auctions,
  bids,
  org,
  wallet,
}: LenderPortalProps) {
  const [selectedAuctionId, setSelectedAuctionId] = useState(
    auctions.find((auction) => auction.auction?.status === "OPEN")?.auction?.id,
  );
  const [message, setMessage] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);

  if (!org || org.status !== "APPROVED") {
    return (
      <main className="vr-section min-h-screen bg-paper">
        <div className="vr-frame">
          <section className="vr-card p-6">
            <h1 className="font-sans text-4xl font-semibold text-ink">
              Lender portal pending
            </h1>
            <p className="mt-3 text-text-muted">
              Admin approval is required before board access opens.
            </p>
            <div className="mt-5">
              <Button href="/lender/onboarding" variant="secondary">
                Finish onboarding
              </Button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  async function submitDemoBid() {
    if (!selectedAuctionId || !org) {
      return;
    }

    setIsBusy(true);
    setMessage(undefined);

    const bidAttempt = bidAttemptForAuction(bids, selectedAuctionId);
    const response = await fetch("/api/lender/bids", {
      body: JSON.stringify({
        auctionId: selectedAuctionId,
        idempotencyKey: `bid:${selectedAuctionId}:${org.id}:${bidAttempt}`,
        itemizedFees: [
          {
            amountCents: 99_500,
            financeCharge: true,
            label: "Origination",
          },
          {
            amountCents: 65_000,
            financeCharge: false,
            label: "Appraisal",
          },
        ],
        lockDays: 45,
        points: 0.25,
        product: "30Y_FIXED",
        program: "Verified profile",
        rateBp: 599,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as {
      aprBp?: number;
      error?: string;
    };

    setIsBusy(false);

    if (!response.ok) {
      setMessage(result.error ?? "Bid could not be saved.");
      return;
    }

    setMessage(`Bid submitted at APR ${formatBp(result.aprBp ?? 0)}.`);
  }

  return (
    <main className="min-h-screen bg-paper">
      <div className="grid min-h-screen lg:grid-cols-[220px_1fr]">
        <aside className="bg-ink px-4 py-5 text-on-ink lg:min-h-screen">
          <Link
            aria-label="VieRates home"
            className="inline-flex items-center no-underline"
            href="/"
          >
            <Image
              alt=""
              className="h-9 w-9"
              height={44}
              src="/assets/logo-mark.svg"
              width={44}
            />
            <span className="ml-3 text-xl font-semibold text-on-ink">
              VieRates
            </span>
          </Link>
          <nav className="mt-8 grid gap-1 text-sm font-semibold">
            {[
              "Board",
              "My bids",
              "Connections",
              "Wallet",
              "ROI",
              "Settings",
            ].map((item, index) => (
              <a
                className={[
                  "rounded-button px-3 py-2 no-underline",
                  index === 0
                    ? "bg-card text-ink"
                    : "text-on-ink-dim hover:bg-on-ink/10 hover:text-on-ink",
                ].join(" ")}
                href={`#${item.toLowerCase().replaceAll(" ", "-")}`}
                key={item}
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="mt-8 rounded-card border border-ink-line p-4">
            <p className="text-xs font-semibold text-on-ink-dim">Wallet</p>
            <p className="vr-data mt-1 text-2xl font-semibold text-on-ink">
              {wallet?.balance ?? 0}
            </p>
            <p className="text-xs text-on-ink-dim">
              credits · {wallet?.plan ?? "No plan"}
            </p>
          </div>
        </aside>

        <div className="grid content-start gap-6 p-4 md:p-8" id="board">
          <header className="flex flex-col justify-between gap-4 border-b border-line pb-6 md:flex-row md:items-end">
            <div>
              <h1 className="font-sans text-3xl font-semibold text-ink md:text-4xl">
                Lender board
              </h1>
              <p className="mt-3 max-w-2xl text-text-muted">
                Masked verified auctions in your approved coverage box.
              </p>
            </div>
            <div className="rounded-card border border-line bg-card p-4">
              <p className="text-xs font-semibold text-text-muted">Best APR</p>
              <p className="vr-data mt-1 text-2xl font-semibold text-ink">
                {bestAprLabel(auctions)}
              </p>
              <p className="text-xs text-text-muted">held by Paddle #3</p>
            </div>
          </header>

          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-3">
              {auctions.length === 0 ? (
                <article className="rounded-card border border-line bg-card p-5">
                  <h2 className="font-sans text-lg font-semibold text-ink">
                    No matched auctions yet.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    Expand your Coverage Box to see more masked verified
                    borrowers as they enter the board.
                  </p>
                </article>
              ) : null}
              {auctions.map((auction) => (
                <article
                  className={[
                    "rounded-card border bg-card p-4",
                    selectedAuctionId === auction.auction?.id
                      ? "border-ink shadow-[var(--shadow-1)]"
                      : "border-line",
                  ].join(" ")}
                  key={auction.id}
                >
                  <div className="flex flex-col justify-between gap-3 md:flex-row">
                    <div>
                      <h2 className="font-sans text-lg font-semibold text-ink">
                        {auction.county ?? "County hidden"}, {auction.state}
                      </h2>
                      <p className="mt-1 text-sm text-text-muted">
                        {humanize(auction.purpose)} ·{" "}
                        {humanize(auction.propertyType)} ·{" "}
                        {humanize(auction.occupancy)}
                      </p>
                    </div>
                    <span className="vr-data text-sm font-semibold text-paddle">
                      {auction.auction?.bidCount ?? 0} bids
                    </span>
                  </div>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-4">
                    <Metric label="Loan" value={currency(auction.loanAmount)} />
                    <Metric label="LTV" value={`${auction.ltvBand}%`} />
                    <Metric
                      label="Credit"
                      value={humanize(auction.creditBandStated)}
                    />
                    <Metric label="DTI" value={auction.dtiBand ?? "Pending"} />
                  </dl>
                  {auction.auction?.status === "OPEN" ? (
                    <Button
                      onClick={() => setSelectedAuctionId(auction.auction?.id)}
                      variant="secondary"
                    >
                      Select for bid
                    </Button>
                  ) : null}
                </article>
              ))}
            </div>

            <aside className="grid gap-4 content-start">
              <section className="rounded-card border border-line bg-card p-5 shadow-[var(--shadow-1)]">
                <h2 className="font-sans text-2xl font-semibold text-ink">
                  Bid composer
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  Best APR is anonymized on the board. Borrowers compare your
                  APR, fees, lock, and conditions before choosing.
                </p>
                <div className="mt-5">
                  <Button
                    disabled={!selectedAuctionId || isBusy}
                    onClick={() => void submitDemoBid()}
                  >
                    Place bid — 1 credit + $2 data surcharge
                  </Button>
                </div>
                {message ? (
                  <p className="mt-4 rounded-ui border border-line bg-paper p-3 text-sm text-text-muted">
                    {message}
                  </p>
                ) : null}
              </section>

              <section
                className="rounded-card border border-line bg-card p-5"
                id="my-bids"
              >
                <h2 className="font-sans text-2xl font-semibold text-ink">
                  My bids
                </h2>
                <div className="mt-4 grid gap-3">
                  {bids.map((bid) => (
                    <div
                      className="grid grid-cols-3 gap-3 border-b border-line pb-3 text-sm last:border-b-0"
                      key={bid.id}
                    >
                      <span>{bid.product}</span>
                      <span className="vr-data">{formatBp(bid.aprBp)}</span>
                      <span>{humanize(bid.status)}</span>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}

function bestAprLabel(auctions: LenderAuctionCard[]): string {
  const values = auctions
    .map((auction) => auction.auction?.bestAprBp)
    .filter((value): value is number => typeof value === "number");

  return values.length ? formatBp(Math.min(...values)) : "No bids";
}

function bidAttemptForAuction(
  bids: LenderPortalProps["bids"],
  auctionId: string,
): "improve" | "initial" {
  return bids.some((bid) => bid.auctionId === auctionId)
    ? "improve"
    : "initial";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-text-muted">{label}</dt>
      <dd className="vr-data mt-1 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}

function currency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatBp(value: number): string {
  return `${(value / 100).toFixed(2)}%`;
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
