/**
 * Minimal JWT — HS256 via Node built-in crypto. No external deps.
 */
import crypto from "crypto";

const DEV_FALLBACK_SECRET = "hope2-dev-secret-change-in-prod";
const SECRET = process.env["JWT_SECRET"] ?? DEV_FALLBACK_SECRET;

// Never sign tokens with the public dev secret in production — fail fast at boot
// so a misconfigured env can't silently allow forged admin tokens.
if (
  process.env.NODE_ENV === "production" &&
  (!process.env["JWT_SECRET"] || SECRET === DEV_FALLBACK_SECRET)
) {
  throw new Error(
    "JWT_SECRET must be set to a strong, non-default value in production. " +
      "Generate one with: openssl rand -hex 32",
  );
}

function b64url(buf: Buffer | string): string {
  const b64 = Buffer.isBuffer(buf)
    ? buf.toString("base64")
    : Buffer.from(buf).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): string {
  const pad = str.length % 4 === 0 ? 0 : 4 - (str.length % 4);
  return Buffer.from(str + "=".repeat(pad), "base64").toString("utf8");
}

export interface JwtPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}

export function signToken(
  payload: Omit<JwtPayload, "iat" | "exp">,
  expiresInSeconds = 60 * 60 * 24 * 7,
): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const body = b64url(
    JSON.stringify({ ...payload, iat: now, exp: now + expiresInSeconds }),
  );
  const sig = b64url(
    crypto.createHmac("sha256", SECRET).update(`${header}.${body}`).digest(),
  );
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");
  const [header, body, sig] = parts;
  const expected = b64url(
    crypto.createHmac("sha256", SECRET).update(`${header}.${body}`).digest(),
  );
  if (sig !== expected) throw new Error("Invalid signature");
  const payload = JSON.parse(b64urlDecode(body)) as JwtPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error("Token expired");
  return payload;
}
