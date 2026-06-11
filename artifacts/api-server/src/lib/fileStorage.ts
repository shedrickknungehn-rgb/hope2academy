/**
 * fileStorage.ts — local-disk media storage (self-hosted, no cloud dependency).
 *
 * Files are written to UPLOAD_DIR and referenced everywhere by a stable
 * objectPath ("/objects/<id>"). The public website renders them via
 * `${API_BASE}/storage/objects/<id>` (see routes/storage.ts).
 *
 * UPLOAD_DIR defaults to "<cwd>/uploads" (works in Replit dev) and should be set
 * to a persistent path on the VPS (e.g. /var/lib/hope2-academy/uploads).
 */
import { randomUUID } from "node:crypto";
import { createReadStream, type ReadStream } from "node:fs";
import { mkdir, stat, open } from "node:fs/promises";
import path from "node:path";

export const UPLOAD_DIR: string = path.resolve(
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"),
);

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".txt": "text/plain",
  ".json": "application/json",
};

/** Create UPLOAD_DIR if it does not exist yet. Safe to call repeatedly. */
export async function ensureUploadDir(): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

/** A freshly generated, single-segment object id (uuid + original extension). */
export function newObjectId(originalName: string): string {
  const ext = path.extname(originalName || "").toLowerCase();
  const safeExt = /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : "";
  return `${randomUUID()}${safeExt}`;
}

/**
 * Resolve "/objects/<id>" (or legacy "/objects/uploads/<id>") to an absolute,
 * traversal-safe path inside UPLOAD_DIR. Throws ObjectNotFoundError otherwise.
 */
export function resolveObjectPath(objectPath: string): string {
  if (!objectPath.startsWith("/objects/")) throw new ObjectNotFoundError();
  const rel = objectPath.slice("/objects/".length);
  if (!rel) throw new ObjectNotFoundError();
  const base = path.resolve(UPLOAD_DIR);
  const full = path.resolve(base, rel);
  if (full !== base && !full.startsWith(base + path.sep)) {
    throw new ObjectNotFoundError(); // path-traversal attempt
  }
  return full;
}

function contentTypeForExt(filename: string): string | null {
  const ext = path.extname(filename).toLowerCase();
  return MIME_BY_EXT[ext] ?? null;
}

/**
 * Sniff a content-type from the first bytes — used for legacy extension-less
 * objects migrated from Replit Object Storage.
 */
async function sniffContentType(filePath: string): Promise<string> {
  try {
    const fh = await open(filePath, "r");
    try {
      const buf = Buffer.alloc(12);
      const { bytesRead } = await fh.read(buf, 0, 12, 0);
      const b = buf.subarray(0, bytesRead);
      if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
      if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
      if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
      if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "application/pdf";
      if (
        b.subarray(0, 4).toString("ascii") === "RIFF" &&
        b.subarray(8, 12).toString("ascii") === "WEBP"
      ) {
        return "image/webp";
      }
    } finally {
      await fh.close();
    }
  } catch {
    /* fall through to default */
  }
  return "application/octet-stream";
}

export interface ServableObject {
  stream: ReadStream;
  contentType: string;
  size: number;
}

/** Open an object for serving. Throws ObjectNotFoundError if missing. */
export async function openObject(objectPath: string): Promise<ServableObject> {
  const full = resolveObjectPath(objectPath);
  let info;
  try {
    info = await stat(full);
  } catch {
    throw new ObjectNotFoundError();
  }
  if (!info.isFile()) throw new ObjectNotFoundError();
  const contentType = contentTypeForExt(full) ?? (await sniffContentType(full));
  return { stream: createReadStream(full), contentType, size: info.size };
}
