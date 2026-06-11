---
name: Vercel build config
description: How to make the hope2-academy Vite frontend build on Vercel and reach the Replit API server
---

## Problem
`vite.config.ts` had `PORT` as a hard-required env var (threw at module top-level). Vercel does not set `PORT` during `vite build`, causing the build to fail immediately.

**Why:** The PORT check was placed at module init time, not inside the `server` config block where it is actually needed.

**How to apply:** Keep `PORT` optional with a fallback (`const port = rawPort ? Number(rawPort) : 3000`). The dev/preview server still reads it via the workflow's env; the Vercel build just gets the fallback and ignores it.

## VITE_API_BASE_URL
The web `api-client.ts` uses `BASE = VITE_API_BASE_URL ?? "/api-server/api"`.
- On Replit: no env var set → relative path → Replit path-based proxy routes it to the api-server artifact.
- On Vercel: set `VITE_API_BASE_URL=https://<project>.replit.app/api-server/api` in the Vercel dashboard (or `vercel.json` env section).

## vercel.json env section
```json
"env": {
  "BASE_PATH": "/",
  "VITE_API_BASE_URL": "https://your-replit-project.replit.app/api-server/api"
}
```
User must replace the placeholder URL with their actual Replit `.replit.app` domain after deploying the API server.

## Build command
`pnpm --filter @workspace/hope2-academy run build` — outputDir is `artifacts/hope2-academy/dist/public`.
