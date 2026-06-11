import { describe, expect, it } from "vitest";

import {
  checkFixedWindowRateLimit,
  resetDemoRateLimits,
} from "../../lib/rate-limit";
import { setValidTestEnv } from "../helpers/env";

describe("security: route rate limits", () => {
  it("returns blocked after the fixed window limit is exceeded", async () => {
    setValidTestEnv();
    resetDemoRateLimits();

    const input = {
      key: "org_rate_limit_test",
      limit: 2,
      prefix: "test:bids",
      window: "1 m",
    } as const;

    expect((await checkFixedWindowRateLimit(input)).success).toBe(true);
    expect((await checkFixedWindowRateLimit(input)).success).toBe(true);
    expect((await checkFixedWindowRateLimit(input)).success).toBe(false);
  });
});
