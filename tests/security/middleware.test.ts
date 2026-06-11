import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("security: middleware route protection", () => {
  it("protects borrower app child routes", () => {
    const middleware = readFileSync("middleware.ts", "utf8");

    expect(middleware).toContain('"/app(.*)"');
    expect(middleware).not.toContain('"/app",');
  });
});
