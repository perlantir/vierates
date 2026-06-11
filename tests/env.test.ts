import { describe, expect, it } from "vitest";

import { loadEnv } from "../lib/env";
import { setValidTestEnv } from "./helpers/env";

describe("environment validation", () => {
  it("forbids DEMO_MODE in production", () => {
    setValidTestEnv();

    expect(() =>
      loadEnv({
        ...process.env,
        DEMO_MODE: "true",
        NODE_ENV: "production",
      }),
    ).toThrow(/DEMO_MODE cannot be true in production/);
  });

  it("forbids VIERATES_E2E in production", () => {
    setValidTestEnv();

    expect(() =>
      loadEnv({
        ...process.env,
        DEMO_MODE: "false",
        NODE_ENV: "production",
        VIERATES_E2E: "true",
      }),
    ).toThrow(/VIERATES_E2E cannot be true in production/);
  });

  it("rejects placeholder Stripe secrets", () => {
    setValidTestEnv();

    expect(() =>
      loadEnv({
        ...process.env,
        STRIPE_SECRET_KEY: "sk_test_replace_me",
      }),
    ).toThrow(/STRIPE_SECRET_KEY/);
  });

  it("requires a strong borrower identity encryption key", () => {
    setValidTestEnv();

    expect(() =>
      loadEnv({
        ...process.env,
        BORROWER_IDENTITY_KEY: "too-short",
      }),
    ).toThrow(/BORROWER_IDENTITY_KEY/);
  });
});
