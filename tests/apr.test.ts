import { describe, expect, it } from "vitest";

import { calculateAprBp, formatApr } from "../lib/apr";

describe("APR engine", () => {
  it("keeps note rate and APR equal when there are no finance charges", () => {
    expect(
      calculateAprBp({
        fees: [],
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
        fees: [
          { amountCents: 99_500, financeCharge: true, label: "Origination" },
          { amountCents: 65_000, financeCharge: true, label: "Appraisal" },
        ],
        loanAmount: 400000,
        noteRateBp: 600,
        points: 0.5,
        termMonths: 360,
      }),
    ).toBe(609);
  });

  it("excludes non-finance fee rows from APR", () => {
    const mixed = calculateAprBp({
      fees: [
        { amountCents: 99_500, financeCharge: true, label: "Origination" },
        { amountCents: 65_000, financeCharge: false, label: "Appraisal" },
      ],
      loanAmount: 400000,
      noteRateBp: 600,
      points: 0.5,
      termMonths: 360,
    });
    const allFinance = calculateAprBp({
      fees: [
        { amountCents: 99_500, financeCharge: true, label: "Origination" },
        { amountCents: 65_000, financeCharge: true, label: "Appraisal" },
      ],
      loanAmount: 400000,
      noteRateBp: 600,
      points: 0.5,
      termMonths: 360,
    });

    expect(mixed).toBeLessThan(allFinance);
  });

  it("formats APR for compliant display", () => {
    expect(formatApr(609)).toBe("6.09%");
  });
});
