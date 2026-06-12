import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { e2eRuntimeAllowed } from "@/lib/runtime-mode";

function e2eMiddleware(request: NextRequest) {
  const security = createSecurityContext(request);

  return applySecurityHeaders(
    NextResponse.next({
      request: {
        headers: security.requestHeaders,
      },
    }),
    security.csp,
  );
}

function publicOnlyMiddleware(request: NextRequest) {
  const security = createSecurityContext(request);

  if (isProtectedRoute(request) && !isPublicRoute(request)) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/", request.url), 307),
      security.csp,
    );
  }

  return applySecurityHeaders(
    NextResponse.next({
      request: {
        headers: security.requestHeaders,
      },
    }),
    security.csp,
  );
}

const middleware = e2eRuntimeAllowed()
  ? e2eMiddleware
  : clerkEnvConfigured()
    ? clerkMiddleware(async (auth, request) => {
        const security = createSecurityContext(request);

        if (isProtectedRoute(request) && !isPublicRoute(request)) {
          await auth.protect();
        }

        return applySecurityHeaders(
          NextResponse.next({
            request: {
              headers: security.requestHeaders,
            },
          }),
          security.csp,
        );
      })
    : publicOnlyMiddleware;

export default middleware;

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};

type SecurityContext = {
  csp: string;
  requestHeaders: Headers;
};

function createSecurityContext(request?: NextRequest): SecurityContext {
  const nonce = generateNonce();
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request?.headers);

  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  return { csp, requestHeaders };
}

function applySecurityHeaders(
  response: NextResponse,
  csp: string,
): NextResponse {
  response.headers.set("Content-Security-Policy", csp);
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

function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    scriptSrc(nonce),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "connect-src 'self' https://us.i.posthog.com https://*.clerk.accounts.dev https://*.ingest.sentry.io https://*.sentry.io",
    "frame-src 'self' https://*.array.io https://*.truv.com https://withpersona.com",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

function scriptSrc(nonce: string): string {
  return [
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
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

function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));

  return btoa(String.fromCharCode(...bytes));
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
