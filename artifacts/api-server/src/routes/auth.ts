/**
 * Auth routes — Supabase handles sign-in on the frontend.
 * This server only exposes /auth/me (profile fetch + update) using the
 * Supabase JWT the client already holds. Password login is removed — use
 * Supabase Auth (email/password, magic link, etc.) on the frontend.
 */
import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { dbStore } from "../lib/db-store.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

const supabaseAdmin = createClient(
  process.env["VITE_SUPABASE_URL"] ?? process.env["SUPABASE_URL"] ?? "",
  process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "",
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function sanitize(u: Awaited<ReturnType<typeof dbStore.findUserById>>) {
  if (!u) return null;
  const { password: _pw, ...safe } = u as any;
  return safe;
}

/** GET /api/auth/me — returns the current user's profile from our DB */
router.get("/auth/me", requireAuth, async (req, res) => {
  const user = await dbStore.findUserById(req.jwtPayload!.sub);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(sanitize(user));
});

/** PATCH /api/auth/me — update own profile */
router.patch("/auth/me", requireAuth, async (req, res) => {
  const { password: _drop, role: _role, id: _id, ...patch } = req.body ?? {};
  const updated = await dbStore.updateUser(req.jwtPayload!.sub, patch);
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(sanitize(updated));
});

/**
 * POST /api/auth/sync — called after Supabase sign-in to ensure a row
 * exists in our users table. Creates it from the Supabase user record if missing.
 * Body: { role? } — optional role override (ignored if user already exists).
 */
router.post("/auth/sync", requireAuth, async (req, res) => {
  const uid = req.jwtPayload!.sub;
  let user = await dbStore.findUserById(uid);
  if (!user) {
    const { data: supaUser } = await supabaseAdmin.auth.admin.getUserById(uid);
    const email = supaUser?.user?.email ?? "";
    const name =
      supaUser?.user?.user_metadata?.name ??
      supaUser?.user?.user_metadata?.full_name ??
      email.split("@")[0] ??
      "User";
    const role = req.jwtPayload!.role ?? req.body?.role ?? "student";
    user = await dbStore.createUser({
      id: uid,
      email,
      name,
      role: role as any,
      password: "",
      createdAt: new Date().toISOString(),
    });
  }
  res.json(sanitize(user));
});

export default router;
