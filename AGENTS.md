# VieRates Engineering Rules (non-negotiable)
1. ANONYMITY INVARIANT: no lender-context code path may ever read borrower identity (name, email, phone, street address) before an IdentityGrant row exists for that lender org. Enforce in the data-access layer (/lib/dal), never only in UI.
2. CONSENT IS A RECORD: every consent moment writes an immutable ConsentRecord (sha256 of text shown, IP, user agent, timestamp). ConsentRecord and CreditTransaction have NO update/delete code paths.
3. MONEY/CREDITS ARE APPEND-ONLY LEDGERS: balances are derived; every change is a CreditTransaction with a unique idempotencyKey; debits happen in the same DB transaction as the action they pay for.
4. MANAGED AUTH ONLY (Clerk). Never hand-roll sessions, tokens, or password storage. Role is always derived server-side from Clerk — never trust a client-supplied role.
5. SENSITIVE FINANCIAL FLOWS run inside vendor-embedded widgets (Array credit, Truv income, Persona IDV). We orchestrate; credentials never touch our servers or logs.
6. COMPLIANCE BY COMPONENT: rates render only via <RateDisplay> (requires apr, asOfDate, assumptions or throws in dev); every layout includes <FooterDisclosures>; geo-gating middleware consults StateRule before any listing goes live.
7. NO REVENUE CONTINGENT ON A FUNDED LOAN, no basis points, no success fees — anywhere in billing code (RESPA firewall).
8. TypeScript strict, Zod on every API input, no `any`, no PII in logs (all log sinks pass redaction middleware: names/emails/phones/addresses → [REDACTED]).
9. Design tokens only: --ink #0E1626, --bone #F6F7F4, --paddle #F2A30F (bids + primary CTA ONLY), --slate #5A6478, --funded #177E63, --signal #C9303D. Fonts: Bricolage Grotesque (display), Inter (body), IBM Plex Mono tabular (ALL financial figures). No stock photography ever.
10. Street addresses are never persisted on Listing — property match runs, sets propertyMatchOk, address is discarded from marketplace-visible storage.
Stack: Next.js 15 App Router · TypeScript · Tailwind · Prisma + Postgres · Clerk · Upstash Redis · Inngest · Pusher · Stripe Billing · Twilio Verify/SMS · Resend · Sentry · PostHog · Vitest + Playwright. If /docs contains brand-kit.md, design-prompt.md, build-spec.md, or security-prompt.md, they are authoritative detail — read them when relevant.
