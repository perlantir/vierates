import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { FOOTER_DISCLOSURE } from "../../components/footer-disclosures";

const forbiddenPatterns = [
  /\bpre-approved\b/i,
  /\bpre-qualified\b/i,
  /\bguaranteed?\b/i,
  /\blowest rate\b/i,
  /\bbest loan\b/i,
  /\bapply now\b/i,
  /\bbest rate\b/i,
  /\binstant approval\b/i,
  /\bno risk\b/i,
  /\brisk-free\b/i,
  /\bbeat any rate\b/i,
  /\bskip the bank\b/i,
  /\bpartner offers\b/i,
  /\bwe.ll find you the best lender\b/i,
];

describe("security: compliance copy", () => {
  it("contains no forbidden borrower-facing phrases", () => {
    const corpus = ["app", "components", "lib/marketing"]
      .flatMap((root) => collectFiles(root))
      .map((file) => ({ file, text: readFileSync(file, "utf8") }));

    for (const { file, text } of corpus) {
      for (const pattern of forbiddenPatterns) {
        expect
          .soft(text, `${file} should not match ${pattern}`)
          .not.toMatch(pattern);
      }
    }
  });

  it("keeps footer disclosure wired to marketing and rate-bearing app pages", () => {
    expect(FOOTER_DISCLOSURE).toContain("VieRates is a marketplace");
    for (const file of [
      "app/(marketing)/layout.tsx",
      "app/(borrower)/app/verify/page.tsx",
    ]) {
      expect(readFileSync(file, "utf8")).toContain("<FooterDisclosures />");
    }
  });

  it("keeps lender pricing framed as flat marketplace participation", () => {
    const text = readFileSync("app/(marketing)/lenders/page.tsx", "utf8");

    expect(text).toContain("Flat pricing");
    expect(text).toContain("Never a success fee");
    expect(text).not.toMatch(/basis-point fee|basis point fee|bps fee/i);
  });

  it("routes rate-bearing UI through RateDisplay", () => {
    const rateFiles = [
      "components/bid-card.tsx",
      "components/borrower/bid-room.tsx",
      "components/borrower/verify/verification-flow.tsx",
    ];

    for (const file of rateFiles) {
      const text = readFileSync(file, "utf8");

      expect(text).not.toMatch(/\brate=["']\d/);

      if (file !== "components/borrower/verify/verification-flow.tsx") {
        expect(text).toContain("RateDisplay");
      }
    }

    const bidRoom = readFileSync("components/borrower/bid-room.tsx", "utf8");
    const auctionPage = readFileSync(
      "app/(borrower)/app/auction/[auctionId]/page.tsx",
      "utf8",
    );

    expect(bidRoom).toMatch(/<RateDisplay[\s\S]*apr={formatBp\(bid\.aprBp\)/);
    expect(bidRoom).toMatch(/<RateDisplay[\s\S]*rate={formatBp\(bid\.rateBp\)/);
    expect(bidRoom).toMatch(
      /<RateDisplay[\s\S]*asOfDate={formatDisplayDate\(bid\.asOfDate\)/,
    );
    expect(bidRoom).toMatch(
      /<RateDisplay[\s\S]*assumptions={bidAssumptions\(bid\)/,
    );
    expect(bidRoom).not.toMatch(/<Metric\s+label="Rate"/);
    expect(auctionPage).toContain("asOfDate: bid.createdAt.toISOString()");
  });
});

function collectFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      return collectFiles(path);
    }

    return /\.(tsx|ts)$/.test(path) ? [path] : [];
  });
}
