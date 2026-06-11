"use client";

import { useMemo, useState } from "react";

type BidIndexRow = {
  bidCount: number;
  creditBand: string;
  medianApr: string;
  spread: string;
  updated: string;
};

export function BidIndexTable({ rows }: { rows: BidIndexRow[] }) {
  const [sortKey, setSortKey] = useState<keyof BidIndexRow>("creditBand");
  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) =>
        String(a[sortKey]).localeCompare(String(b[sortKey]), undefined, {
          numeric: true,
        }),
      ),
    [rows, sortKey],
  );

  return (
    <div className="overflow-x-auto rounded-ui border border-line bg-card">
      <table className="w-full min-w-[620px] border-collapse text-left text-sm">
        <thead className="bg-paper text-xs uppercase text-text-muted">
          <tr>
            {[
              ["creditBand", "Credit band"],
              ["medianApr", "Median bid APR"],
              ["bidCount", "Bid count"],
              ["spread", "APR spread"],
              ["updated", "Updated"],
            ].map(([key, label]) => (
              <th className="border-b border-line p-3" key={key}>
                <button
                  className="font-bold"
                  onClick={() => setSortKey(key as keyof BidIndexRow)}
                  type="button"
                >
                  {label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr
              className="border-b border-line last:border-b-0"
              key={row.creditBand}
            >
              <td className="p-3 font-semibold">{row.creditBand}</td>
              <td className="vr-data p-3 text-right">{row.medianApr}</td>
              <td className="vr-data p-3 text-right">{row.bidCount}</td>
              <td className="vr-data p-3 text-right">{row.spread}</td>
              <td className="p-3 text-text-muted">{row.updated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
