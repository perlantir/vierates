# VieRates Security Audit - 2026-06-10

## Result

**NO-GO for real borrower PII in production.** Automated red-team tests are green after fixes, but the launch gate is not complete until field-level encryption is implemented/verified and an external human penetration test passes.

Reminder: an external human penetration test ($5-15k) is the final gate; no real borrower PII in production until it passes.

## Crown Jewels

| Jewel                | Status                                                     | Evidence                                                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Anonymity         | PROVEN by automated tests, with launch caveat              | `tests/security/anonymity.fuzz.test.ts`, `tests/lender-board-masking.test.ts`; DAL grep found identity access only in borrower-context flows, seed/migrations, logger redaction, and deletion. |
| B. Ledger integrity  | PROVEN by automated tests                                  | `tests/security/ledger.integrity.test.ts`, `tests/billing.test.ts`, `tests/auction-service.test.ts`; insufficient wallet bids now reject.                                                      |
| C. Consent integrity | PROVEN by automated tests                                  | `tests/security/consent.test.ts`, Prompt 3 full-flow e2e; immutable update/delete grep is green.                                                                                               |
| D. Authorization     | PROVEN for implemented matrix, partial for production auth | `tests/security/authz.matrix.test.ts`; fixed lender/admin API auth fallbacks. Clerk session expiry/revocation still needs provider-level integration testing.                                  |

## Findings

### Critical/High Review Follow-Up - Fixed - OTP, Authz, Billing, and Core Flow

- C0 hardcoded OTP: confirmed issue. OTP challenges now hash a per-challenge random six-digit code; demo responses return the generated code only for demo/e2e use. The former static `123456` code is rejected by regression tests.
- C1 `/app/*` route matcher: confirmed issue. Middleware now protects `/app(.*)`.
- C2 demo borrower/lender impersonation in production: confirmed issue. `loadEnv` forbids `DEMO_MODE=true` in production, and borrower/lender demo auth fallbacks also hard-check non-production runtime.
- C3/H6 fake Stripe signature and raw body order: confirmed issue. Stripe webhook now reads `request.text()` and verifies with `stripe.webhooks.constructEvent`.
- C4 OTP rate-limit bypass: confirmed issue. OTP start attempts are rate-limited per normalized phone, not caller-supplied IP.
- C5/H1 wallet debit race: confirmed issue. Bid debit is atomic/conditional and covered by a concurrent-bid regression test.
- H1 missing pick endpoint: confirmed issue. Added `POST /api/borrower/auctions/[auctionId]/pick`.
- H2-H5 bid write-path issues: confirmed issues. `submitBid` requires approved orgs, charges BID + SURCHARGE ledger rows, attributes to the authenticated LO, and the portal uses stable `initial`/`improve` idempotency keys.
- M1-M4: confirmed issues. Env validation rejects placeholder-like secrets, APR fee rows carry finance-charge classification, bid/webhook rate limiting is wired, and fake TrustedForm cert URLs are no longer accepted from the client route.
- Retest: `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`.

### High - Fixed - Lender API demo fallback outside e2e

- File: `lib/lender/current.ts`
- Reproduction: Without a Clerk session, lender APIs could resolve to the first approved org.
- Fix: Demo fallback is now limited to `DEMO_MODE=true`; non-demo resolves lender org through Clerk-backed `LenderUser`.
- Retest: `pnpm test`, `pnpm typecheck`.

### High - Fixed - Admin mutation APIs missing server-side admin check

- Files: `app/api/admin/*`
- Reproduction: API routes under `/api/admin` are not protected by `/admin` page middleware.
- Fix: Added `lib/admin/current.ts`; admin mutation routes now require server-derived ADMIN role, with e2e-only bypass.
- Retest: `tests/security/authz.matrix.test.ts`, `tests/e2e/prompt4-admin.spec.ts`.

### High - Fixed - Bid debit allowed negative wallet

- File: `lib/services/auction/index.ts`
- Reproduction: `submitBid` debited without checking wallet balance.
- Fix: Added `INSUFFICIENT_CREDITS` guard before credit transaction creation.
- Retest: `tests/security/ledger.integrity.test.ts`.

### Medium - Open - Field-level encryption not implemented

- Files: `prisma/schema.prisma`, `lib/borrower/wizard.ts`
- Reproduction: `BorrowerIdentity` fields are stored as plaintext in local Postgres.
- Minimal fix proposed: add application-level encryption for name/email/phone using envelope keys, with deterministic lookup token for phone velocity checks.
- Launch impact: NO-GO until implemented and restore/export/delete flows are retested.

### Medium - Open - Sparse-market re-identification risk

- Files: `lib/dal/listings.ts`, `lib/lender/portal.ts`
- Reproduction: county + loan amount + banded credit/DTI may be unique in low-volume counties.
- Minimal fix proposed: coarsen county to region and loan amount to wider bands until k-anonymity threshold is met.

### Low - Open - Dependency audit has one moderate finding

- Command: `pnpm audit --audit-level high`
- Result: no high/critical findings; one moderate remains.
- Minimal fix proposed: review advisory and upgrade when compatible.

## Required Test Suites

All required suites are committed under `tests/security/` and picked up by `pnpm test` in CI:

- `anonymity.fuzz.test.ts`
- `authz.matrix.test.ts`
- `ledger.integrity.test.ts`
- `consent.test.ts`
- `compliance.copy.test.ts`
- `input.fuzz.test.ts`

Additional security coverage:

- `infra.headers.test.ts`
- `billing.test.ts`
- `reputation.test.ts`
- `lender-board-masking.test.ts`
- `middleware.test.ts`
- `rate-limit.test.ts`

## Commands Run

- `pnpm format`
- `pnpm lint`
- `pnpm typecheck`
- `DATABASE_URL=postgresql://vierates:vierates@localhost:54329/vierates?schema=public pnpm test`
- `DATABASE_URL=postgresql://vierates:vierates@localhost:54329/vierates?schema=public pnpm build`
- `DATABASE_URL=postgresql://vierates:vierates@localhost:54329/vierates?schema=public pnpm test:e2e`
- `pnpm audit --audit-level high`
- Secret regex scan with `rg`
- Targeted review grep for hardcoded OTP, fake Stripe signature, timestamp idempotency keys, fake TrustedForm URLs, and unguarded lender-user lookup

## Launch Gate

- Anonymity fuzz: PASS
- Authz matrix: PASS for implemented app roles/resources
- Ledger integrity: PASS
- OTP randomization + phone rate limit: PASS
- Borrower auction pick endpoint: PASS
- Consent + compliance copy: PASS
- Headers/rate-limit/redaction/secret scan/dependency high-critical: PASS, with one moderate dependency finding
- Field-level encryption: FAIL
- External human penetration test: NOT RUN

**Final statement: NO-GO for production launch with real borrower PII until open Medium launch blockers are closed and external pen test passes.**
