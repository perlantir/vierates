import * as Sentry from "@sentry/nextjs";

import { getEnv } from "@/lib/env";

let sentryInitialized = false;

export function initSentry() {
  if (sentryInitialized) {
    return;
  }

  const env = getEnv();

  Sentry.init({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: env.DEMO_MODE ? 1.0 : 0.1,
    sendDefaultPii: false,
  });

  sentryInitialized = true;
}
