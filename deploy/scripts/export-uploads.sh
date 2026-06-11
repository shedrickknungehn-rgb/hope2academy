#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# export-uploads.sh — bundle uploaded media for migration / backup.
#
# Uploaded media is stored on local disk under UPLOAD_DIR. This archives that
# directory into a single tarball you can copy to the VPS and extract into its
# UPLOAD_DIR.
#
# NOTE: The original Replit deployment stored uploads in Replit Object Storage,
# NOT on local disk, and a scan at migration time found 0 media references in the
# database — so there is typically nothing to export for the first migration.
# This script is still useful for VPS-to-VPS moves and routine backups, and it
# captures a populated UPLOAD_DIR if one exists.
#
# Run:   bash deploy/scripts/export-uploads.sh
# Output: deploy/hope2-academy-uploads.tgz
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SRC="${UPLOAD_DIR:-$REPO_ROOT/artifacts/api-server/uploads}"
OUT="${1:-$REPO_ROOT/deploy/hope2-academy-uploads.tgz}"

if [ ! -d "$SRC" ] || [ -z "$(ls -A "$SRC" 2>/dev/null)" ]; then
  echo "No uploads found at $SRC — nothing to export."
  exit 0
fi

mkdir -p "$(dirname "$OUT")"
echo "==> Archiving uploads from $SRC -> $OUT"
tar czf "$OUT" -C "$(dirname "$SRC")" "$(basename "$SRC")"

echo "==> Done: $OUT ($(du -h "$OUT" | cut -f1))"
echo "    On the VPS, extract into the parent of UPLOAD_DIR, e.g.:"
echo "    sudo tar xzf hope2-academy-uploads.tgz -C /var/lib/hope2-academy"
