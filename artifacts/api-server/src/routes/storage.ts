/**
 * Storage routes — Supabase Storage for uploads + public object serving.
 *
 * POST /storage/upload     — (admin/superadmin) multipart upload (field "file").
 *                            Uploads to Supabase Storage bucket "hope2-media",
 *                            returns { objectPath } where objectPath = "/objects/<id>".
 * GET  /storage/objects/*  — redirect to the Supabase public URL.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router: IRouter = Router();

const SUPABASE_URL = process.env["VITE_SUPABASE_URL"] ?? process.env["SUPABASE_URL"] ?? "";
const SERVICE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
const BUCKET = "hope2-media";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 15 * 1024 * 1024);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

/** Upload a file. CMS writers (admin/superadmin) only. Returns the stable objectPath. */
router.post(
  "/storage/upload",
  requireAuth,
  requireRole("superadmin", "admin"),
  (req: Request, res: Response) => {
    upload.single("file")(req, res, async (err: unknown) => {
      if (err) {
        const isLimit = (err as { code?: string })?.code === "LIMIT_FILE_SIZE";
        res
          .status(isLimit ? 413 : 400)
          .json({ error: isLimit ? "File too large" : "Upload failed" });
        return;
      }
      const file = (req as Request & { file?: Express.Multer.File }).file;
      if (!file) {
        res.status(400).json({ error: "No file provided (use form field 'file')" });
        return;
      }
      const ext = path.extname(file.originalname || "").toLowerCase();
      const safeExt = /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : "";
      const objectId = `${randomUUID()}${safeExt}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(objectId, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        req.log?.error?.({ err: uploadError }, "Supabase upload failed");
        res.status(500).json({ error: "Upload to storage failed" });
        return;
      }

      res.json({ objectPath: `/objects/${objectId}` });
    });
  },
);

/** Redirect to the Supabase public URL for an uploaded object. */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  const raw = (req.params as Record<string, unknown>).path;
  const wildcardPath = Array.isArray(raw) ? raw.join("/") : String(raw);
  const objectId = wildcardPath.replace(/^\/+/, "");

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectId);
  if (!data?.publicUrl) {
    res.status(404).json({ error: "Object not found" });
    return;
  }
  res.redirect(302, data.publicUrl);
});

export default router;
