#!/usr/bin/env bash
# Dump PostgreSQL from DATABASE_URL into backups/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f backend/.env ]]; then
  # shellcheck disable=SC1091
  set -a
  source backend/.env
  set +a
elif [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${DATABASE_URL:=postgresql://postgres:postgres@localhost:5432/mental_health_db}"

mkdir -p backups
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="backups/mental_health_db_${STAMP}.sql"

echo "Backing up to ${OUT}"
pg_dump "$DATABASE_URL" --no-owner --no-acl -f "$OUT"
echo "Done. Copy ${OUT} to external/cloud storage for safekeeping."
echo "Restore example: psql \"\$DATABASE_URL\" -f ${OUT}"
