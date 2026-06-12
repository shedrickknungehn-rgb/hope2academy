/**
 * Serverless entry point — exports the Express app without starting a server.
 * Used by Vercel serverless function (api/index.ts) and by the local dev server.
 *
 * Also seeds the database on first import (async, non-blocking).
 */
import app from "./app";
import { seedIfEmpty } from "./lib/seed.js";

// Seed in the background — safe to call multiple times (idempotent)
seedIfEmpty().catch((err) => {
  console.error("[serverless] Failed to seed database:", err);
});

export default app;
