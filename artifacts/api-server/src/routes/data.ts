/**
 * Generic CRUD routes for all data modules.
 * Each module is a named collection in the PostgreSQL items table.
 * GET    /api/:collection          — list all (public for PUBLIC_READ collections)
 * GET    /api/:collection/:id      — get one
 * POST   /api/:collection          — create
 * PUT    /api/:collection/:id      — insert-or-update (upsert, for singletons)
 * PATCH  /api/:collection/:id      — update
 * DELETE /api/:collection/:id      — delete
 */
import { Router } from "express";
import type { Request, Response } from "express";
import { dbStore } from "../lib/db-store.js";
import { requireAuth } from "../middlewares/auth.js";
import { verifyToken, extractRole } from "../lib/jwt.js";

const router = Router();

const PUBLIC_READ = new Set([
  "announcements",
  "events",
  "calendar",
  "departments",
  "pages",
  "posts",
  "media",
  "hero",
  "brand",
  "nav",
  "team",
]);

const CMS_COLLECTIONS = new Set([
  "pages",
  "posts",
  "media",
  "hero",
  "brand",
  "nav",
  "team",
  "settings",
  "departments",
]);

const COLLECTIONS = new Set([
  "grades", "attendance", "timetable", "classes", "assignments",
  "announcements", "fees", "children", "events", "jobs", "directory",
  "donations", "departments", "audit", "resources", "library",
  "admissions", "exams", "behavior", "lessonplans", "transport",
  "clinic", "calendar", "inventory", "staff", "scholarships",
  "settings", "pages", "posts", "media",
  "hero", "brand", "nav", "team",
]);

const CMS_WRITE_ROLES = ["superadmin", "admin"];
const STAFF_WRITE_ROLES = ["superadmin", "admin", "teacher"];

function guardCollection(col: string, res: Response): boolean {
  if (!COLLECTIONS.has(col)) {
    res.status(404).json({ error: `Unknown collection: ${col}` });
    return false;
  }
  return true;
}

function isAuthed(req: Request): boolean {
  const auth = req.headers["authorization"] ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return false;
  try {
    verifyToken(token);
    return true;
  } catch {
    return false;
  }
}

function ensureWriteAccess(col: string, req: Request, res: Response): boolean {
  const roles = CMS_COLLECTIONS.has(col) ? CMS_WRITE_ROLES : STAFF_WRITE_ROLES;
  const role = req.jwtPayload?.role;
  if (!role || !roles.includes(role)) {
    res.status(403).json({ error: "Forbidden — insufficient role" });
    return false;
  }
  return true;
}

router.get("/:collection", async (req, res, next) => {
  const col = String(req.params.collection);
  if (!guardCollection(col, res)) return;

  const serve = async () => {
    let rows = await dbStore.list(col);
    if (col === "pages" && !isAuthed(req)) {
      rows = rows.filter((p: any) => p?.status === "Published");
    }
    res.json(rows);
  };

  if (!PUBLIC_READ.has(col)) {
    requireAuth(req, res, serve);
    return;
  }
  await serve();
});

router.get("/:collection/:id", async (req, res) => {
  const col = String(req.params.collection);
  const id  = String(req.params.id);
  if (!guardCollection(col, res)) return;
  const serve = async () => {
    const item = await dbStore.get(col, id);
    if (!item) { res.status(404).json({ error: "Not found" }); return; }
    res.json(item);
  };
  if (!PUBLIC_READ.has(col)) {
    requireAuth(req, res, serve);
    return;
  }
  await serve();
});

router.post("/:collection", requireAuth, async (req, res) => {
  const col = String(req.params.collection);
  if (!guardCollection(col, res)) return;
  if (!ensureWriteAccess(col, req, res)) return;
  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({ error: "JSON body required" });
    return;
  }
  const item = await dbStore.create(col, req.body);
  res.status(201).json(item);
});

router.put("/:collection/:id", requireAuth, async (req, res) => {
  const col = String(req.params.collection);
  const id  = String(req.params.id);
  if (!guardCollection(col, res)) return;
  if (!ensureWriteAccess(col, req, res)) return;
  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({ error: "JSON body required" });
    return;
  }
  const item = await dbStore.upsert(col, id, req.body);
  res.json(item);
});

router.patch("/:collection/:id", requireAuth, async (req, res) => {
  const col = String(req.params.collection);
  const id  = String(req.params.id);
  if (!guardCollection(col, res)) return;
  if (!ensureWriteAccess(col, req, res)) return;
  const updated = await dbStore.update(col, id, req.body ?? {});
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/:collection/:id", requireAuth, async (req, res) => {
  const col = String(req.params.collection);
  const id  = String(req.params.id);
  if (!guardCollection(col, res)) return;
  if (!ensureWriteAccess(col, req, res)) return;
  const removed = await dbStore.remove(col, id);
  if (!removed) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ok: true });
});

export default router;
