/**
 * Vercel Serverless Function — wraps the Express app.
 * All /api/* requests are routed here by vercel.json.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../artifacts/api-server/src/app";

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}
