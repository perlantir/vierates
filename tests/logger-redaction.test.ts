import { describe, expect, it } from "vitest";

import { redactLogValue, redactText } from "../lib/logger";

describe("redaction logger", () => {
  it("redacts PII in plain strings", () => {
    const result = redactText(
      "Jane Borrower jane@example.com 312-555-0199 123 Main Street",
    );

    expect(result).not.toContain("Jane Borrower");
    expect(result).not.toContain("jane@example.com");
    expect(result).not.toContain("312-555-0199");
    expect(result).not.toContain("123 Main Street");
    expect(result).toContain("[REDACTED]");
  });

  it("redacts sensitive object fields recursively", () => {
    const result = redactLogValue({
      borrower: {
        firstName: "Jane",
        lastName: "Borrower",
        email: "jane@example.com",
        phone: "312-555-0199",
        address: "123 Main Street",
      },
      message: "Jane Borrower listed 123 Main Street",
    });

    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain("Jane");
    expect(serialized).not.toContain("Borrower");
    expect(serialized).not.toContain("jane@example.com");
    expect(serialized).not.toContain("312-555-0199");
    expect(serialized).not.toContain("123 Main Street");
  });
});
