/**
 * api-client.ts — typed HTTP client for the HOPE2 API server.
 *
 * Base URL: /api-server/api  (Replit proxy path-based routing)
 * Auth: JWT stored in localStorage under KEY_TOKEN.
 *
 * Every method tries the live API first. Callers can catch errors
 * and fall back to mock-backend if needed.
 */

import type { AppRole } from "./mock-backend";

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "/api-server/api";
const KEY_TOKEN = "h2l.apiToken";

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  avatar?: string | null;
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
  emergency_contact?: string | null;
  grade?: string | null;
  class_name?: string | null;
  department?: string | null;
  subjects?: string[] | null;
  graduation_year?: number | null;
  linked_children?: string[] | null;
  createdAt: string;
}

function getToken(): string | null {
  try { return localStorage.getItem(KEY_TOKEN); } catch { return null; }
}
function setToken(t: string) {
  try { localStorage.setItem(KEY_TOKEN, t); } catch { /* */ }
}
function clearToken() {
  try { localStorage.removeItem(KEY_TOKEN); } catch { /* */ }
}

function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let msg = `API error ${res.status}`;
    try { const j = await res.json(); msg = j.error ?? msg; } catch { /* */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  /** Returns true if the API server is reachable. */
  async ping(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/healthz`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  /** POST /auth/login — returns user and stores token. */
  async signIn(email: string, password: string): Promise<ApiUser> {
    const { token, user } = await apiFetch<{ token: string; user: ApiUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(token);
    return user;
  },

  /** GET /auth/me — returns current user using stored token. Returns null if no token. */
  async getCurrent(): Promise<ApiUser | null> {
    if (!getToken()) return null;
    try {
      return await apiFetch<ApiUser>("/auth/me");
    } catch {
      clearToken();
      return null;
    }
  },

  /** POST /auth/logout — clears stored token. */
  async signOut(): Promise<void> {
    try { await apiFetch("/auth/logout", { method: "POST" }); } catch { /* */ }
    clearToken();
  },

  /** PATCH /auth/me — update own profile fields. */
  async updateProfile(patch: Partial<Omit<ApiUser, "id" | "email" | "role" | "createdAt">>): Promise<ApiUser> {
    return apiFetch<ApiUser>("/auth/me", { method: "PATCH", body: JSON.stringify(patch) });
  },

  /** GET /users — list all users (admin/superadmin only). */
  async listUsers(): Promise<ApiUser[]> {
    return apiFetch<ApiUser[]>("/users");
  },

  /** POST /users — create/invite a new user. */
  async createUser(data: { email: string; name: string; role: AppRole; password?: string }): Promise<ApiUser> {
    return apiFetch<ApiUser>("/users", {
      method: "POST",
      body: JSON.stringify({ ...data, password: data.password ?? "demo1234" }),
    });
  },

  /** PATCH /users/:id/role — change a user's role. */
  async changeRole(uid: string, role: AppRole): Promise<ApiUser> {
    return apiFetch<ApiUser>(`/users/${uid}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
  },

  /** DELETE /users/:id — remove a user. */
  async deleteUser(uid: string): Promise<void> {
    await apiFetch(`/users/${uid}`, { method: "DELETE" });
  },

  /** PATCH /users/:id — update any user's fields (admin+). */
  async updateUser(uid: string, patch: Partial<ApiUser>): Promise<ApiUser> {
    return apiFetch<ApiUser>(`/users/${uid}`, { method: "PATCH", body: JSON.stringify(patch) });
  },

  /** GET /stats — aggregated dashboard stats scoped to the caller's role. */
  async getStats(): Promise<Record<string, unknown>> {
    return apiFetch<Record<string, unknown>>("/stats");
  },

  /** GET /:collection — list items from any collection. */
  async list<T = unknown>(collection: string): Promise<T[]> {
    return apiFetch<T[]>(`/${collection}`);
  },

  /** POST /:collection — create an item. */
  async create<T = unknown>(collection: string, data: unknown): Promise<T> {
    return apiFetch<T>(`/${collection}`, { method: "POST", body: JSON.stringify(data) });
  },

  /** PATCH /:collection/:id — update an item. */
  async update<T = unknown>(collection: string, id: string, patch: unknown): Promise<T> {
    return apiFetch<T>(`/${collection}/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  },

  /** PUT /:collection/:id — insert-or-update an item (upsert, for singletons). */
  async upsert<T = unknown>(collection: string, id: string, data: unknown): Promise<T> {
    return apiFetch<T>(`/${collection}/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },

  /** DELETE /:collection/:id — remove an item. */
  async remove(collection: string, id: string): Promise<void> {
    await apiFetch(`/${collection}/${id}`, { method: "DELETE" });
  },

  /**
   * Upload a file to local-disk storage on the API server (admin/superadmin only).
   * Sends the bytes in a single multipart POST. Returns the stable objectPath
   * ("/objects/<id>") to store in CMS data — NOT a full URL. Render it later via
   * `mediaUrl()`.
   */
  async uploadFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const token = getToken();
    const res = await fetch(`${BASE}/storage/upload`, {
      method: "POST",
      // Do NOT set Content-Type — the browser adds the multipart boundary.
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!res.ok) {
      let msg = `Upload failed (${res.status})`;
      try { const j = await res.json(); msg = j.error ?? msg; } catch { /* */ }
      throw new Error(msg);
    }
    const { objectPath } = (await res.json()) as { objectPath: string };
    return objectPath;
  },

  /** POST /chat — ask the AI assistant. Returns the reply text. */
  async chat(messages: { role: "user" | "assistant" | "system"; content: string }[]): Promise<string> {
    const { reply } = await apiFetch<{ reply: string }>("/chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
    });
    return reply;
  },

  /** Expose token helpers for external use. */
  getToken,
  clearToken,
};

/**
 * Resolve a stored media reference to a renderable URL.
 * - Object Storage paths ("/objects/...") get the backend origin + /storage prefix.
 * - Everything else (bundled asset URLs, absolute http(s) URLs, data URLs) passes through.
 */
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("/objects/")) return `${BASE}/storage${path}`;
  return path;
}

/**
 * Returns true ONLY for network-level failures (no server connection, DNS, timeout).
 * API business errors (4xx/5xx HTTP responses) are thrown as regular Error instances,
 * not TypeError, so they return false here.
 * Use this to decide whether to fall back to the local mock backend.
 */
export function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError;
}
