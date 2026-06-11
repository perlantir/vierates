# VieRates Security Audit - 2026-06-11

## Summary

This audit ran against the local finished codebase before real borrower data.
Automated security coverage was expanded under `tests/security`, concrete High
findings were remediated, CI now runs the security suite explicitly, and the
2026-06-11 follow-up remediated identity vault encryption, repo-owned authz
matrix evidence, secret scanning, dependency audit, and restore-drill coverage.

Launch gate: **NO-GO for real borrower data until the external human penetration
test and production-equivalent backup/restore evidence are complete**.

Reason: the app-level anonymity, ledger, consent, route authorization, and
identity-vault tests are green. Remaining launch evidence is operational:
external penetration testing and production-equivalent backup/restore proof.

## Evidence

| Check                                          | Result                                      |
| ---------------------------------------------- | ------------------------------------------- |
| `DATABASE_URL=... pnpm test -- tests/security` | PASS - 25 files, 91 tests                   |
| `DATABASE_URL=... pnpm test`                   | PASS - 25 files, 91 tests                   |
| `DATABASE_URL=... pnpm typecheck`              | PASS                                        |
| `DATABASE_URL=... pnpm lint`                   | PASS                                        |
| `DATABASE_URL=... pnpm build`                  | PASS                                        |
| `pnpm audit --audit-level moderate`            | PASS - no known vulnerabilities             |
| `pnpm db:restore-drill`                        | PASS - local logical backup restore drill   |
| Targeted tracked-file secret scan              | PASS - no live-looking keys or private keys |
| `gitleaks`                                     | WIRED - GitHub Actions gate added           |

## Crown-Jewel Guarantees

| Guarantee         | Status                             | Evidence                                                                                                                                                                                                     |
| ----------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Anonymity         | PROVEN for lender-facing app paths | `anonymity.fuzz.test.ts` covers lender DAL projection, board payloads, realtime channel auth, listing schema address residue, and SCHEDULED/OPEN/CLOSED/REVEALED/EXPIRED auction payloads.                   |
| Ledger integrity  | PROVEN                             | `ledger.integrity.test.ts` covers negative-balance prevention, bid races, connection races, idempotent replay, Stripe webhook signatures, wallet reconciliation, and no funded-loan-contingent billing code. |
| Consent integrity | PROVEN                             | `consent.test.ts` covers consent hash, immutable `ConsentRecord` and `CreditTransaction` code paths, reveal consent on identity grants, listing geo-gating, and auction geo-gating.                          |
| Authorization     | PROVEN against repo matrix         | `docs/authorization-matrix.md` is now the repo-owned matrix and `authz.matrix.test.ts` table-drives the core cells and negatives. External spec differences must be reconciled before launch.                |

## Findings

### Critical

| ID         | Finding                                                                                                                                                  | Files                                                                                                                                                             | Status |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| VR-SEC-001 | `BorrowerIdentity` stored first name, last name, email, and phone as plaintext. This failed the field-level encryption requirement for SSN-adjacent PII. | `prisma/schema.prisma`, `lib/security/borrower-identity-vault.ts`, `lib/borrower/wizard.ts`, `lib/borrower/dashboard.ts`, `tests/security/identity-vault.test.ts` | FIXED  |

Attack: database, backup, log, or query compromise exposed identity vault fields
directly. Even if lenders could not access the fields through app routes,
at-rest PII exposure broke the audit checklist.

Reproduction:

```bash
rg -n "model BorrowerIdentity|firstName|lastName|email|phone" prisma/schema.prisma lib/borrower
```

Fix: borrower identity writes now use randomized AES-256-GCM field encryption
and HMAC-SHA256 phone blind indexing. Production/runtime environment validation
requires `BORROWER_IDENTITY_KEY`, and the migration redacts legacy plaintext
rows before making `phoneHash` required.

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

| ID         | Finding                                                                                                                                 | Files                                                                                       | Status                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------- |
| VR-SEC-006 | Dependabot was not configured.                                                                                                          | `.github/dependabot.yml`                                                                    | FIXED                                        |
| VR-SEC-007 | Security tests were only implicit through `pnpm test`.                                                                                  | `.github/workflows/ci.yml`                                                                  | FIXED                                        |
| VR-SEC-008 | Backup encryption, restore test, and migration rollback evidence are operational controls not present in repo.                          | `scripts/db-restore-drill.sh`, `.github/workflows/ci.yml`, `docs/backup-restore-runbook.md` | FIXED repo-side; production evidence pending |
| VR-SEC-009 | `gitleaks` was not installed locally or wired as a confirmed CI gate. A targeted tracked-file scan passed, but this was not equivalent. | `.github/workflows/ci.yml`                                                                  | FIXED                                        |
| VR-SEC-010 | `pnpm audit` reported one moderate PostCSS advisory through Next's dependency graph.                                                    | `package.json`, `pnpm-lock.yaml`                                                            | FIXED                                        |

## Generated And Expanded Suites

- `tests/security/anonymity.fuzz.test.ts`
- `tests/security/authz.matrix.test.ts`
- `tests/security/ledger.integrity.test.ts`
- `tests/security/consent.test.ts`
- `tests/security/compliance.copy.test.ts`
- `tests/security/input.fuzz.test.ts`
- `tests/security/identity-vault.test.ts`
- Existing support suites also remain green: headers, middleware, and rate limit tests.

## Go / No-Go

**NO-GO for real borrower data until the human penetration test and
production-equivalent backup/restore evidence are complete.**

The app is materially stronger after this pass, and the remediated High issues
are re-tested green. The 2026-06-11 follow-up also closed the known code-side
items. Launch with real borrower data must still wait until:

1. External human penetration testing is completed and all High/Critical findings are fixed.
2. A production-equivalent restore drill is recorded using `docs/backup-restore-runbook.md`.
3. Any differences between the old external §0.4 matrix and `docs/authorization-matrix.md` are reconciled.
