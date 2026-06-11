# VieRates Production Audit Remediation - 2026-06-11

## Scope

This note closes the 62-item production audit register for the current repo
state. The conversion spec and brand kit are the controlling product sources.

## Code-Owned Remediation

| Area                     | Status        | Evidence                                                                                                                                                                                                                                                                                                   |
| ------------------------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public-route failures    | Fixed         | Marketing routes render without Clerk configuration. Protected app routes fail closed without raw JSON visitor errors.                                                                                                                                                                                     |
| SEO and sharing          | Fixed         | Favicon, app icons, manifest, robots, sitemap, canonical metadata, per-page titles/descriptions, Open Graph image, Twitter metadata, FAQ JSON-LD, and Organization JSON-LD are present.                                                                                                                    |
| Trust/legal copy         | Fixed         | Counsel draft labels, schema jargon, NMLS placeholder, duplicated footer wording, demo-development language, fake countdown, false precision rates, missing as-of dates, and flat legal pages were remediated. Legal pages include last-updated dates.                                                     |
| Conversion mechanics     | Fixed         | Homepage market-context band, waitlist links/capture, state select, visible labels, reassurance copy, Bid Index capture/archive route, wizard progress framing, one-gold-CTA treatment, unified button focus/tap targets, how-it-works miniatures, and lender application content are implemented.         |
| Accessibility/mobile     | Fixed         | Skip link, branded 404, mobile menu, focus-visible coverage, 44px controls, anchor scroll margin, ledger semantics, non-overlapping responsive text, and deterministic e2e smoke coverage are in place.                                                                                                    |
| Design tokens/assets     | Fixed         | Real logo/favicon assets, OG card, token palette cleanup, paper texture, varied redaction bars, theme color, and branded email template objects are implemented.                                                                                                                                           |
| Security headers/CI      | Fixed         | CSP no longer carries stale Segment or `unsafe-eval`; CI now runs on pull requests and `main` pushes with gitleaks, typecheck, lint, security tests, unit tests, build, restore drill, and Playwright smoke.                                                                                               |
| Analytics and monitoring | Fixed in code | A shared conversion taxonomy now gates the analytics API and emits all §11 events from borrower, lender, ledger, and pageview flows. Funnel metadata is allowlisted to block contact PII. Sentry server and browser initialization hooks are present, and env validation accepts `NEXT_PUBLIC_SENTRY_DSN`. |

## Conversion Event Coverage

The shared taxonomy in `lib/analytics/events.ts` covers:

`page_view`, `wizard_started`, `wizard_step_viewed`,
`wizard_step_completed`, `wizard_abandoned`, `listing_published`,
`doors_viewed`, `door_selected`, `verify_started`, `verify_credit_done`,
`verify_income_done`, `masked_preview_confirmed`, `auction_scheduled`,
`first_bid_received`, `bidroom_opened`, `auction_closed`, `compare_viewed`,
`pick_confirmed`, `reveal_completed`, `pick_expired`,
`ratewatch_enabled`, `board_viewed`, `bid_composer_opened`, `bid_placed`,
`bid_improved`, `connection_purchased`, and `roi_viewed`.

`tests/analytics-events.test.ts` locks this list and the PII-safe metadata
allowlist.

## External Requirements Still Outside The Repo

These are not code defects, but they remain launch blockers for real borrower
data:

| Requirement             | Current state                                                                                                                             | Owner action                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Custom-domain DNS       | `vierates.com` and `www.vierates.com` are attached in Vercel, but DNS did not resolve during verification.                                | Point the domain records to Vercel and re-run live probes.                                                  |
| Production secrets      | Vercel env listing still lacked Clerk, PostHog, Sentry, Stripe, Twilio, Pusher, Array, Truv, Persona, ATTOM, Inngest, and Upstash values. | Add real production env vars before protected flows can operate live.                                       |
| Founder details         | `/about` has real positioning and contact copy, but no approved founder name/photo/bio asset was provided.                                | Supply approved founder identity/photo or explicitly choose a no-photo launch.                              |
| Legal/cookie posture    | Repo copy is cleaned and dated; analytics posture is first-party/no-sale/no-ad-cookie.                                                    | Counsel must approve final privacy, consent, licenses, terms, NMLS posture, and analytics-consent position. |
| Production backup proof | Repo has a restore drill and runbook.                                                                                                     | Record provider-level backup encryption and a production-equivalent restore drill.                          |
| External human pentest  | Automated app/security tests are green.                                                                                                   | Complete the external penetration test and fix all High/Critical findings before real borrower data.        |

## Verification Run

Commands run against the current tree:

- `pnpm lint` - pass
- `pnpm typecheck` - pass
- `pnpm exec prettier --check .` - pass
- `pnpm test` - pass, 27 files / 113 tests
- `pnpm build` - pass, 44 generated routes, home first-load JS 108 kB
- `pnpm audit --audit-level high` - pass, no known vulnerabilities
- `pnpm test:e2e` - pass, 13 Playwright smoke tests

Browser smoke:

- Desktop home loaded with the expected branded first viewport and no console warnings/errors.
- Privacy page rendered the updated first-party analytics/no-sale copy and no console warnings/errors.
- Header nav click to `/bid-index` succeeded and rendered the expected capture content.
- Mobile 390px menu opened with How it works, Bid index, For lenders, and Start my listing links.

## Launch Statement

Code-owned production-audit items are remediated and re-tested. The app remains
**NO-GO for real borrower data** until the external requirements above are
completed, especially production secrets, DNS, backup evidence, counsel approval,
and the external human penetration test.
