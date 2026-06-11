#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# 01 — Install system prerequisites on a fresh Ubuntu 22.04/24.04 VPS.
# Installs: Node.js 24, pnpm, PostgreSQL 16, Nginx, Certbot, PM2.
# Run as a sudo-capable user:   bash deploy/scripts/01-install-prerequisites.sh
# Safe to re-run.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

echo "==> Updating apt and installing base tools"
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg git rsync ufw

echo "==> Installing Node.js 24 (NodeSource)"
if ! node -v 2>/dev/null | grep -q '^v24'; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "    node $(node -v) / npm $(npm -v)"

echo "==> Installing pnpm and PM2 (global)"
sudo npm install -g pnpm@10 pm2
echo "    pnpm $(pnpm -v) / pm2 $(pm2 -v)"

echo "==> Installing PostgreSQL, Nginx, Certbot"
sudo apt-get install -y postgresql postgresql-contrib nginx certbot python3-certbot-nginx
sudo systemctl enable --now postgresql
sudo systemctl enable --now nginx

echo "==> Configuring firewall (allow SSH + HTTP/HTTPS)"
sudo ufw allow OpenSSH || true
sudo ufw allow 'Nginx Full' || true
# Enable only if you are sure SSH is allowed (avoid locking yourself out):
# sudo ufw --force enable

echo "==> Prerequisites installed."
echo "    PostgreSQL: $(psql --version)"
echo "    Next: configure deploy/.env.production, then run 02-setup-database.sh"
