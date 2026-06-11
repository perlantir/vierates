import { defineConfig, devices } from "@playwright/test";

const e2eEnv = {
  ...process.env,
  VIERATES_E2E: "true",
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://vierates:vierates@localhost:54329/vierates?schema=public",
  BORROWER_IDENTITY_KEY:
    process.env.BORROWER_IDENTITY_KEY ??
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "pk_test_vierates_e2e",
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ?? "sk_test_vierates_e2e",
  CLERK_WEBHOOK_SECRET:
    process.env.CLERK_WEBHOOK_SECRET ?? "whsec_vierates_e2e",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "sk_test_vierates_e2e",
  STRIPE_WEBHOOK_SECRET:
    process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_vierates_e2e",
  TWILIO_ACCOUNT_SID:
    process.env.TWILIO_ACCOUNT_SID ?? "AC00000000000000000000000000000000",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? "twilio_e2e_auth_token",
  TWILIO_VERIFY_SERVICE_SID:
    process.env.TWILIO_VERIFY_SERVICE_SID ??
    "VA00000000000000000000000000000000",
  PUSHER_APP_ID: process.env.PUSHER_APP_ID ?? "pusher_e2e_app",
  PUSHER_KEY: process.env.PUSHER_KEY ?? "pusher_e2e_key",
  PUSHER_SECRET: process.env.PUSHER_SECRET ?? "pusher_e2e_secret",
  PUSHER_CLUSTER: process.env.PUSHER_CLUSTER ?? "us2",
  INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY ?? "inngest_e2e_event_key",
  INNGEST_SIGNING_KEY:
    process.env.INNGEST_SIGNING_KEY ?? "inngest_e2e_signing_key",
  ARRAY_API_KEY: process.env.ARRAY_API_KEY ?? "array_e2e_key",
  TRUV_CLIENT_ID: process.env.TRUV_CLIENT_ID ?? "truv_e2e_client",
  TRUV_SECRET: process.env.TRUV_SECRET ?? "truv_e2e_secret",
  PERSONA_API_KEY: process.env.PERSONA_API_KEY ?? "persona_e2e_key",
  ATTOM_KEY: process.env.ATTOM_KEY ?? "attom_e2e_key",
  SENTRY_DSN: process.env.SENTRY_DSN ?? "https://e2e@sentry.example/1",
  POSTHOG_KEY: process.env.POSTHOG_KEY ?? "phc_vierates_e2e",
  UPSTASH_REDIS_REST_URL:
    process.env.UPSTASH_REDIS_REST_URL ?? "https://vierates-e2e.upstash.io",
  UPSTASH_REDIS_REST_TOKEN:
    process.env.UPSTASH_REDIS_REST_TOKEN ?? "upstash_e2e_token",
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
