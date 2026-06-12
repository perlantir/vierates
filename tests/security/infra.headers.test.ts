import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("security: infra headers", () => {
  it("sets launch-gate security headers in middleware", () => {
    const middleware = readFileSync("middleware.ts", "utf8");

    for (const header of [
      "Content-Security-Policy",
      "Strict-Transport-Security",
      "X-Content-Type-Options",
      "X-Frame-Options",
      "Referrer-Policy",
      "Permissions-Policy",
    ]) {
      expect(middleware).toContain(header);
    }
  });

  it("uses a nonce-based script policy without stale vendors", () => {
    const middleware = readFileSync("middleware.ts", "utf8");

    expect(middleware).toContain("x-nonce");
    expect(middleware).toContain("'strict-dynamic'");
    expect(middleware).toContain("`script-src 'self' 'nonce-${nonce}'");
    expect(middleware).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(middleware).not.toContain("api.segment.io");
  });
});
