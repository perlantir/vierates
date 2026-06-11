const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: 0,
      sendDefaultPii: false,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    });
  });
}
