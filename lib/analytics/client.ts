"use client";

import type { FunnelEventName } from "@/lib/analytics/events";

const sessionKey = "vierates:analytics-session";

export function getAnalyticsSessionId() {
  const existing = sessionStorage.getItem(sessionKey);

  if (existing) {
    return existing;
  }

  const sessionId = crypto.randomUUID();
  sessionStorage.setItem(sessionKey, sessionId);

  return sessionId;
}

export async function captureFunnelEvent(
  event: FunnelEventName,
  step: string,
  metadata: Record<string, string | number | boolean | undefined> = {},
  userId?: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  await fetch("/api/analytics/funnel", {
    body: JSON.stringify({
      event,
      metadata,
      sessionId: getAnalyticsSessionId(),
      step,
      userId,
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  }).catch(() => undefined);
}
