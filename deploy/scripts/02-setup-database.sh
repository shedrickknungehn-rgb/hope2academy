#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# 02 — Create the PostgreSQL role and database.
# Reads credentials from deploy/.env.production (DATABASE_URL). Idempotent.
# Run:   bash deploy/scripts/02-setup-database.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.production"
[ -f "$ENV_FILE" ] || { echo "ERROR: $ENV_FILE not found (copy from .env.production.example)"; exit 1; }
# shellcheck disable=SC1090
set -a; . "$ENV_FILE"; set +a

: "${DATABASE_URL:?DATABASE_URL must be set in deploy/.env.production}"

# Parse postgresql://USER:PASSWORD@HOST:PORT/DBNAME
no_proto="${DATABASE_URL#*://}"
creds="${no_proto%@*}"
hostpart="${no_proto#*@}"
DB_USER="${creds%%:*}"
DB_PASSWORD="${creds#*:}"
DB_NAME="${hostpart##*/}"
DB_NAME="${DB_NAME%%\?*}"   # strip any ?query suffix

echo "==> Creating role '$DB_USER' and database '$DB_NAME' (if missing)"

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$do\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$do\$;
SQL

# CREATE DATABASE cannot run inside the DO block / a transaction, so do it via \gexec.
sudo -u postgres psql -v ON_ERROR_STOP=1 -tc \
  "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 \
  || sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}"

sudo -u postgres psql -v ON_ERROR_STOP=1 -c \
  "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

echo "==> Database ready: ${DB_NAME} (owner: ${DB_USER})"
echo "    Next: run 03-deploy-app.sh"
