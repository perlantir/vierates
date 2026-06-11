import BidIndexPage from "../page";

import { pageMetadata } from "@/lib/page-metadata";

export function generateStaticParams() {
  return [{ week: "2026-w24" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ week: string }>;
}) {
  const { week } = await params;

  return pageMetadata({
    description:
      "Archived illustrative VieRates weekly mortgage bid index by credit profile.",
    path: `/bid-index/${week}`,
    title: `Bid index ${week.toUpperCase()}`,
  });
}

export default BidIndexPage;
