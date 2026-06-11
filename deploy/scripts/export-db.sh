#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# export-db.sh — RUN THIS IN THE REPLIT SHELL (the source environment), NOT the VPS.
# Dumps the current PostgreSQL database (schema + data) to a single file you then
# copy to the VPS at deploy/hope2-academy-db.dump before running 03-deploy-app.sh.
#
# Run:   bash deploy/scripts/export-db.sh
# Output: deploy/hope2-academy-db.dump  (PostgreSQL custom format, for pg_restore)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must be set (this is automatic in the Replit shell)}"

OUT="${1:-deploy/hope2-academy-db.dump}"
mkdir -p "$(dirname "$OUT")"

echo "==> Exporting database -> $OUT (custom format, schema + data)"
pg_dump -Fc --no-owner --no-privileges "$DATABASE_URL" -f "$OUT"

echo "==> Done: $OUT ($(du -h "$OUT" | cut -f1))"
echo "    Next: copy this file to the VPS at <repo>/deploy/hope2-academy-db.dump"
echo "    e.g.  scp $OUT user@your-vps:/opt/hope2-academy/deploy/hope2-academy-db.dump"
