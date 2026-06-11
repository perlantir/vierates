# VieRates Security Audit - 2026-06-11

## Summary

This audit ran against the local finished codebase before real borrower data.
Automated security coverage was expanded under `tests/security`, concrete High
findings were remediated, and CI now runs the security suite explicitly.

Launch gate: **NO-GO for real borrower data**.

Reason: the app-level anonymity, ledger, consent, and route authorization tests
are green, but `BorrowerIdentity` PII is still plaintext at rest, the external
human penetration test is not completed, and backup/restore evidence cannot be
verified from this repo.

## Evidence

| Check                                          | Result                                      |
| ---------------------------------------------- | ------------------------------------------- |
| `DATABASE_URL=... pnpm test -- tests/security` | PASS - 24 files, 77 tests                   |
| `DATABASE_URL=... pnpm test`                   | PASS - 24 files, 77 tests                   |
| `DATABASE_URL=... pnpm typecheck`              | PASS                                        |
| `DATABASE_URL=... pnpm lint`                   | PASS                                        |
| `DATABASE_URL=... pnpm build`                  | PASS                                        |
| `pnpm audit --audit-level high`                | PASS - no high/critical, 1 moderate         |
| Targeted tracked-file secret scan              | PASS - no live-looking keys or private keys |
| `gitleaks`                                     | NOT RUN - binary unavailable locally        |

## Crown-Jewel Guarantees

| Guarantee         | Status                             | Evidence                                                                                                                                                                                                     |
| ----------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Anonymity         | PROVEN for lender-facing app paths | `anonymity.fuzz.test.ts` covers lender DAL projection, board payloads, realtime channel auth, listing schema address residue, and SCHEDULED/OPEN/CLOSED/REVEALED/EXPIRED auction payloads.                   |
| Ledger integrity  | PROVEN                             | `ledger.integrity.test.ts` covers negative-balance prevention, bid races, connection races, idempotent replay, Stripe webhook signatures, wallet reconciliation, and no funded-loan-contingent billing code. |
| Consent integrity | PROVEN                             | `consent.test.ts` covers consent hash, immutable `ConsentRecord` and `CreditTransaction` code paths, reveal consent on identity grants, listing geo-gating, and auction geo-gating.                          |
| Authorization     | BROKEN as a full launch-gate claim | Repo-defined `can()` matrix coverage is expanded and green, but the referenced external §0.4 matrix is not present in the repo, so 100% matrix coverage cannot be proven.                                    |

## Findings

### Critical

| ID         | Finding                                                                                                                                                 | Files                                                                         | Status                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------- |
| VR-SEC-001 | `BorrowerIdentity` stores first name, last name, email, and phone as plaintext. This fails the field-level encryption requirement for SSN-adjacent PII. | `prisma/schema.prisma`, `lib/borrower/wizard.ts`, `lib/borrower/dashboard.ts` | OPEN - launch blocker |

Attack: database, backup, log, or query compromise exposes identity vault fields
directly. Even if lenders cannot access the fields through app routes, at-rest
PII exposure breaks the audit checklist.

Reproduction:

```bash
rg -n "model BorrowerIdentity|firstName|lastName|email|phone" prisma/schema.prisma lib/borrower
```

Minimal fix: add a borrower identity vault abstraction with KMS-backed
AES-256-GCM or equivalent envelope encryption, add a deterministic blind index
for phone lookups, migrate existing rows, and make production boot fail if the
identity encryption key is missing.

### High

| ID         | Finding                                                                                                               | Files                                                                        | Status |
| ---------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------ |
| VR-SEC-002 | Lender realtime channel authorization allowed any lender role to subscribe to any `private-lender-auction-*` channel. | `lib/services/auction/index.ts`, `tests/security/anonymity.fuzz.test.ts`     | FIXED  |
| VR-SEC-003 | Borrower connection credits used a read-then-update wallet debit and could race into incorrect charges.               | `lib/borrower/connect.ts`, `tests/security/ledger.integrity.test.ts`         | FIXED  |
| VR-SEC-004 | Existing live listings could schedule auctions after a state rule changed to RED/YELLOW.                              | `lib/borrower/verification.ts`, `tests/security/consent.test.ts`             | FIXED  |
| VR-SEC-005 | Lender marketing copy framed pricing as “cost per funded loan,” creating RESPA/success-fee compliance risk.           | `app/(marketing)/lenders/page.tsx`, `tests/security/compliance.copy.test.ts` | FIXED  |

Fixes:

- Realtime auth now requires exact lender auction channel match with `auctionId`.
- Connection creation checks idempotency before side effects and uses atomic
  `creditWallet.updateMany({ balance: { gte: 1 }})` debit.
- Auction scheduling re-checks `StateRule` and rejects non-GREEN states.
- Lender page now uses flat marketplace-credit wording.

### Medium

| ID         | Finding                                                                                                                               | Files                      | Status |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------ |
| VR-SEC-006 | Dependabot was not configured.                                                                                                        | `.github/dependabot.yml`   | FIXED  |
| VR-SEC-007 | Security tests were only implicit through `pnpm test`.                                                                                | `.github/workflows/ci.yml` | FIXED  |
| VR-SEC-008 | Backup encryption, restore test, and migration rollback evidence are operational controls not present in repo.                        | External infra             | OPEN   |
| VR-SEC-009 | `gitleaks` is not installed locally or wired as a confirmed CI gate. A targeted tracked-file scan passed, but this is not equivalent. | CI/security tooling        | OPEN   |

## Generated And Expanded Suites

- `tests/security/anonymity.fuzz.test.ts`
- `tests/security/authz.matrix.test.ts`
- `tests/security/ledger.integrity.test.ts`
- `tests/security/consent.test.ts`
- `tests/security/compliance.copy.test.ts`
- `tests/security/input.fuzz.test.ts`
- Existing support suites also remain green: headers, middleware, and rate limit tests.

## Go / No-Go

**NO-GO for real borrower data.**

The app is materially stronger after this pass, and the remediated High issues
are re-tested green. However, launch with real borrower data must wait until:

1. `BorrowerIdentity` field-level encryption and phone blind indexing are implemented and migrated.
2. The full external §0.4 authorization matrix is available and covered cell-by-cell.
3. External human penetration testing is completed and all High/Critical findings are fixed.
4. Backup encryption, restore testing, and rollback evidence are verified.
5. A real gitleaks or equivalent secret-scanning gate is installed in CI.
