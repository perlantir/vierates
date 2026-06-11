import type { FaqItem } from "@/components/faq-accordion";
import type { LedgerBid } from "@/components/live-bid-ledger";

export const SOFT_PULL_SENTENCE =
  "Opening your Bid Room uses a soft credit check, which does not affect your credit score. You're giving written permission for this check. Your name and contact details are never shared with any lender unless you choose them.";

export const homeFaqItems: FaqItem[] = [
  {
    question: "Is it really free?",
    answer:
      "Yes — borrowers never pay. Lenders pay flat fees to participate. We never take a cut of your loan.",
  },
  {
    question: "Will this hurt my credit?",
    answer:
      "No. Opening your Bid Room uses a soft inquiry, which doesn't affect your score. The lender you pick runs their normal credit check later, like any application.",
  },
  {
    question: "Who sees my information?",
    answer:
      "Lenders see your loan profile — credit band, loan size, county — never your name, phone, or street address. Your identity goes to one lender only: the one you choose.",
  },
  {
    question: "Are the bids real?",
    answer:
      "Every bid is a firm offer from a licensed, NMLS-verified lender, keyed to your verified profile, subject only to a standard appraisal. We compute every APR the same way so offers compare honestly. Lenders who don't honor bids lose access.",
  },
  {
    question: "What happens after I pick?",
    answer:
      "Your contact details and verified reports go to that one lender. They reach out, you proceed like any normal loan — just with a better deal and zero spam.",
  },
];

export const lenderFaqItems: FaqItem[] = [
  {
    question: "How does pricing work?",
    answer:
      "Lenders pay flat marketplace fees and bid credits. Fees are never tied to a funded loan.",
  },
  {
    question: "What do lenders see before spending a credit?",
    answer:
      "Coverage-matched lenders see a masked verified profile: credit band, income status, LTV band, product, purpose, occupancy, county, and bid count.",
  },
  {
    question: "How is consent recorded?",
    answer:
      "Every connection carries a timestamped consent record with the exact text shown, IP address, user agent, and a hash of the disclosure.",
  },
];

export const exampleBids: LedgerBid[] = [
  {
    id: "seed-3",
    lender: "Example bid 3",
    product: "30-year fixed",
    profile: "FICO 740+",
    rate: "5.88",
    apr: "6.01",
    points: 0.25,
    savings: "Current leading bid",
    time: "09:42",
  },
  {
    id: "seed-2",
    lender: "Example bid 2",
    product: "30-year fixed",
    profile: "FICO 720–739",
    rate: "6.00",
    apr: "6.14",
    points: 0,
    time: "09:37",
  },
  {
    id: "seed-1",
    lender: "Example bid 1",
    product: "30-year fixed",
    profile: "FICO 700–719",
    rate: "6.13",
    apr: "6.26",
    points: 0,
    time: "09:31",
  },
  {
    id: "seed-4",
    lender: "Example bid 4",
    product: "30-year fixed",
    profile: "FICO 760+",
    rate: "5.75",
    apr: "5.89",
    points: 0.5,
    time: "09:24",
  },
  {
    id: "seed-5",
    lender: "Example bid 5",
    product: "15-year fixed",
    profile: "FICO 740+",
    rate: "5.88",
    apr: "6.04",
    points: 0.25,
    time: "09:18",
  },
  {
    id: "seed-6",
    lender: "Example bid 6",
    product: "30-year fixed",
    profile: "FICO 700–719",
    rate: "6.25",
    apr: "6.42",
    points: 0,
    time: "09:12",
  },
];

export const exampleBidFeed = [
  {
    lender: "Example bid · TX",
    product: "30-year fixed",
    profile: "FICO 740+",
    rate: "5.75",
    apr: "5.88",
    points: 0.5,
  },
  {
    lender: "Example bid · FL",
    product: "30-year fixed",
    profile: "FICO 720–739",
    rate: "5.99",
    apr: "6.12",
    points: 0,
  },
  {
    lender: "Example bid · AZ",
    product: "30-year fixed",
    profile: "FICO 740+",
    rate: "5.83",
    apr: "5.96",
    points: 0.25,
  },
  {
    lender: "Example bid · CO",
    product: "30-year fixed",
    profile: "FICO 760+",
    rate: "5.70",
    apr: "5.84",
    points: 0.75,
  },
];

export const bidIndexRows = [
  {
    creditBand: "740+",
    medianApr: "6.08%",
    bidCount: 42,
    spread: "0.41 pts",
    updated: "June 11, 2026",
  },
  {
    creditBand: "700-739",
    medianApr: "6.32%",
    bidCount: 38,
    spread: "0.47 pts",
    updated: "June 11, 2026",
  },
  {
    creditBand: "660-699",
    medianApr: "6.71%",
    bidCount: 24,
    spread: "0.62 pts",
    updated: "June 11, 2026",
  },
];

export const greenDemoStates = ["CA", "CO", "FL", "IL", "TX"];
