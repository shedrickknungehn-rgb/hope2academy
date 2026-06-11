---
name: API-first with mock fallback
description: How the hope2-academy frontend connects to the live API with localStorage mock as offline fallback
---

# API-first with mock fallback

## The rule
All portal data fetches try the live API at `/api-server/api` first. On network error or non-OK response, they silently fall back to the localStorage mock backend. This keeps the app working offline or when the API server is down.

## How it works
- `artifacts/hope2-academy/src/lib/api-client.ts` — typed HTTP client; JWT stored as `h2l.apiToken` in localStorage
- `use-auth.tsx` exposes `signIn` in the context (not just `signOut`) — login page calls `useAuth().signIn` instead of `mockAuth.signIn` directly
- `AuthProvider.hydrate()` tries `apiClient.getCurrent()` first, then `mockAuth.getCurrent()` fallback
- Each portal route wraps its data fetch in try/catch with mock fallback

## DB setup required
The API server uses PostgreSQL (Drizzle ORM via `@workspace/db`). Tables must exist before the server can seed. Run:
```
cd lib/db && pnpm run push
```
Then restart the API server workflow. It seeds 12 users + 124 items on first start.

**Why:** The Replit database is provisioned but schema must be pushed manually (`drizzle-kit push`) before the server can seed or serve data.
