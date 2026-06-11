import app from "./app";
import { logger } from "./lib/logger";
import { seedIfEmpty } from "./lib/seed.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Bind address. Defaults to all interfaces (Replit dev). On the VPS, set
// HOST=127.0.0.1 so only the local Nginx reverse proxy can reach the server.
const host = process.env["HOST"] || "0.0.0.0";

app.listen(port, host, async () => {
  logger.info({ port, host }, "Server listening");

  try {
    await seedIfEmpty();
  } catch (seedErr) {
    logger.error({ err: seedErr }, "Failed to seed database");
  }
});
