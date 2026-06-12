import type { Request, Response, NextFunction } from "express";
import { verifyToken, extractRole, type JwtPayload } from "../lib/jwt.js";

declare global {
  namespace Express {
    interface Request {
      jwtPayload?: JwtPayload & { role: string };
    }
  }
}

/** Require a valid Supabase Bearer JWT. Attaches payload to req.jwtPayload. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers["authorization"] ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    res.status(401).json({ error: "Unauthorized — no token" });
    return;
  }
  try {
    const payload = verifyToken(token);
    req.jwtPayload = { ...payload, role: extractRole(payload) };
    next();
  } catch (err: any) {
    res.status(401).json({ error: err?.message ?? "Unauthorized" });
  }
}

/** Require one of the given roles after requireAuth has run. */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.jwtPayload) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!roles.includes(req.jwtPayload.role)) {
      res.status(403).json({ error: "Forbidden — insufficient role" });
      return;
    }
    next();
  };
}
