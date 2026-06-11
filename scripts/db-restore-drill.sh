#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

restore_db="${BACKUP_RESTORE_DATABASE:-vierates_restore}"
admin_url="${BACKUP_RESTORE_ADMIN_URL:-postgresql://vierates:vierates@localhost:54329/postgres}"
restore_url="${BACKUP_RESTORE_DATABASE_URL:-postgresql://vierates:vierates@localhost:54329/${restore_db}?schema=public}"
source_pg_url="${DATABASE_URL%%\?schema=*}"
restore_pg_url="${restore_url%%\?schema=*}"
dump_file="$(mktemp -t vierates-backup-XXXXXX.sql)"
filtered_dump_file="$(mktemp -t vierates-backup-filtered-XXXXXX.sql)"

cleanup() {
  rm -f "$dump_file"
  rm -f "$filtered_dump_file"
  psql "$admin_url" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"$restore_db\" WITH (FORCE);" >/dev/null 2>&1 || true
}
trap cleanup EXIT

for binary in pg_dump psql; do
  if ! command -v "$binary" >/dev/null 2>&1; then
    echo "$binary is required for the backup restore drill." >&2
    exit 1
  fi
done

pg_dump "$source_pg_url" --format=plain --no-owner --no-privileges --file="$dump_file"
sed '/^SET transaction_timeout/d' "$dump_file" >"$filtered_dump_file"
psql "$admin_url" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"$restore_db\" WITH (FORCE);" >/dev/null
psql "$admin_url" -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"$restore_db\";" >/dev/null
psql "$restore_pg_url" -v ON_ERROR_STOP=1 -f "$filtered_dump_file" >/dev/null
psql "$restore_pg_url" -v ON_ERROR_STOP=1 -c 'SELECT 1 FROM "_prisma_migrations" LIMIT 1;' >/dev/null

echo "Backup restore drill completed for $restore_db."
