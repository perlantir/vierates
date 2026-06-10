import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
  "/lender(.*)",
  "/admin(.*)",
]);

function e2eMiddleware() {
  return NextResponse.next();
}

const middleware =
  process.env.VIERATES_E2E === "true"
    ? e2eMiddleware
    : clerkMiddleware(async (auth, request) => {
        if (isProtectedRoute(request)) {
          await auth.protect();
        }
      });

export default middleware;

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
