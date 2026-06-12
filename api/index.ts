/**
 * Vercel Serverless Function — wraps the Express app.
 * All /api/* requests are routed here by vercel.json.
 *
 * This imports the pre-built ESM bundle (serverless.mjs) so Vercel doesn't
 * need to compile the workspace monorepo with TypeScript path aliases.
 */
import type { IncomingMessage, ServerResponse } from "http";

const serverlessPromise = import("./serverless.mjs");

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const { default: app } = await serverlessPromise;
  return (app as any)(req, res);
}
