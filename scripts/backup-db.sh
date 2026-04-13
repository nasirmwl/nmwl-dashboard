#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${ROOT_DIR}/backups"

DB_URL="${SUPABASE_DB_URL:-}"

# If unset: merge Supabase CLI pooler URL (e.g. ~/supabase/.temp/pooler-url) + DB password from .env
POOLER_FILE="${SUPABASE_POOLER_URL_FILE:-${HOME}/supabase/.temp/pooler-url}"
ENV_FILE="${ROOT_DIR}/.env"

if [[ -z "${DB_URL}" && -f "${ENV_FILE}" && -f "${POOLER_FILE}" ]]; then
  PASS_ENC="$(
    node -e "
      const fs = require('fs');
      const raw = fs.readFileSync(process.argv[1], 'utf8');
      const m = raw.match(/NEXT_PUBLIC_SUPABASE_DATABASE_PASSWORD\\s*=\\s*\\\"([^\\\"]+)\\\"/);
      if (!m) process.exit(1);
      process.stdout.write(encodeURIComponent(m[1]));
    " "${ENV_FILE}" 2>/dev/null || true
  )"
  BASE="$(tr -d '[:space:]' <"${POOLER_FILE}")"
  if [[ -n "${PASS_ENC}" && "${BASE}" == postgresql://* ]]; then
    userhost="${BASE#postgresql://}"
    user="${userhost%%@*}"
    rest="${userhost#*@}"
    DB_URL="postgresql://${user}:${PASS_ENC}@${rest}"
    if [[ "${DB_URL}" == *\?* ]]; then
      DB_URL="${DB_URL}&sslmode=require"
    else
      DB_URL="${DB_URL}?sslmode=require"
    fi
  fi
fi

if [[ -z "${DB_URL}" ]]; then
  echo "Error: Could not build database URL."
  echo "Either set SUPABASE_DB_URL, or ensure:"
  echo "  - ${ENV_FILE} contains NEXT_PUBLIC_SUPABASE_DATABASE_PASSWORD"
  echo "  - ${POOLER_FILE} exists (from \`supabase link\`; host is often aws-1-... not aws-0-...)"
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "Error: pg_dump not found. Install PostgreSQL client tools first."
  exit 1
fi

mkdir -p "${OUT_DIR}"
ts="$(date +"%Y%m%d_%H%M%S")"
dump_file="${OUT_DIR}/supabase_full_${ts}.dump"
meta_file="${OUT_DIR}/supabase_full_${ts}.meta.txt"

pg_dump \
  --dbname="${DB_URL}" \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  --file="${dump_file}"

{
  echo "created_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "file=${dump_file}"
  echo "restore=pg_restore --clean --if-exists --no-owner --no-privileges --dbname=\"\${TARGET_DB_URL}\" \"${dump_file}\""
} > "${meta_file}"

echo "Backup created:"
echo "  ${dump_file}"
echo "Metadata:"
echo "  ${meta_file}"
