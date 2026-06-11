---
name: VPS self-host deploy
description: Durable gotchas for self-hosting the api-server + frontend off Replit on an Ubuntu VPS (deploy/ package).
---

# VPS self-host deploy

## Redeploy must never replay a persisted DB dump
The deploy script doubles as the redeploy command. If it blindly runs
`pg_restore` whenever a dump file exists, every redeploy silently wipes all data
created since the dump. Guard the load step: only restore into an **empty**
database (count `pg_tables` in `public`), and **rename/consume the dump** after a
successful restore so it can't be replayed.
**Why:** a persisted `deploy/*.dump` + an unconditional restore = data loss on the
second deploy (caught in architect review).
**How to apply:** keep the empty-DB gate in `deploy/scripts/03-deploy-app.sh`; on
populated DBs apply schema changes with `pnpm --filter @workspace/db run push`.

## The built api-server needs node_modules at runtime — do NOT prune
`artifacts/api-server/build.mjs` externalizes a large set of packages, including
`@google/*` (so `@google/genai`, the Gemini chat client, is NOT bundled). The
esbuild output (`dist/index.mjs`) therefore resolves those imports from
`node_modules` at runtime via pnpm symlinks (walking up from `dist/`).
**Why:** shipping only `dist/` (or pruning node_modules) makes the server crash on
boot with an unresolved `@google/genai`.
**How to apply:** the deploy must run `pnpm install` and leave node_modules in
place next to the build; PM2 runs with `cwd = artifacts/api-server`.

## Production safety nets baked into the app
- `jwt.ts` throws at boot when `NODE_ENV=production` and `JWT_SECRET` is unset or
  equals the public dev fallback — prevents forged admin tokens from a misconfig.
- Uploads are local-disk; Nginx serves them directly via
  `alias` at `^~ /api/storage/objects/`. New uploads always carry a file
  extension, so Nginx infers the MIME type; the Node serve route remains a
  fallback. Single domain ⇒ same-origin ⇒ no CORS needed.
