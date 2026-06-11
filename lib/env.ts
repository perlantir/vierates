import { z } from "zod";

const nonPlaceholder = z
  .string()
  .min(1)
  .refine((value) => !value.includes("replace_me"), {
    message: "must not be a placeholder",
  });

const prefixedSecret = (prefix: string) =>
  nonPlaceholder.refine((value) => value.startsWith(prefix), {
    message: `must start with ${prefix}`,
  });

const envSchema = z.object({
  ARRAY_API_KEY: nonPlaceholder,
  ATTOM_KEY: nonPlaceholder,
  CLERK_SECRET_KEY: prefixedSecret("sk_"),
  CLERK_WEBHOOK_SECRET: prefixedSecret("whsec_"),
  DATABASE_URL: z.string().url(),
  DEMO_MODE: z.enum(["true", "false"]).transform((value) => value === "true"),
  INNGEST_EVENT_KEY: nonPlaceholder,
  INNGEST_SIGNING_KEY: nonPlaceholder,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: prefixedSecret("pk_"),
  PERSONA_API_KEY: nonPlaceholder,
  POSTHOG_KEY: prefixedSecret("phc_"),
  PUSHER_APP_ID: nonPlaceholder,
  PUSHER_CLUSTER: nonPlaceholder,
  PUSHER_KEY: nonPlaceholder,
  PUSHER_SECRET: nonPlaceholder,
  SENTRY_DSN: z.string().url(),
  STRIPE_SECRET_KEY: prefixedSecret("sk_"),
  STRIPE_WEBHOOK_SECRET: prefixedSecret("whsec_"),
  TRUV_CLIENT_ID: nonPlaceholder,
  TRUV_SECRET: nonPlaceholder,
  TWILIO_ACCOUNT_SID: nonPlaceholder.regex(/^AC[A-Za-z0-9]{8,}$/),
  TWILIO_AUTH_TOKEN: nonPlaceholder,
  TWILIO_VERIFY_SERVICE_SID: nonPlaceholder.regex(/^VA[A-Za-z0-9]{8,}$/),
  UPSTASH_REDIS_REST_TOKEN: nonPlaceholder,
  UPSTASH_REDIS_REST_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | undefined;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => issue.path.join("."));
    throw new Error(
      `Missing or invalid environment variables: ${missing.join(", ")}`,
    );
  }

  if (
    parsed.data.DEMO_MODE &&
    (source.NODE_ENV === "production" || source.VERCEL_ENV === "production")
  ) {
    throw new Error("DEMO_MODE cannot be true in production.");
  }

  return parsed.data;
}

export function getEnv(): Env {
  cachedEnv ??= loadEnv();
  return cachedEnv;
}
