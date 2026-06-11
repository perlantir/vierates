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

## Commands Run

- `pnpm format`
- `pnpm lint`
- `pnpm typecheck`
- `DATABASE_URL=postgresql://vierates:vierates@localhost:54329/vierates?schema=public pnpm test`
- `DATABASE_URL=postgresql://vierates:vierates@localhost:54329/vierates?schema=public pnpm build`
- `DATABASE_URL=postgresql://vierates:vierates@localhost:54329/vierates?schema=public pnpm test:e2e`
- `pnpm audit --audit-level high`
- Secret regex scan with `rg`

## Launch Gate

- Anonymity fuzz: PASS
- Authz matrix: PASS for implemented app roles/resources
- Ledger integrity: PASS
- Consent + compliance copy: PASS
- Headers/rate-limit/redaction/secret scan/dependency high-critical: PASS, with one moderate dependency finding
- Field-level encryption: FAIL
- External human penetration test: NOT RUN

**Final statement: NO-GO for production launch with real borrower PII until open Medium launch blockers are closed and external pen test passes.**
