# HOPE2 ACADEMY — Self-Hosting on an Ubuntu VPS

This guide migrates HOPE2 ACADEMY off Replit onto your own Ubuntu server. It is
written to be copy‑paste friendly and explains **what each command does**.

- **Frontend** (`artifacts/hope2-academy`) — static site served by Nginx at `/`.
- **API server** (`artifacts/api-server`) — Node app behind Nginx at `/api`.
- **Database** — PostgreSQL running on the same VPS.
- **Uploads** — stored on the VPS local disk and served by Nginx.

Everything lives on **one domain**, so the browser only ever talks to one origin
(no CORS).

```
                ┌──────────────────────── your-domain.tld (Nginx :80/:443) ──────────────────────┐
   Browser ───► │  /                      -> static files  (/var/www/hope2-academy)               │
                │  /api/storage/objects/  -> files on disk  (/var/lib/hope2-academy/uploads)       │
                │  /api/...               -> reverse proxy  -> Node API (127.0.0.1:5000)           │
                └───────────────────────────────────────────────────────────────────────┬─────────┘
                                                                                          │
                                                                          PostgreSQL (127.0.0.1:5432)
```

---

## 1. What changed in the code (migration report)

The application logic, routes, design, API contract, and database schema are
**unchanged**. Only the Replit‑specific infrastructure couplings were replaced:

| Area | Before (Replit) | After (self-hosted) |
| --- | --- | --- |
| File uploads | Replit Object Storage (Google Cloud Storage sidecar), presigned PUT | Local disk via `multer`; files saved to `UPLOAD_DIR` |
| Serving uploads | GCS object proxy | Nginx serves from disk (Node route remains as fallback) |
| Frontend upload call | 2-step (ask for presigned URL, then PUT to GCS) | 1-step multipart `POST /api/storage/upload` |
| API base URL | Replit proxy path (`/api-server/api`) | `/api` (same origin) via `VITE_API_BASE_URL` |
| Bind address | all interfaces | `HOST=127.0.0.1` (Nginx-only access) |
| Proxy awareness | none | `trust proxy` enabled (correct client IPs behind Nginx) |
| Chat abuse protection | none | per-IP rate limit on `POST /api/chat` |
| Build plugins | Replit Vite plugins always on | excluded from production builds (no Replit coupling) |

Removed files: `artifacts/api-server/src/lib/objectStorage.ts`,
`artifacts/api-server/src/lib/objectAcl.ts`. Removed dependencies:
`@google-cloud/storage`, `google-auth-library`. Added dependencies:
`multer`, `express-rate-limit`.

The stable media reference format (`/objects/<id>`) is unchanged, so existing
CMS data keeps working. (At migration time the database contained **no** uploaded
media references, so there is nothing to copy; new uploads land on the VPS disk.)

---

## 2. Before you start

You need:

- An Ubuntu **22.04 or 24.04** VPS with root/sudo and a public IP.
- A **domain name** with a DNS **A record** (and AAAA if you use IPv6) pointing
  at the VPS IP. Wait for DNS to propagate before step 7 (TLS).
- A **Gemini API key** if you want the AI chat widget
  (https://aistudio.google.com/apikey) — optional; chat is disabled gracefully
  without it.

Conventions used below (adjust to taste):

- Repo location on the VPS: `/opt/hope2-academy`
- Web root (static frontend): `/var/www/hope2-academy`
- Upload directory: `/var/lib/hope2-academy/uploads`

---

## 3. Get the code onto the VPS

SSH in, then clone your repository (or copy it up with `scp`/`rsync`):

```bash
sudo mkdir -p /opt/hope2-academy
sudo chown "$USER":"$USER" /opt/hope2-academy
git clone <YOUR_REPO_URL> /opt/hope2-academy
cd /opt/hope2-academy
```

> No git remote? From your machine:
> `rsync -az --exclude node_modules --exclude .git ./ user@your-vps:/opt/hope2-academy/`

---

## 4. Install prerequisites

```bash
bash deploy/scripts/01-install-prerequisites.sh
```

This installs **Node.js 24**, **pnpm**, **PM2** (keeps the API running and
restarts it on crash/reboot), **PostgreSQL 16**, **Nginx** (web server / reverse
proxy), and **Certbot** (free TLS certificates). It also opens the firewall for
SSH and web traffic. Safe to re-run.

---

## 5. Configure environment variables

```bash
cp deploy/.env.production.example deploy/.env.production
nano deploy/.env.production
```

Fill in:

- `DATABASE_URL` — set a strong password (used to create the DB in the next step).
  Keep host `127.0.0.1`. Use a password without spaces or the characters `# : @`.
- `JWT_SECRET` — generate one and paste it: `openssl rand -hex 32`
- `GEMINI_API_KEY` — your key, or leave blank to disable chat.
- Leave `PORT`, `HOST`, `UPLOAD_DIR` as provided unless you have a reason to change
  them. (If you change `PORT` or `UPLOAD_DIR`, update `deploy/nginx/hope2-academy.conf`
  to match.)

This file holds secrets — it is gitignored. Never commit it.

---

## 6. (Optional) Bring your existing data across

If you have data in the Replit database you want to keep:

**In the Replit shell** (the source environment):

```bash
bash deploy/scripts/export-db.sh
```

This writes `deploy/hope2-academy-db.dump` (a PostgreSQL custom-format dump with
schema + data). Copy it to the VPS:

```bash
# from your machine or Replit:
scp deploy/hope2-academy-db.dump user@your-vps:/opt/hope2-academy/deploy/
```

**Uploaded media.** New uploads live on local disk, so for VPS-to-VPS moves (or
backups) bundle them with `bash deploy/scripts/export-uploads.sh` and extract the
resulting tarball into the parent of `UPLOAD_DIR` on the target. For the initial
Replit→VPS migration there is normally nothing to copy: the original uploads were
in Replit Object Storage and the database referenced **no** media at migration
time. (Re-upload any needed images through the admin CMS.)

If you **skip** this, you start fresh: the deploy script creates the schema and
the API seeds demo content on first boot.

---

## 7. Create the database

```bash
bash deploy/scripts/02-setup-database.sh
```

Reads `DATABASE_URL` from your `.env.production` and creates the matching
PostgreSQL role and database (idempotent — safe to re-run).

---

## 8. Build & deploy the app

```bash
bash deploy/scripts/03-deploy-app.sh
```

This installs dependencies, builds the API and the frontend (with the
single-domain settings), loads the database (restores your dump if present,
otherwise pushes the schema), publishes the frontend to `/var/www/hope2-academy`,
prepares the upload directory, and starts the API under PM2. It finishes with a
health check against `/api/healthz`.

This is also your **redeploy** command for future updates (after `git pull`).

> **Data safety:** the database is only loaded into an *empty* database. On
> redeploys (when tables already exist) the script never restores or overwrites
> your data. After the first successful restore, the dump is renamed
> (`*.restored-<timestamp>`) so it can't be replayed by accident. To apply schema
> changes to an existing database, run `pnpm --filter @workspace/db run push`
> manually.

Make PM2 survive reboots (run the one command it prints, then save):

```bash
pm2 startup    # prints a sudo command — copy/paste & run it once
pm2 save
```

---

## 9. Install the Nginx site

```bash
# Put your real domain into the config first:
sudo cp deploy/nginx/hope2-academy.conf /etc/nginx/sites-available/hope2-academy
sudo nano /etc/nginx/sites-available/hope2-academy   # replace your-domain.tld

# Enable it and disable the default site:
sudo ln -sf /etc/nginx/sites-available/hope2-academy /etc/nginx/sites-enabled/hope2-academy
sudo rm -f /etc/nginx/sites-enabled/default

# Test the config and reload:
sudo nginx -t && sudo systemctl reload nginx
```

At this point `http://your-domain.tld` should load the site.

---

## 10. Enable HTTPS

Once DNS points at the VPS and the site loads over HTTP:

```bash
DOMAIN=your-domain.tld EMAIL=you@example.com bash deploy/scripts/04-setup-ssl.sh
```

Certbot obtains a certificate, rewrites the Nginx config to serve HTTPS, and adds
an automatic HTTP→HTTPS redirect. Renewal is automatic; verify with
`sudo certbot renew --dry-run`.

---

## 11. Verify (post-deploy checklist)

```bash
# API health (local):
curl -s http://127.0.0.1:5000/api/healthz          # -> {"status":"ok"}
# Through the public domain:
curl -s https://your-domain.tld/api/healthz        # -> {"status":"ok"}
```

Then in a browser:

- [ ] Home page and all public pages load with images and styling.
- [ ] Log in with an admin account (portal redirects by role).
- [ ] In the admin CMS, **upload an image** — it appears, and its URL is
      `https://your-domain.tld/api/storage/objects/<id>`.
- [ ] The AI chat widget replies (if `GEMINI_API_KEY` is set).
- [ ] `pm2 status` shows `hope2-api` **online**.

---

## 12. Everyday operations

```bash
pm2 status                      # process state
pm2 logs hope2-api --lines 100  # tail API logs
pm2 restart hope2-api           # restart API

# Redeploy after pulling new code:
cd /opt/hope2-academy && git pull && bash deploy/scripts/03-deploy-app.sh

# Back up the database (cron this daily):
pg_dump -Fc --no-owner "$DATABASE_URL" -f ~/hope2-backup-$(date +%F).dump
# Back up uploads:
tar czf ~/hope2-uploads-$(date +%F).tgz -C /var/lib/hope2-academy uploads
```

---

## 13. Rollback plan

If a deploy goes wrong:

1. **App / code** — check out the previous commit and redeploy:
   ```bash
   cd /opt/hope2-academy && git checkout <previous-good-commit>
   bash deploy/scripts/03-deploy-app.sh
   ```
   PM2 keeps the previous process running until the new build replaces it; if the
   new one is unhealthy, `pm2 restart hope2-api` after checking `pm2 logs`.
2. **Database** — restore from a backup dump:
   ```bash
   pg_restore --no-owner --clean --if-exists -d "$DATABASE_URL" ~/hope2-backup-YYYY-MM-DD.dump
   ```
3. **Uploads** — extract a backup tarball back into `/var/lib/hope2-academy`.
4. **Full revert to Replit** — the Replit project is untouched; you can keep
   running it until the VPS is verified. Only repoint DNS once you are confident.

Always take a fresh DB dump and uploads tarball **before** each deploy.

---

## 14. Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| 502 Bad Gateway | API not running. `pm2 status`, `pm2 logs hope2-api`. Confirm `PORT` matches the Nginx `upstream`. |
| Uploaded images 404 | Check `UPLOAD_DIR` matches the Nginx `alias` path; ensure the dir is readable (`03` sets group `www-data`). |
| Login fails after restart | `JWT_SECRET` changed → existing tokens invalid. Users log in again. Keep `JWT_SECRET` stable. |
| Chat returns 503 | `GEMINI_API_KEY` not set. Add it to `.env.production` and `pm2 restart hope2-api`. |
| Chat returns 429 | Rate limit hit (default 20/min/IP). Raise `CHAT_RATE_LIMIT` if needed. |
| `pg_restore` ownership errors | The scripts pass `--no-owner`; ensure you connect with the DB owner from `DATABASE_URL`. |
| Env change not taking effect | `pm2 startOrReload deploy/pm2/ecosystem.config.cjs` re-reads `.env.production`. |
