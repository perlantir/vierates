import * as Sentry from "@sentry/nextjs";

let sentryInitialized = false;

export function initSentry() {
  if (sentryInitialized) {
    return;
  }

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return;
  }

  const demoMode = process.env.DEMO_MODE === "true";
  if (
    demoMode &&
    (process.env.NODE_ENV === "production" ||
      process.env.VERCEL_ENV === "production")
  ) {
    throw new Error("DEMO_MODE cannot be true in production.");
  }

  Sentry.init({
    dsn,
    tracesSampleRate: demoMode ? 1.0 : 0.1,
    sendDefaultPii: false,
  });

  sentryInitialized = true;
}
