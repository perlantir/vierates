# VieRates Production Audit Remediation - 2026-06-11

## Scope

This note closes the 62-item production audit register for the current repo
state. The conversion spec and brand kit are the controlling product sources.

## Code-Owned Remediation

| Area                     | Status        | Evidence                                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public-route failures    | Fixed         | Marketing routes render without Clerk configuration. Protected app routes fail closed without raw JSON visitor errors.                                                                                                                                                                                                                                |
| SEO and sharing          | Fixed         | Favicon, app icons, manifest, robots, sitemap, canonical metadata, per-page titles/descriptions, Open Graph image, Twitter metadata, FAQ JSON-LD, and Organization JSON-LD are present.                                                                                                                                                               |
| Trust/legal copy         | Fixed         | Counsel draft labels, schema jargon, NMLS placeholder, duplicated footer wording, demo-development language, fake countdown, false precision rates, missing as-of dates, and flat legal pages were remediated. Legal pages include last-updated dates.                                                                                                |
| Conversion mechanics     | Fixed         | Homepage market-context band, waitlist links/capture, state select, visible labels, reassurance copy, Bid Index capture/archive route, wizard progress framing, one-gold-CTA treatment, unified button focus/tap targets, how-it-works miniatures, and lender application content are implemented.                                                    |
| Accessibility/mobile     | Fixed         | Skip link, branded 404, mobile menu, focus-visible coverage, 44px controls, anchor scroll margin, ledger semantics, non-overlapping responsive text, and deterministic e2e smoke coverage are in place.                                                                                                                                               |
| Design tokens/assets     | Fixed         | Real logo/favicon assets, OG card, token palette cleanup, paper texture, varied redaction bars, theme color, and branded email template objects are implemented.                                                                                                                                                                                      |
| Security headers/CI      | Fixed         | CSP no longer carries stale Segment, `unsafe-eval`, or script `unsafe-inline` in production. Middleware emits a per-request nonce and `strict-dynamic`; inline JSON-LD carries the same nonce. CI now runs on pull requests and `main` pushes with gitleaks, typecheck, lint, security tests, unit tests, build, restore drill, and Playwright smoke. |
| Analytics and monitoring | Fixed in code | A shared conversion taxonomy now gates the analytics API and emits all §11 events from borrower, lender, ledger, and pageview flows. Funnel metadata is allowlisted to block contact PII. Sentry server and browser initialization hooks are present, and env validation accepts `NEXT_PUBLIC_SENTRY_DSN`.                                            |
| Font payload             | Fixed         | The site uses the current conversion spec's Plex stack through three local Latin WOFF2 files totaling 48K. Only Plex Sans and Plex Serif are preloaded above the fold; fresh build emits zero Next-generated font media files.                                                                                                                        |

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

## Item-by-Item Production Audit Disposition

| #   | Status                | Evidence                                                                                                                                          |
| --- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Fixed                 | `/lenders` returns HTML locally and live; marketing routes do not require Clerk config.                                                           |
| 2   | Fixed                 | `/app/lenders` is explicitly public in middleware and returns HTML instead of raw JSON.                                                           |
| 3   | Fixed in code         | `lib/analytics/events.ts`, `components/client-telemetry.tsx`, and Sentry instrumentation are wired; production env values still need to be added. |
| 4   | Fixed                 | `/favicon.ico`, `/assets/favicon.svg`, `/apple-touch-icon.svg`, and `/manifest.webmanifest` exist.                                                |
| 5   | Fixed                 | `app/robots.ts` and `app/sitemap.ts` build and return 200.                                                                                        |
| 6   | Fixed                 | Root metadata includes Open Graph and Twitter cards plus `/opengraph-image`.                                                                      |
| 7   | Fixed                 | Page-level metadata uses `pageMetadata()` with distinct titles/descriptions.                                                                      |
| 8   | External DNS open     | Vercel aliases include `vierates.com` and `www.vierates.com`; registrar DNS still does not resolve from verification host.                        |
| 9   | Fixed                 | Footer no longer displays an `NMLS #[STAT]` placeholder.                                                                                          |
| 10  | Fixed                 | Legal template/page copy no longer renders `Counsel draft slot`.                                                                                  |
| 11  | Fixed, counsel review | Privacy copy is consumer-facing and updated for first-party analytics; counsel approval remains required.                                         |
| 12  | Fixed                 | Consumer pages use plain-language identity/reveal language; schema jargon only appears in internal docs/tests/code.                               |
| 13  | Fixed                 | Public copy says "Illustrative data" and avoids development/local-deployment language.                                                            |
| 14  | Fixed                 | Homepage ledger uses static `48-hour window`, not a ticking fake countdown.                                                                       |
| 15  | Fixed                 | Example APRs render to two decimals.                                                                                                              |
| 16  | Fixed                 | Ledger and Bid Index carry as-of dates.                                                                                                           |
| 17  | Fixed                 | Bid Index chart maps APR min/median/max bands with axis labels.                                                                                   |
| 18  | Partially fixed       | `/about` now has origin story and contact details; founder name/photo/bio need approved user-provided assets/facts.                               |
| 19  | Fixed                 | `/trust` includes principles, consent-ledger explanation, vendor-handled verification, encryption/redaction, and pentest posture.                 |
| 20  | Fixed                 | `app/not-found.tsx` is branded with navigation and recovery CTAs.                                                                                 |
| 21  | Fixed                 | Footer no longer repeats `NMLS Consumer Access` in one sentence and link label.                                                                   |
| 22  | Counsel approval open | Privacy posture states first-party/no-sale/no-ad-cookie analytics; final cookie/consent position requires counsel.                                |
| 23  | Fixed                 | Middleware emits nonce-based script CSP, no script `unsafe-inline`, no production `unsafe-eval`, and no Segment allow-list.                       |
| 24  | Fixed                 | Homepage ledger has six desktop rows and four mobile rows.                                                                                        |
| 25  | Fixed                 | Demo chart aria labels describe illustrative display, not a real market trend claim.                                                              |
| 26  | Fixed                 | Homepage includes `MarketContextBand` with as-of date.                                                                                            |
| 27  | Fixed                 | Waitlist is linked from homepage and footer.                                                                                                      |
| 28  | Fixed                 | Waitlist form collects state.                                                                                                                     |
| 29  | Fixed                 | Waitlist email and state labels are visible.                                                                                                      |
| 30  | Fixed                 | Waitlist has adjacent reassurance microcopy.                                                                                                      |
| 31  | Fixed                 | Homepage emits FAQPage JSON-LD; root emits Organization JSON-LD.                                                                                  |
| 32  | Fixed                 | Root and page metadata include canonical alternates.                                                                                              |
| 33  | Fixed                 | `/bid-index/2026-w24` exists and `/bid-index` includes capture form.                                                                              |
| 34  | Fixed                 | Wizard shell says "About 60 seconds" and does not show `1 / 12`.                                                                                  |
| 35  | Fixed                 | Nav CTA switches to secondary while home hero is visible.                                                                                         |
| 36  | Fixed                 | Nav CTAs use the shared `Button` component.                                                                                                       |
| 37  | Fixed                 | Button `sm` size is 44px minimum height.                                                                                                          |
| 38  | Fixed                 | Homepage How it works cards include product miniatures.                                                                                           |
| 39  | Fixed                 | `/lenders` restores the founding lender page with math module, form, consent, and flat-fee FAQ.                                                   |
| 40  | Fixed                 | Fresh build reports home first-load JS at 108 kB.                                                                                                 |
| 41  | Fixed                 | Three local Latin WOFF2 files total 48K; only two are preloaded; fresh `.next/static/media` font count is 0.                                      |
| 42  | Fixed                 | Global skip-to-content link exists.                                                                                                               |
| 43  | Fixed                 | Live ledger uses `aria-live` only when live updates are enabled.                                                                                  |
| 44  | Fixed                 | Shared buttons and custom nav/wizard/table controls now have visible focus treatment.                                                             |
| 45  | Fixed                 | Ledger title is a `div` inside an aria-labeled region, not a stray `h2`.                                                                          |
| 46  | Fixed                 | `bg-paper` maps to `--paper`; legacy token aliases are linted out of app/component/lib sources.                                                   |
| 47  | Fixed                 | Token lint rejects default gray utility usage and legacy aliases.                                                                                 |
| 48  | Fixed                 | Redaction bars vary by width in marketing/product miniatures.                                                                                     |
| 49  | Fixed                 | `viewport.themeColor` is set to brand ink.                                                                                                        |
| 50  | Fixed                 | App copy consistently uses "Bid index" casing.                                                                                                    |
| 51  | Fixed                 | CTA label remains "Start my listing" across responsive nav states.                                                                                |
| 52  | Fixed                 | Footer grouping includes FAQ anchor with scroll margin.                                                                                           |
| 53  | Fixed                 | Waitlist success/error states render inline; success includes selected state.                                                                     |
| 54  | Fixed                 | Wizard back control has a 44px target and explicit focus ring.                                                                                    |
| 55  | Fixed                 | Two-doors copy uses "Connect — or open the Bid Room."                                                                                             |
| 56  | Fixed                 | Hero says "no score impact."                                                                                                                      |
| 57  | Fixed                 | Bid Index table updated column uses dates.                                                                                                        |
| 58  | Fixed                 | Ruled ledger texture points to `--paper`, not a legacy alias.                                                                                     |
| 59  | Fixed                 | Button disabled opacity is 60%, and text/background contrast remains readable.                                                                    |
| 60  | Fixed                 | FAQ and main anchors have scroll-margin compensation.                                                                                             |
| 61  | Fixed                 | Logo/favicon/OG/email motifs use the same bundled brand assets.                                                                                   |
| 62  | Fixed, counsel review | Legal pages have last-updated dates; counsel approval remains required before real borrower data.                                                 |

## Verification Run

Commands run against the current tree:

- `pnpm lint` - pass
- `pnpm typecheck` - pass
- `pnpm exec prettier --check .` - pass
- `pnpm test` - pass, 27 files / 115 tests
- `pnpm build` - pass, 44 generated routes, home first-load JS 108 kB
- `pnpm audit --audit-level high` - pass, no known vulnerabilities
- `CI=1 pnpm test:e2e` - pass, 13 Playwright smoke tests

Additional continuation verification:

- Local production route smoke across `/`, `/how-it-works`, `/lenders`,
  `/app/lenders`, `/bid-index`, `/bid-index/2026-w24`, `/trust`, `/about`,
  `/waitlist`, `/legal/*`, 404, and `/app/new` - pass, no console/CSP issues.
- CSP nonce verification - pass: every inline script had the policy nonce,
  script policy had no `unsafe-inline` and no `unsafe-eval`.
- Font payload check - pass: fresh build emitted zero `.next/static/media`
  font files; `public/fonts/*.woff2` totals 48K.

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
