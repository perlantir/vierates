import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { getEnv } from "@/lib/env";

export function createFixedWindowRateLimit(
  prefix: string,
  limit: number,
  window: `${number} ${"s" | "m" | "h" | "d"}`,
) {
  const env = getEnv();
  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(limit, window),
    prefix,
    analytics: true,
  });
}
