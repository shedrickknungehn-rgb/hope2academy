/**
 * JWT verification using Supabase's JWT secret (HS256).
 * Supabase issues HS256 tokens signed with the project's JWT secret.
 */
import crypto from "crypto";

const SUPABASE_JWT_SECRET = process.env["SUPABASE_JWT_SECRET"];

if (!SUPABASE_JWT_SECRET) {
  throw new Error("SUPABASE_JWT_SECRET must be set.");
}

export interface JwtPayload {
  sub: string;
  email?: string;
  role: string;
  app_metadata?: { role?: string };
  user_metadata?: { role?: string; name?: string };
  iat: number;
  exp: number;
}

function b64urlDecode(str: string): string {
  const pad = str.length % 4 === 0 ? 0 : 4 - (str.length % 4);
  return Buffer.from(str + "=".repeat(pad), "base64url").toString("utf8");
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

export function verifyToken(token: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");
  const [header, body, sig] = parts;
  const expected = b64url(
    crypto
      .createHmac("sha256", SUPABASE_JWT_SECRET!)
      .update(`${header}.${body}`)
      .digest(),
  );
  if (sig !== expected) throw new Error("Invalid signature");
  const payload = JSON.parse(b64urlDecode(body)) as JwtPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error("Token expired");
  return payload;
}

/**
 * Extract the app role from a Supabase JWT.
 * Role is stored in app_metadata.role (set via service-role API or Auth hook).
 * Falls back to user_metadata.role, then the raw `role` claim.
 */
export function extractRole(payload: JwtPayload): string {
  return (
    payload.app_metadata?.role ??
    payload.user_metadata?.role ??
    payload.role ??
    "student"
  );
}
