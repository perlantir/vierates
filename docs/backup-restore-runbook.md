# Backup And Restore Runbook

VieRates must not store real borrower data in production unless database backups
are encrypted and a restore drill has been completed.

## Required Controls

- Neon production branch backups enabled.
- Provider-side backup encryption enabled by the managed database platform.
- `DATABASE_URL` stored only in Vercel/CI secret stores, never in source.
- Restore drill completed after every schema migration that touches borrower,
  identity, consent, ledger, or payment tables.
- Evidence retained in the launch checklist or incident-response folder.

## CI Restore Drill

CI runs:

```bash
pnpm db:restore-drill
```

The script:

1. Creates a custom-format `pg_dump` from `DATABASE_URL`.
2. Restores it into a fresh `vierates_restore` database.
3. Verifies the restored database has the Prisma migrations table.
4. Drops the restore database.

## Production Restore Drill

Use a temporary Neon branch or isolated restore database. Never restore over
production.

```bash
export DATABASE_URL="postgresql://..."
export BACKUP_RESTORE_ADMIN_URL="postgresql://.../postgres"
export BACKUP_RESTORE_DATABASE="vierates_restore_YYYYMMDD"
export BACKUP_RESTORE_DATABASE_URL="postgresql://.../vierates_restore_YYYYMMDD?schema=public"
pnpm db:restore-drill
```

Record:

- Date and operator.
- Source branch/database.
- Restore target.
- Migration version restored.
- Result of `pnpm db:restore-drill`.
- Confirmation that the temporary restore database was destroyed.

## Launch Gate

Real borrower data remains blocked until a production-equivalent restore drill is
recorded and the external penetration test is complete.
