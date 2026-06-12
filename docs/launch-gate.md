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
