#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# 04 — Obtain and install a Let's Encrypt TLS certificate via Certbot.
# Requires: DNS A/AAAA records for your domain already point at this VPS, and
# the Nginx site (deploy/nginx/hope2-academy.conf) is installed and enabled.
# Run:   DOMAIN=your-domain.tld EMAIL=you@example.com bash deploy/scripts/04-setup-ssl.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

: "${DOMAIN:?Set DOMAIN=your-domain.tld}"
: "${EMAIL:?Set EMAIL=you@example.com}"
WWW="${WWW:-www.$DOMAIN}"

echo "==> Requesting certificate for $DOMAIN and $WWW"
sudo certbot --nginx \
  -d "$DOMAIN" -d "$WWW" \
  --non-interactive --agree-tos -m "$EMAIL" --redirect

echo "==> Reloading Nginx"
sudo nginx -t && sudo systemctl reload nginx

echo "==> TLS installed. Certbot auto-renews via the certbot.timer systemd unit."
echo "    Test renewal with:  sudo certbot renew --dry-run"
