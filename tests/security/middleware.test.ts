import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("security: middleware route protection", () => {
  it("protects borrower app child routes", () => {
    const middleware = readFileSync("middleware.ts", "utf8");

    expect(middleware).toContain('"/app(.*)"');
    expect(middleware).not.toContain('"/app",');
  });

  it("does not let raw VIERATES_E2E bypass middleware in production", () => {
    const middleware = readFileSync("middleware.ts", "utf8");

    expect(middleware).toContain("e2eRuntimeAllowed()");
    expect(middleware).not.toMatch(
      /process\.env\.VIERATES_E2E\s*===\s*["']true["']\s*\?/,
    );
  });
});
