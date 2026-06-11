/**
 * cms-sync.ts — shared helpers that mirror the localStorage-backed CMS stores
 * to the API server so portal edits persist server-side and appear on the
 * public (Vercel-hosted) site across devices.
 *
 * Model: each store's localStorage cache is the instant source of truth for the
 * editor. On load, `hydrate*` pulls the backend state into the cache (server
 * wins). On save, these helpers push the full current state to the backend.
 *
 * - Reads are public (no token required) so the public site can hydrate.
 * - Writes only run when an admin token is present, so the public site never
 *   attempts to write. Failures are surfaced via a `h2l.sync.error` event and a
 *   console warning rather than thrown (edits stay in the local cache).
 */
import { apiClient } from "./api-client";

export function notifySyncError(scope: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.warn(`[cms-sync] "${scope}" failed to persist to the server:`, message);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("h2l.sync.error", { detail: { scope, message } }),
    );
  }
}

/** True when an admin is signed in (a JWT is stored). */
export function canPush(): boolean {
  return !!apiClient.getToken();
}

/**
 * Upsert a singleton row (PUT /:collection/:id). No-ops when not signed in.
 * Errors are surfaced, never thrown — the local cache already holds the edit.
 */
export function pushSingleton(
  collection: string,
  id: string,
  data: unknown,
  scope: string,
): void {
  if (!canPush()) return;
  apiClient.upsert(collection, id, data).catch((err) => notifySyncError(scope, err));
}

/**
 * Mirror a full list collection to the backend by upserting every item. Used
 * for collections that carry frontend defaults (e.g. pages) so the backend
 * always holds the complete set, not just the one edited item.
 */
export function mirrorList<T extends { id: string }>(
  collection: string,
  items: T[],
  scope: string,
): void {
  if (!canPush()) return;
  Promise.all(items.map((item) => apiClient.upsert(collection, item.id, item))).catch(
    (err) => notifySyncError(scope, err),
  );
}

/** Delete a single item from a list collection. No-ops when not signed in. */
export function pushDelete(collection: string, id: string, scope: string): void {
  if (!canPush()) return;
  apiClient.remove(collection, id).catch((err) => notifySyncError(scope, err));
}
