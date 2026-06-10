import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { FOOTER_DISCLOSURE } from "../components/footer-disclosures";

const forbiddenPatterns = [
  /\bguarantee(?:d)?\b/i,
  /\blowest\b/i,
  /\bbest rate\b/i,
  /\bpre-approved by vierates\b/i,
  /\binstant approval\b/i,
  /\brisk-free\b/i,
  /\bbeat any rate\b/i,
  /\bskip the bank\b/i,
  /\bleads\b/i,
];

const sourceRoots = ["app/(marketing)", "components", "lib/marketing"];

describe("marketing copy lint", () => {
  it("contains no forbidden phrases in rendered source copy", () => {
    const corpus = sourceRoots
      .flatMap((root) => collectFiles(root))
      .map((file) => ({
        file,
        text: readFileSync(file, "utf8"),
      }));

    for (const { file, text } of corpus) {
      for (const pattern of forbiddenPatterns) {
        expect
          .soft(text, `${file} should not match ${pattern}`)
          .not.toMatch(pattern);
      }
    }
  });

  it("keeps FooterDisclosures on marketing layout", () => {
    const layout = readFileSync("app/(marketing)/layout.tsx", "utf8");
    const listingEntry = readFileSync(
      "app/(borrower)/app/new/page.tsx",
      "utf8",
    );

    expect(FOOTER_DISCLOSURE).toContain("VieRates is a marketplace");
    expect(layout).toContain("<FooterDisclosures />");
    expect(listingEntry).toContain("<FooterDisclosures />");
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
