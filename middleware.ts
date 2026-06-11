import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { e2eRuntimeAllowed } from "@/lib/runtime-mode";

const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
  "/lender(.*)",
  "/admin(.*)",
]);

function e2eMiddleware() {
  return applySecurityHeaders(NextResponse.next());
}

function publicOnlyMiddleware(request: NextRequest) {
  if (isProtectedRoute(request)) {
    return applySecurityHeaders(
      NextResponse.json(
        { error: "Authentication is not configured." },
        { status: 503 },
      ),
    );
  }

  return applySecurityHeaders(NextResponse.next());
}

const middleware = e2eRuntimeAllowed()
  ? e2eMiddleware
  : clerkEnvConfigured()
    ? clerkMiddleware(async (auth, request) => {
        const response = NextResponse.next();

        if (isProtectedRoute(request)) {
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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.sentry-cdn.com https://us-assets.i.posthog.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "connect-src 'self' https://api.segment.io https://us.i.posthog.com https://*.clerk.accounts.dev",
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

function clerkEnvConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY,
  );
}
