# VieRates Launch Gate

Run this before sending real borrower traffic or storing real borrower data:

```bash
pnpm launch:gate
```

The gate checks:

- production routes that previously failed (`/lenders`, `/app/lenders`, SEO
  files, legal/privacy);
- live security headers and nonce-based script CSP;
- font preload budget;
- public DNS for `vierates.com` and `www.vierates.com`;
- Vercel Production env variable names required for live auth, monitoring,
  payments, messaging, verification, jobs, and rate limiting.

The command intentionally exits non-zero while external launch blockers remain.
It does not print secret values; it only reads names from `vercel env ls`.

Useful overrides:

```bash
LAUNCH_GATE_BASE_URL=https://vierates.vercel.app pnpm launch:gate
LAUNCH_GATE_DOMAINS=vierates.com,www.vierates.com pnpm launch:gate
LAUNCH_GATE_VERCEL_SCOPE=nickmaksdigitals-projects pnpm launch:gate
```

Current expected NO-GO blockers before real borrower data:

- custom-domain DNS must resolve publicly;
- real Production env values must be present in Vercel;
- counsel must approve privacy, terms, consent, licenses, NMLS posture, and
  analytics/cookie posture;
- provider-level backup encryption and a production-equivalent restore drill
  must be recorded;
- an external human penetration test must be completed, with all
  High/Critical findings fixed.

## Current DNS Action

Vercel currently shows the domain as third-party DNS. Configure either Vercel
nameservers:

```text
ns1.vercel-dns.com
ns2.vercel-dns.com
```

or set the records Vercel requested during verification:

```text
A  vierates.com      76.76.21.21
A  www.vierates.com  76.76.21.21
```

After DNS propagates, run:

```bash
pnpm launch:gate
```

## Production Env Action

Add real Production values in Vercel. Do not commit values to the repo.

```bash
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
vercel env add CLERK_SECRET_KEY production
vercel env add CLERK_WEBHOOK_SECRET production
vercel env add POSTHOG_KEY production
vercel env add SENTRY_DSN production
vercel env add NEXT_PUBLIC_SENTRY_DSN production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add TWILIO_ACCOUNT_SID production
vercel env add TWILIO_AUTH_TOKEN production
vercel env add TWILIO_VERIFY_SERVICE_SID production
vercel env add PUSHER_APP_ID production
vercel env add PUSHER_KEY production
vercel env add PUSHER_SECRET production
vercel env add PUSHER_CLUSTER production
vercel env add ARRAY_API_KEY production
vercel env add TRUV_CLIENT_ID production
vercel env add TRUV_SECRET production
vercel env add PERSONA_API_KEY production
vercel env add ATTOM_KEY production
vercel env add INNGEST_EVENT_KEY production
vercel env add INNGEST_SIGNING_KEY production
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
```

Production `DEMO_MODE` must be set to `false`, and the app must be redeployed
after values are added.
