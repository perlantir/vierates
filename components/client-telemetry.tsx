"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const sessionKey = "vierates:analytics-session";

export function ClientTelemetry() {
  const pathname = usePathname();

  useEffect(() => {
    const sessionId = getSessionId();

    void fetch("/api/analytics/funnel", {
      body: JSON.stringify({
        event: "page_view",
        metadata: {
          path: pathname,
          surface: surfaceForPath(pathname),
        },
        sessionId,
        step: pathname,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}

function getSessionId() {
  const existing = sessionStorage.getItem(sessionKey);

  if (existing) {
    return existing;
  }

  const sessionId = crypto.randomUUID();
  sessionStorage.setItem(sessionKey, sessionId);

  return sessionId;
}

function surfaceForPath(pathname: string) {
  if (pathname.startsWith("/app")) {
    return "borrower";
  }

  if (pathname.startsWith("/lender")) {
    return "lender";
  }

  if (pathname.startsWith("/admin")) {
    return "admin";
  }

  return "marketing";
}
