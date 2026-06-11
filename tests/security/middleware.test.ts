import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("security: middleware route protection", () => {
  it("protects borrower app child routes", () => {
    const middleware = readFileSync("middleware.ts", "utf8");

    expect(middleware).toContain('isRouteSegment(pathname, "/app")');
    expect(middleware).not.toContain('"/app(.*)"');
  });

  it("does not protect public marketing lender routes by prefix accident", () => {
    const middleware = readFileSync("middleware.ts", "utf8");

    expect(middleware).toContain('isRouteSegment(pathname, "/lender")');
    expect(middleware).not.toContain('"/lender(.*)"');
    expect(middleware).toContain('isRouteSegment(pathname, "/app/lenders")');
  });

  it("does not let raw VIERATES_E2E bypass middleware in production", () => {
    const middleware = readFileSync("middleware.ts", "utf8");

    expect(middleware).toContain("e2eRuntimeAllowed()");
    expect(middleware).not.toMatch(
      /process\.env\.VIERATES_E2E\s*===\s*["']true["']\s*\?/,
    );
  });

  it("does not emit raw auth configuration JSON for protected pages", () => {
    const middleware = readFileSync("middleware.ts", "utf8");

    expect(middleware).toContain("NextResponse.redirect");
    expect(middleware).not.toContain("Authentication is not configured.");
  });
});
