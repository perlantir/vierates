import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { demoRuntimeAllowed, e2eRuntimeAllowed } from "@/lib/runtime-mode";

type RateLimitWindow = `${number} ${"s" | "m" | "h" | "d"}`;

type RateLimitInput = {
  key: string;
  limit: number;
  prefix: string;
  window: RateLimitWindow;
};

type RateLimitResult = {
  limit: number;
  remaining: number;
  reset: number;
  success: boolean;
};

const demoBuckets = new Map<string, { count: number; reset: number }>();

export function createFixedWindowRateLimit(
  prefix: string,
  limit: number,
  window: RateLimitWindow,
) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return undefined;
  }

  const redis = new Redis({
    url,
    token,
  });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(limit, window),
    prefix,
    analytics: true,
  });
}

export async function checkFixedWindowRateLimit(
  input: RateLimitInput,
): Promise<RateLimitResult> {
  if (isLocalRateLimitRuntime()) {
    return checkDemoFixedWindowRateLimit(input);
  }

  const limiter = createFixedWindowRateLimit(
    input.prefix,
    input.limit,
    input.window,
  );

  if (!limiter) {
    return checkDemoFixedWindowRateLimit(input);
  }

  const result = await limiter.limit(input.key);

  return {
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    success: result.success,
  };
}

export function resetDemoRateLimits() {
  demoBuckets.clear();
}

function checkDemoFixedWindowRateLimit(input: RateLimitInput): RateLimitResult {
  const now = Date.now();
  const durationMs = parseWindowMs(input.window);
  const bucketKey = `${input.prefix}:${input.key}:${Math.floor(
    now / durationMs,
  )}`;
  const current = demoBuckets.get(bucketKey);
  const bucket =
    current && current.reset > now
      ? current
      : { count: 0, reset: now + durationMs };

  bucket.count += 1;
  demoBuckets.set(bucketKey, bucket);

  return {
    limit: input.limit,
    remaining: Math.max(input.limit - bucket.count, 0),
    reset: bucket.reset,
    success: bucket.count <= input.limit,
  };
}

function isLocalRateLimitRuntime(): boolean {
  return (
    demoRuntimeAllowed() ||
    e2eRuntimeAllowed() ||
    process.env.NODE_ENV === "test"
  );
}

function parseWindowMs(window: RateLimitWindow): number {
  const [value, unit] = window.split(" ") as [
    `${number}`,
    "s" | "m" | "h" | "d",
  ];
  const amount = Number(value);
  const multiplier = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    s: 1000,
  }[unit];

  return amount * multiplier;
}
