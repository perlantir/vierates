"use client";

import { useEffect, useRef, useState } from "react";

export type LedgerBid = {
  apr: string;
  id: string;
  lender: string;
  points: number;
  product?: string;
  profile?: string;
  rate: string;
  savings?: string;
  time?: string;
};

type LiveBidLedgerProps = {
  bids: LedgerBid[];
  feed?: Omit<LedgerBid, "id">[];
  interval?: number;
  live?: boolean;
  maxRows?: number;
  surface?: "light" | "dark";
  title?: string;
  windowLabel?: string;
};

export function LiveBidLedger({
  bids,
  feed = [],
  interval = 2800,
  live = false,
  maxRows = 6,
  surface = "light",
  title = "Example bids",
  windowLabel,
}: LiveBidLedgerProps) {
  const [rows, setRows] = useState(bids);
  const [enterId, setEnterId] = useState<string | null>(null);
  const feedIndex = useRef(0);
  const dark = surface === "dark";

  useEffect(() => {
    setRows(bids);
  }, [bids]);

  useEffect(() => {
    if (!live || feed.length === 0) {
      return;
    }

    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const timer = window.setInterval(() => {
      const next = feed[feedIndex.current % feed.length];
      feedIndex.current += 1;
      const id = `feed-${feedIndex.current}`;
      setRows((current) => [{ ...next, id }, ...current].slice(0, maxRows));
      if (!reduce) {
        setEnterId(id);
      }
    }, interval);

    return () => window.clearInterval(timer);
  }, [feed, interval, live, maxRows]);

  const bestApr = rows.length
    ? Math.min(...rows.map((row) => Number.parseFloat(row.apr)))
    : null;

  return (
    <section
      aria-label={title}
      className={[
        "overflow-hidden rounded-card border shadow-[var(--shadow-2)]",
        dark
          ? "border-ink-line bg-ink text-on-ink"
          : "border-line bg-card text-ink",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center justify-between gap-4 border-b px-4 py-2.5 sm:py-3",
          dark ? "border-ink-line" : "border-line",
        ].join(" ")}
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-verified shadow-[0_0_0_3px_var(--verified-tint)]" />
          <div className="text-sm font-semibold">{title}</div>
        </div>
        {windowLabel ? (
          <p
            className={[
              "vr-data text-xs",
              dark ? "text-on-ink-dim" : "text-text-muted",
            ].join(" ")}
          >
            {windowLabel}
          </p>
        ) : null}
      </div>

      <div
        aria-live={live ? "polite" : "off"}
        className={[
          "grid grid-cols-[0.68fr_1fr_1fr_auto] gap-3 px-4 py-2 text-xs font-semibold tracking-[0.06em]",
          dark ? "text-on-ink-dim" : "text-text-muted",
        ].join(" ")}
      >
        <span>Time</span>
        <span>Profile</span>
        <span>Product</span>
        <span className="text-right">APR</span>
      </div>

      <div>
        {rows.map((row, index) => {
          const isBest = Number.parseFloat(row.apr) === bestApr;
          const rowTime = row.time ?? `${indexFromId(row.id) * 2}m ago`;
          return (
            <div
              className={[
                "grid grid-cols-[0.68fr_1fr_1fr_auto] items-center gap-3 border-t px-4 py-2.5 sm:py-3",
                index > 3 ? "hidden sm:grid" : "",
                row.id === enterId ? "vr-ledger-enter" : "",
                dark ? "border-ink-line" : "border-line",
                isBest && !dark ? "bg-[var(--paddle-tint)]" : "",
                isBest && dark ? "bg-paddle/10" : "",
              ].join(" ")}
              key={row.id}
            >
              <span
                className={[
                  "vr-data text-xs",
                  dark ? "text-on-ink-dim" : "text-text-muted",
                ].join(" ")}
              >
                {rowTime}
              </span>
              <span
                className={[
                  "truncate text-sm",
                  isBest
                    ? "font-semibold"
                    : dark
                      ? "text-on-ink-dim"
                      : "text-text-muted",
                ].join(" ")}
              >
                {row.profile ?? "FICO 720–759"}
              </span>
              <span
                className={[
                  "truncate text-sm",
                  dark ? "text-on-ink-dim" : "text-text-muted",
                ].join(" ")}
              >
                {row.product ?? row.lender}
              </span>
              <span
                className={[
                  "vr-data min-w-20 text-right text-base font-semibold",
                  isBest ? "text-paddle" : dark ? "text-on-ink" : "text-ink",
                ].join(" ")}
              >
                {row.apr}%
              </span>
              {isBest && row.savings ? (
                <span className="col-span-4 text-right text-xs font-semibold text-verified">
                  {row.savings}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <p
        className={[
          "hidden border-t px-4 py-3 text-xs leading-5 sm:block",
          dark
            ? "border-ink-line text-on-ink-dim"
            : "border-line text-text-muted",
        ].join(" ")}
      >
        Illustrative bids as of June 11, 2026. Lenders see only masked bands
        before you choose. Assumes $450,000 loan amount, 75% LTV, FICO 740+,
        45-day lock.
      </p>
    </section>
  );
}

function indexFromId(id: string): number {
  const trailingNumber = Number.parseInt(id.match(/\d+$/)?.[0] ?? "1", 10);
  return Number.isFinite(trailingNumber) ? trailingNumber : 1;
}
