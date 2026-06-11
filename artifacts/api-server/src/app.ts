import express, { type Express } from "express";
import cors, { type CorsOptions } from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// We run behind a single reverse proxy (Nginx) in production, so trust the first
// proxy hop. This makes req.ip and express-rate-limit see the real client IP via
// X-Forwarded-For. Harmless for direct-access dev.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// CORS: when the frontend and API share one domain (frontend at "/", API at
// "/api"), requests are same-origin and CORS never triggers. When the API is
// hosted on a different origin, pin allowed origins via CORS_ORIGIN
// (comma-separated). Unset => reflect any origin (dev convenience).
const corsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const corsOptions: CorsOptions =
  corsOrigins.length > 0 ? { origin: corsOrigins } : {};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount at /api for direct/same-origin access (VPS Nginx, dev curl, mobile app)
app.use("/api", router);
// Mount at /api-server/api for the Replit dev proxy's path-based routing
app.use("/api-server/api", router);

export default app;
