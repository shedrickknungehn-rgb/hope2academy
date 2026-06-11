/**
 * Storage routes — local-disk uploads + public object serving.
 *
 * POST /storage/upload     — (admin/superadmin) multipart upload (field "file").
 *                            Saves to UPLOAD_DIR, returns { objectPath }.
 * GET  /storage/objects/*  — serve an uploaded object (public read; website media).
 *
 * Uploaded media is referenced everywhere by its objectPath ("/objects/<id>").
 * The public website renders it as `${API_BASE}/storage${objectPath}`.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import {
  UPLOAD_DIR,
  ensureUploadDir,
  newObjectId,
  openObject,
  ObjectNotFoundError,
} from "../lib/fileStorage.js";

const router: IRouter = Router();

// Create the upload directory eagerly so serving works even before first upload.
void ensureUploadDir();

const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 15 * 1024 * 1024);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureUploadDir()
        .then(() => cb(null, UPLOAD_DIR))
        .catch((err) => cb(err as Error, UPLOAD_DIR));
    },
    filename: (_req, file, cb) => {
      cb(null, newObjectId(file.originalname));
    },
  }),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

/** Upload a file. CMS writers (admin/superadmin) only. Returns the stable objectPath. */
router.post(
  "/storage/upload",
  requireAuth,
  requireRole("superadmin", "admin"),
  (req: Request, res: Response) => {
    upload.single("file")(req, res, (err: unknown) => {
      if (err) {
        const isLimit = (err as { code?: string })?.code === "LIMIT_FILE_SIZE";
        req.log.error({ err }, "Upload failed");
        res
          .status(isLimit ? 413 : 400)
          .json({ error: isLimit ? "File too large" : "Upload failed" });
        return;
      }
      const file = (req as Request & { file?: { filename: string } }).file;
      if (!file) {
        res.status(400).json({ error: "No file provided (use form field 'file')" });
        return;
      }
      res.json({ objectPath: `/objects/${file.filename}` });
    });
  },
);

/** Serve uploaded object entities (public read — these are website images). */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = (req.params as Record<string, unknown>).path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : String(raw);
    const obj = await openObject(`/objects/${wildcardPath}`);
    res.setHeader("Content-Type", obj.contentType);
    res.setHeader("Content-Length", String(obj.size));
    res.setHeader("Cache-Control", "public, max-age=3600");
    obj.stream.on("error", () => {
      if (!res.headersSent) res.status(500).end();
    });
    obj.stream.pipe(res);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
