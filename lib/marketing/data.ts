import type { FaqItem } from "@/components/faq-accordion";
import type { LedgerBid } from "@/components/live-bid-ledger";

export const SOFT_PULL_SENTENCE =
  "Checking your bids uses a soft inquiry and will not affect your credit score.";

export const homeFaqItems: FaqItem[] = [
  {
    question: "Will this hurt my credit?",
    answer:
      "No. Checking your bids uses a soft inquiry and will not affect your credit score. The lender you choose does their own full check later, as with any mortgage.",
  },
  {
    question: "Is VieRates a lender?",
    answer: "No. VieRates is a marketplace. Lenders make all credit decisions.",
  },
  {
    question: "Are the bids real?",
    answer:
      "Bids in the Bid Room are firm offers keyed to your verified profile, subject to appraisal and your information staying accurate. They are not teaser quotes.",
  },
  {
    question: "Who sees my information?",
    answer:
      "Lenders see a profile with no name or contact info. Only your chosen lender receives your identity at the Reveal, with your logged consent.",
  },
  {
    question: "What does it cost?",
    answer: "Nothing for borrowers, ever. Lenders pay flat marketplace fees.",
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
    rate: "5.875",
    apr: "6.012",
    points: 0.25,
    savings: "Current leading bid",
  },
  {
    id: "seed-2",
    lender: "Example bid 2",
    rate: "6.000",
    apr: "6.140",
    points: 0,
  },
  {
    id: "seed-1",
    lender: "Example bid 1",
    rate: "6.125",
    apr: "6.255",
    points: 0,
  },
];

export const exampleBidFeed = [
  { lender: "Example bid · TX", rate: "5.750", apr: "5.881", points: 0.5 },
  { lender: "Example bid · FL", rate: "5.990", apr: "6.121", points: 0 },
  { lender: "Example bid · AZ", rate: "5.825", apr: "5.961", points: 0.25 },
  { lender: "Example bid · CO", rate: "5.700", apr: "5.842", points: 0.75 },
];

export const bidIndexRows = [
  {
    creditBand: "740+",
    medianApr: "6.08%",
    bidCount: 42,
    spread: "0.41 pts",
    updated: "Weekly demo",
  },
  {
    creditBand: "700-739",
    medianApr: "6.32%",
    bidCount: 38,
    spread: "0.47 pts",
    updated: "Weekly demo",
  },
  {
    creditBand: "660-699",
    medianApr: "6.71%",
    bidCount: 24,
    spread: "0.62 pts",
    updated: "Weekly demo",
  },
];

export const greenDemoStates = ["CA", "CO", "FL", "IL", "TX"];
