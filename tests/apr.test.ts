import { describe, expect, it } from "vitest";

import { calculateAprBp, formatApr } from "../lib/apr";

describe("APR engine", () => {
  it("keeps note rate and APR equal when there are no finance charges", () => {
    expect(
      calculateAprBp({
        financeChargeFees: [],
        loanAmount: 400000,
        noteRateBp: 600,
        points: 0,
        termMonths: 360,
      }),
    ).toBe(600);
  });

  it("matches a golden fixed-rate example with points and fees", () => {
    expect(
      calculateAprBp({
        financeChargeFees: [995, 650],
        loanAmount: 400000,
        noteRateBp: 600,
        points: 0.5,
        termMonths: 360,
      }),
    ).toBe(609);
  });

  it("formats APR for compliant display", () => {
    expect(formatApr(609)).toBe("6.090%");
  });
});
