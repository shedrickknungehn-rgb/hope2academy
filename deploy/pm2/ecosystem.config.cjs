/**
 * PM2 process definition for the HOPE2 ACADEMY API server.
 *
 * Start/reload with:   pm2 startOrReload deploy/pm2/ecosystem.config.cjs
 *
 * This file parses deploy/.env.production itself (instead of relying on a
 * specific PM2 version's env_file feature), so the API always boots with the
 * right configuration after reloads and reboots.
 */
const fs = require("node:fs");
const path = require("node:path");

// Repo root, derived from this file's location (deploy/pm2/ -> ../../).
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const ENV_FILE = path.join(__dirname, "..", ".env.production");

/** Minimal .env parser: KEY=VALUE per line, supports quotes, ignores # comments. */
function loadEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([\w.]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[m[1]] = val;
  }
  return out;
}

module.exports = {
  apps: [
    {
      name: "hope2-api",
      // cwd must be the api-server artifact so ./dist and node_modules
      // (including the externalized @google/genai) resolve correctly.
      cwd: path.join(REPO_ROOT, "artifacts", "api-server"),
      script: "dist/index.mjs",
      node_args: "--enable-source-maps",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      env: { NODE_ENV: "production", ...loadEnv(ENV_FILE) },
    },
  ],
};
