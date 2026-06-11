# HOPE2 ACADEMY

A Liberian school management system with a public-facing website and a multi-role portal for admins, teachers, students, parents, and alumni.

## Run & Operate

- `pnpm --filter @workspace/hope2-academy run dev` — run the frontend (port auto-assigned by workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000, not yet used)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: Vite + React + react-router-dom + Tailwind v4 + Framer Motion
- Auth/Data: 100% localStorage-based mock backend (`src/lib/mock-backend.ts`) — no real backend needed
- UI: shadcn/ui components, oklch color theme (Liberian flag colors — red, green, white/gold)
- Fonts: Fraunces (display) + Inter (body) via Google Fonts

## Where things live

- `artifacts/hope2-academy/` — the frontend web artifact
- `artifacts/hope2-academy/src/App.tsx` — router with all routes
- `artifacts/hope2-academy/src/styles.css` — Tailwind v4 theme (source of truth for colors/fonts)
- `artifacts/hope2-academy/src/lib/mock-backend.ts` — localStorage auth + all data
- `artifacts/hope2-academy/src/assets/hope/` — real JPEG images used as fallbacks
- `artifacts/hope2-academy/src/assets/departments/` — `.asset.json` files (Lovable CDN stubs)
- `artifacts/hope2-academy/src/assets/hero/` — `.asset.json` files (Lovable CDN stubs)
- `artifacts/hope2-academy/src/assets/uploads/` — `.asset.json` files (Lovable CDN stubs)
- `artifacts/hope2-academy/vite.config.ts` — `lovableAssetPlugin()` maps `.asset.json` → local images

## Architecture decisions

- **Lovable asset plugin**: `.asset.json` files are Lovable CDN references (`/__l5e/` URLs). The `lovableAssetPlugin()` in `vite.config.ts` intercepts these and maps them to the bundled JPEG images in `src/assets/hope/`. The Lovable CDN (`pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev`) is inaccessible from Replit.
- **Mock backend**: All auth and data uses `localStorage`. No real API calls. Supabase client (`src/integrations/supabase/client.ts`) gracefully stubs out when env vars are missing.
- **Roles**: superadmin, admin, teacher, student, parent, alumni — each has its own portal dashboard.
- **BrowserRouter at root**: `main.tsx` uses `BrowserRouter` from react-router-dom; all routes defined in `App.tsx`.

## Product

- Public site: Home, About, Programs/Departments, Stories, Contact
- Portal: Multi-role dashboard (login → role-based redirect → dashboards for each user type)
- Live chat widget (Supabase-backed, disabled gracefully when env vars missing)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Do NOT run `pnpm dev` at workspace root — artifacts must run via their own workflow
- `.asset.json` files are NOT real images — they're CDN stubs handled by the Vite plugin
- Adding new images: put real files in `src/assets/hope/` and add a mapping entry in `vite.config.ts` `ASSET_FALLBACKS`
- Supabase env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are optional — omitting them disables live chat only

## Deployment (self-hosted VPS)

- Full migration guide: **`DEPLOYMENT.md`** (Ubuntu VPS, single domain, same-origin).
- Deploy package lives in **`deploy/`**: `nginx/` site config, `pm2/ecosystem.config.cjs`, `.env.production.example`, `frontend.env.production.example`, and `scripts/` (`01`–`04` install→ssl, `export-db.sh`, `export-uploads.sh`).
- Architecture: Nginx serves the frontend at `/`, proxies `/api` to the Node API (127.0.0.1), and serves uploaded media from local disk (`UPLOAD_DIR`). PostgreSQL runs on the same VPS; PM2 keeps the API alive.
- File uploads are **local-disk** now (not Replit Object Storage): `src/lib/fileStorage.ts` + multer in `routes/storage.ts`. Stable media path `/objects/<id>` is unchanged.
- Production env vars the API reads: `PORT`, `HOST`, `DATABASE_URL`, `JWT_SECRET` (override the dev fallback!), `GEMINI_API_KEY`, `UPLOAD_DIR`, optional `CORS_ORIGIN`/`MAX_UPLOAD_BYTES`/`CHAT_RATE_LIMIT`/`LOG_LEVEL`.
- Secrets/exports are gitignored: `deploy/.env.production`, `deploy/*.dump`, `deploy/*.tgz`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
