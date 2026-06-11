"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { captureFunnelEvent } from "@/lib/analytics/client";

export function ClientTelemetry() {
  const pathname = usePathname();

  useEffect(() => {
    void captureFunnelEvent("page_view", pathname, {
      path: pathname,
      surface: surfaceForPath(pathname),
    });
  }, [pathname]);

  return null;
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
