import { Router } from "express";
import { dbStore, APP_ROLES, type AppRole, type User } from "../lib/db-store.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

function sanitize(u: any) {
  if (!u) return null;
  const { password: _pw, ...safe } = u;
  return safe;
}

/** GET /api/users */
router.get("/users", requireAuth, requireRole("superadmin", "admin"), async (_req, res) => {
  const users = await dbStore.listUsers();
  res.json(users.map(sanitize));
});

/** GET /api/users/:id */
router.get("/users/:id", requireAuth, async (req, res) => {
  const user = await dbStore.findUserById(String(req.params.id));
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json(sanitize(user));
});

/** POST /api/users */
router.post("/users", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  const { email, name, role, password } = req.body ?? {};
  if (!email || !name || !role) {
    res.status(400).json({ error: "email, name, and role are required" });
    return;
  }
  if (!APP_ROLES.includes(role as AppRole)) {
    res.status(400).json({ error: `role must be one of: ${APP_ROLES.join(", ")}` });
    return;
  }
  const existing = await dbStore.findUserByEmail(email);
  if (existing) { res.status(409).json({ error: "Email already exists" }); return; }

  const user = await dbStore.createUser({
    id: `usr_${Math.random().toString(36).slice(2, 9)}`,
    email,
    name,
    role: role as AppRole,
    password: password ?? "demo1234",
    createdAt: new Date().toISOString(),
  });
  res.status(201).json(sanitize(user));
});

/** PATCH /api/users/:id */
router.patch("/users/:id", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  const { password: _drop, ...patch } = req.body ?? {};
  const updated = await dbStore.updateUser(String(req.params.id), patch);
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(sanitize(updated));
});

/** PATCH /api/users/:id/role */
router.patch("/users/:id/role", requireAuth, requireRole("superadmin"), async (req, res) => {
  const { role } = req.body ?? {};
  if (!APP_ROLES.includes(role as AppRole)) {
    res.status(400).json({ error: `role must be one of: ${APP_ROLES.join(", ")}` });
    return;
  }
  const updated = await dbStore.updateUser(String(req.params.id), { role: role as AppRole });
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(sanitize(updated));
});

/** DELETE /api/users/:id */
router.delete("/users/:id", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  const removed = await dbStore.deleteUser(String(req.params.id));
  if (!removed) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ok: true });
});

export default router;
