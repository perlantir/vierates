import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
  "/lender(.*)",
  "/admin(.*)",
]);

function e2eMiddleware() {
  return applySecurityHeaders(NextResponse.next());
}

const middleware =
  process.env.VIERATES_E2E === "true"
    ? e2eMiddleware
    : clerkMiddleware(async (auth, request) => {
        const response = NextResponse.next();

        if (isProtectedRoute(request)) {
          await auth.protect();
        }

        return applySecurityHeaders(response);
      });

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
