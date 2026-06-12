import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoots = ["app", "components", "lib"];
const sourceFiles = [
  ...sourceRoots.flatMap((root) => collectFiles(root)),
  "tailwind.config.ts",
  "app/globals.css",
];

const forbiddenTokenPatterns = [
  /\b(?:text|bg|border|ring|outline|from|via|to)-gray-\d{2,3}\b/,
  /\b(?:text|bg|border|ring|outline|from|via|to)-(?:bone|slate(?:-weak)?|funded(?:-tint)?|signal(?:-tint)?|ink-9[0]|ink-8[0])\b/,
  /--(?:bone|slate(?:-weak)?|funded(?:-tint)?|signal(?:-tint)?|ink-9[0]|ink-8[0])\b/,
];

describe("design token lint", () => {
  it("keeps source on VieRates tokens instead of default grays or legacy aliases", () => {
    const corpus = sourceFiles.map((file) => ({
      file,
      text: readFileSync(file, "utf8"),
    }));

    for (const { file, text } of corpus) {
      for (const pattern of forbiddenTokenPatterns) {
        expect
          .soft(text, `${file} should not match ${pattern}`)
          .not.toMatch(pattern);
      }
    }
  });

  it("keeps typography on the local Latin Plex font set", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    const globals = readFileSync("app/globals.css", "utf8");

    expect(layout).not.toContain("next/font");
    expect(layout.match(/rel="preload"/g)).toHaveLength(2);
    expect(globals.match(/@font-face/g)).toHaveLength(3);

    for (const file of [
      "public/fonts/ibm-plex-sans-latin-400.woff2",
      "public/fonts/ibm-plex-serif-latin-600.woff2",
      "public/fonts/ibm-plex-mono-latin-400.woff2",
    ]) {
      expect(statSync(file).size).toBeGreaterThan(5000);
    }
  });
});

function collectFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      return collectFiles(path);
    }

    return /\.(tsx|ts|css)$/.test(path) ? [path] : [];
  });
}
