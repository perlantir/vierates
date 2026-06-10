import { defineConfig, devices } from "@playwright/test";

const e2eEnv = {
  ...process.env,
  VIERATES_E2E: "true",
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://vierates:vierates@localhost:54329/vierates?schema=public",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "pk_test_replace_me",
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ?? "sk_test_replace_me",
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET ?? "whsec_replace_me",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "sk_test_replace_me",
  STRIPE_WEBHOOK_SECRET:
    process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_replace_me",
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? "AC_replace_me",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? "replace_me",
  TWILIO_VERIFY_SERVICE_SID:
    process.env.TWILIO_VERIFY_SERVICE_SID ?? "VA_replace_me",
  PUSHER_APP_ID: process.env.PUSHER_APP_ID ?? "replace_me",
  PUSHER_KEY: process.env.PUSHER_KEY ?? "replace_me",
  PUSHER_SECRET: process.env.PUSHER_SECRET ?? "replace_me",
  PUSHER_CLUSTER: process.env.PUSHER_CLUSTER ?? "us2",
  INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY ?? "replace_me",
  INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY ?? "replace_me",
  ARRAY_API_KEY: process.env.ARRAY_API_KEY ?? "replace_me",
  TRUV_CLIENT_ID: process.env.TRUV_CLIENT_ID ?? "replace_me",
  TRUV_SECRET: process.env.TRUV_SECRET ?? "replace_me",
  PERSONA_API_KEY: process.env.PERSONA_API_KEY ?? "replace_me",
  ATTOM_KEY: process.env.ATTOM_KEY ?? "replace_me",
  SENTRY_DSN: process.env.SENTRY_DSN ?? "https://replace_me@sentry.example/1",
  POSTHOG_KEY: process.env.POSTHOG_KEY ?? "phc_replace_me",
  UPSTASH_REDIS_REST_URL:
    process.env.UPSTASH_REDIS_REST_URL ?? "https://replace_me.upstash.io",
  UPSTASH_REDIS_REST_TOKEN:
    process.env.UPSTASH_REDIS_REST_TOKEN ?? "replace_me",
  DEMO_MODE: process.env.DEMO_MODE ?? "true",
};

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:3107",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm exec next dev --port 3107",
    env: e2eEnv,
    url: "http://127.0.0.1:3107",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
