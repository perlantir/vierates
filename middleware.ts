import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { e2eRuntimeAllowed } from "@/lib/runtime-mode";

function e2eMiddleware() {
  return applySecurityHeaders(NextResponse.next());
}

function publicOnlyMiddleware(request: NextRequest) {
  if (isProtectedRoute(request) && !isPublicRoute(request)) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/", request.url), 307),
    );
  }

  return applySecurityHeaders(NextResponse.next());
}

const middleware = e2eRuntimeAllowed()
  ? e2eMiddleware
  : clerkEnvConfigured()
    ? clerkMiddleware(async (auth, request) => {
        const response = NextResponse.next();

        if (isProtectedRoute(request) && !isPublicRoute(request)) {
          await auth.protect();
        }

        return applySecurityHeaders(response);
      })
    : publicOnlyMiddleware;

export default middleware;

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      scriptSrc(),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "connect-src 'self' https://us.i.posthog.com https://*.clerk.accounts.dev https://*.ingest.sentry.io https://*.sentry.io",
      "frame-src 'self' https://*.array.io https://*.truv.com https://withpersona.com",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  return response;
}

function scriptSrc(): string {
  return [
    "script-src 'self' 'unsafe-inline'",
    process.env.NODE_ENV === "production" ? undefined : "'unsafe-eval'",
    "https://js.sentry-cdn.com",
  ]
    .filter(Boolean)
    .join(" ");
}

function clerkEnvConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY,
  );
}

function isProtectedRoute(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;

  return (
    isRouteSegment(pathname, "/app") ||
    isRouteSegment(pathname, "/lender") ||
    isRouteSegment(pathname, "/admin")
  );
}

function isPublicRoute(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;

  return (
    isRouteSegment(pathname, "/app/new") ||
    isRouteSegment(pathname, "/app/lenders")
  );
}

function isRouteSegment(pathname: string, segment: string): boolean {
  return pathname === segment || pathname.startsWith(`${segment}/`);
}
