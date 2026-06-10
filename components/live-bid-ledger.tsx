"use client";

import { useEffect, useRef, useState } from "react";

export type LedgerBid = {
  apr: string;
  id: string;
  lender: string;
  points: number;
  rate: string;
  savings?: string;
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
      const id = `feed-${Date.now()}`;
      setRows((current) => [{ ...next, id }, ...current].slice(0, maxRows));
      if (!reduce) {
        setEnterId(id);
      }
    }, interval);

    return () => window.clearInterval(timer);
  }, [feed, interval, live, maxRows]);

  const bestRate = rows.length
    ? Math.min(...rows.map((row) => Number.parseFloat(row.rate)))
    : null;

  return (
    <section
      aria-label={title}
      className={[
        "overflow-hidden rounded-lg border shadow-[var(--shadow-2)]",
        dark
          ? "border-ink-line bg-ink text-on-ink"
          : "border-line bg-paper text-ink",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center justify-between gap-4 border-b px-4 py-3",
          dark ? "border-ink-line" : "border-line",
        ].join(" ")}
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-funded shadow-[0_0_0_3px_rgba(23,126,99,0.18)]" />
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        {windowLabel ? (
          <p
            className={[
              "vr-data text-xs",
              dark ? "text-on-ink-dim" : "text-slate",
            ].join(" ")}
          >
            {windowLabel}
          </p>
        ) : null}
      </div>

      <div
        className={[
          "grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-2 text-xs font-bold uppercase",
          dark ? "text-on-ink-dim" : "text-slate",
        ].join(" ")}
      >
        <span>Lender</span>
        <span className="text-right">Rate</span>
        <span className="text-right">APR</span>
        <span className="min-w-11 text-right">Pts</span>
      </div>

      <div>
        {rows.map((row) => {
          const isBest = Number.parseFloat(row.rate) === bestRate;
          return (
            <div
              className={[
                "grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-t px-4 py-3",
                row.id === enterId ? "vr-ledger-enter" : "",
                dark ? "border-ink-line" : "border-line",
                isBest && !dark ? "bg-[var(--paddle-tint)]" : "",
                isBest && dark ? "bg-paddle/10" : "",
              ].join(" ")}
              key={row.id}
            >
              <span className="flex min-w-0 items-center gap-2">
                {isBest ? (
                  <span className="h-1.5 w-1.5 flex-none rounded-full bg-paddle" />
                ) : null}
                <span
                  className={[
                    "truncate text-sm",
                    isBest
                      ? "font-semibold"
                      : dark
                        ? "text-on-ink-dim"
                        : "text-slate",
                  ].join(" ")}
                >
                  {row.lender}
                </span>
              </span>
              <span
                className={[
                  "vr-data text-right text-base font-semibold",
                  isBest ? "text-paddle" : "",
                ].join(" ")}
              >
                {row.rate}%
              </span>
              <span
                className={[
                  "vr-data text-right text-sm",
                  dark ? "text-on-ink-dim" : "text-slate",
                ].join(" ")}
              >
                {row.apr}%
              </span>
              <span
                className={[
                  "vr-data min-w-11 text-right text-sm",
                  dark ? "text-on-ink-dim" : "text-slate",
                ].join(" ")}
              >
                {row.points.toFixed(2)}
              </span>
              {isBest && row.savings ? (
                <span className="col-span-4 text-right text-xs font-semibold text-funded">
                  {row.savings}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <p
        className={[
          "border-t px-4 py-3 text-xs leading-5",
          dark ? "border-ink-line text-on-ink-dim" : "border-line text-slate",
        ].join(" ")}
      >
        Example bids from participating lenders. Rates shown with APR. Assumes
        $450,000 loan amount, 75% LTV, 740+ credit band, 45-day lock.
      </p>
    </section>
  );
}
