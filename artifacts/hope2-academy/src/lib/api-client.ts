/**
 * api-client.ts — typed HTTP client for the HOPE2 API server.
 *
 * Base URL: VITE_API_BASE_URL env var (set in Vercel to the deployed API URL)
 * Auth: Supabase session access_token sent as Bearer header.
 */

import { supabase } from '@/integrations/supabase/client';
import type { AppRole } from './mock-backend';

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "/api";

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

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let msg = `API error ${res.status}`;
    try { const j = await res.json(); msg = j.error ?? msg; } catch { /* */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  async ping(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/healthz`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  /** POST /auth/sync — ensure a user row exists in our DB after Supabase sign-in. */
  async syncUser(): Promise<ApiUser> {
    return apiFetch<ApiUser>("/auth/sync", { method: "POST" });
  },

  /** GET /auth/me — returns current user using Supabase session token. */
  async getCurrent(): Promise<ApiUser | null> {
    const token = await getToken();
    if (!token) return null;
    try {
      return await apiFetch<ApiUser>("/auth/me");
    } catch {
      return null;
    }
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
   * Upload a file to Supabase Storage (admin/superadmin only).
   * Returns the stable objectPath ("/objects/<id>").
   */
  async uploadFile(file: File): Promise<string> {
    const token = await getToken();
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${BASE}/storage/upload`, {
      method: "POST",
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
};

/**
 * Resolve a stored media reference to a renderable URL.
 * - Object Storage paths ("/objects/...") route through the API storage proxy.
 * - Everything else passes through.
 */
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("/objects/")) return `${BASE}/storage${path}`;
  return path;
}

/**
 * Returns true ONLY for network-level failures.
 */
export function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError;
}
