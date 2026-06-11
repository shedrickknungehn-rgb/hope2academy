#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# 03 — Build and deploy the app (run from the repo on the VPS).
#   - installs dependencies
#   - builds the API server and the frontend (single-domain settings)
#   - loads the database: restores deploy/hope2-academy-db.dump if present,
#     otherwise pushes the schema fresh (the API then seeds demo data on boot)
#   - publishes the frontend to the web root
#   - (re)starts the API under PM2
# Run:   bash deploy/scripts/03-deploy-app.sh
# Safe to re-run (this is also your "redeploy" command).
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

ENV_FILE="$REPO_ROOT/deploy/.env.production"
[ -f "$ENV_FILE" ] || { echo "ERROR: $ENV_FILE not found (copy from .env.production.example)"; exit 1; }
# shellcheck disable=SC1090
set -a; . "$ENV_FILE"; set +a

WEB_ROOT="${WEB_ROOT:-/var/www/hope2-academy}"
DB_DUMP="${DB_DUMP:-$REPO_ROOT/deploy/hope2-academy-db.dump}"
: "${DATABASE_URL:?DATABASE_URL must be set in deploy/.env.production}"
: "${UPLOAD_DIR:?UPLOAD_DIR must be set in deploy/.env.production}"

echo "==> [1/6] Installing dependencies (pnpm)"
pnpm install --frozen-lockfile

echo "==> [2/6] Building API server"
pnpm --filter @workspace/api-server run build

echo "==> [3/6] Building frontend (API at /api, base /)"
NODE_ENV=production \
  VITE_API_BASE_URL="${VITE_API_BASE_URL:-/api}" \
  BASE_PATH="${BASE_PATH:-/}" \
  pnpm --filter @workspace/hope2-academy run build

echo "==> [4/6] Loading database"
# Protect live data: only load into an EMPTY database. On redeploys (the DB
# already has tables) we never restore or overwrite — schema changes are applied
# manually with drizzle push.
EXISTING_TABLES="$(psql "$DATABASE_URL" -tAc "SELECT count(*) FROM pg_tables WHERE schemaname='public'" 2>/dev/null || echo 0)"
EXISTING_TABLES="${EXISTING_TABLES//[[:space:]]/}"
if [ "${EXISTING_TABLES:-0}" -gt 0 ]; then
  echo "    Database already initialized (${EXISTING_TABLES} tables) — skipping load to protect existing data."
  echo "    To apply schema changes to an existing DB, run manually:"
  echo "      pnpm --filter @workspace/db run push"
elif [ -f "$DB_DUMP" ]; then
  echo "    Empty database — restoring data from $DB_DUMP"
  pg_restore --no-owner --clean --if-exists -d "$DATABASE_URL" "$DB_DUMP"
  # Consume the dump so a future redeploy can never replay it over live data.
  mv "$DB_DUMP" "${DB_DUMP}.restored-$(date +%Y%m%d%H%M%S)"
  echo "    Restore complete; dump archived (renamed) so redeploys can't overwrite live data."
else
  echo "    Empty database, no dump — pushing schema fresh"
  echo "    (the API will seed demo content on first boot)"
  pnpm --filter @workspace/db run push
fi

echo "==> [5/6] Preparing upload dir and publishing frontend"
sudo mkdir -p "$UPLOAD_DIR"
sudo chown -R "$USER":www-data "$UPLOAD_DIR"
sudo chmod -R 2750 "$UPLOAD_DIR"   # setgid: new files inherit www-data group so Nginx can read them
sudo mkdir -p "$WEB_ROOT"
sudo rsync -a --delete "$REPO_ROOT/artifacts/hope2-academy/dist/public/" "$WEB_ROOT/"

echo "==> [6/6] Starting API under PM2"
pm2 startOrReload "$REPO_ROOT/deploy/pm2/ecosystem.config.cjs" --update-env
pm2 save

echo "==> Verifying health"
sleep 2
if curl -fsS "http://127.0.0.1:${PORT:-5000}/api/healthz" >/dev/null; then
  echo "    API healthy at /api/healthz ✓"
else
  echo "    WARNING: health check failed. Inspect:  pm2 logs hope2-api --lines 50"
fi

echo "==> Deploy complete."
echo "    If this is the first deploy, install the Nginx site and run 04-setup-ssl.sh (see DEPLOYMENT.md)."
