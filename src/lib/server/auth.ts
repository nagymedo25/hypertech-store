/**
 * ============================================================
 * HYPER TECH — Admin Authentication (server-only)
 * ============================================================
 * Production-grade credentials layer:
 *   • scrypt password hashing (Node crypto, no native deps)
 *   • HMAC-SHA256 signed, HTTP-only session cookies
 *   • login rate limiting (per IP + per username)
 *   • provisioning of the initial administrator from env vars
 * ============================================================
 */

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { getClientIp } from "@/lib/server/http";

/* ------------------------- Configuration ------------------------- */

export const SESSION_COOKIE = "ht_admin_session";
const SESSION_TTL_SEC = 60 * 60 * 8; // 8 hours

function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    // Deterministic dev fallback — never used when SESSION_SECRET is set
    console.warn("[auth] SESSION_SECRET missing — using derived dev secret");
    return createHmac("sha256", "hyper-tech-dev-secret").update("dev").digest("hex");
  }
  return s;
}

/* ------------------------- Password hashing ------------------------- */

/** scrypt hash → "scrypt$<saltHex>$<hashHex>" */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, saltHex, hashHex] = stored.split("$");
    if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(password, salt, 64);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

/* ------------------------- Session tokens ------------------------- */

interface SessionPayload {
  u: string; // username
  exp: number; // epoch seconds
}

const b64u = (buf: Buffer) => buf.toString("base64url");
const unb64u = (s: string) => Buffer.from(s, "base64url");

function sign(data: string): string {
  return createHmac("sha256", sessionSecret()).update(data).digest("base64url");
}

/** Create a signed session token (payload.signature). */
export function createSessionToken(username: string): string {
  const payload = b64u(
    Buffer.from(JSON.stringify({ u: username, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SEC }))
  );
  return `${payload}.${sign(payload)}`;
}

/** Verify a signed session token → username | null. */
export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(unb64u(payload).toString()) as SessionPayload;
    if (typeof data.u !== "string" || typeof data.exp !== "number") return null;
    if (data.exp * 1000 < Date.now()) return null;
    return data.u;
  } catch {
    return null;
  }
}

/* ------------------------- Cookie helpers ------------------------- */

export function sessionCookieHeader(token: string): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL_SEC}`,
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/** Extract the session cookie value from a Request's Cookie header. */
export function readSessionCookie(req: Request): string | undefined {
  const raw = req.headers.get("cookie");
  if (!raw) return undefined;
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === SESSION_COOKIE) return rest.join("=");
  }
  return undefined;
}

/** Route guard: returns the authenticated admin username or null. */
export async function requireAdmin(req: Request): Promise<string | null> {
  const username = verifySessionToken(readSessionCookie(req));
  if (!username) return null;
  // Confirm the account still exists (deactivated/removed admins die with their sessions)
  const admin = await db.adminUser.findUnique({ where: { username } });
  return admin ? username : null;
}

/* ------------------------- Rate limiting ------------------------- */

interface Attempt {
  count: number;
  firstAt: number;
  blockedUntil: number;
}

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 10 * 60 * 1000;

const attempts = new Map<string, Attempt>();

/** Returns seconds to wait before retrying, or 0 when allowed. */
export function loginRateLimit(req: Request, username: string): number {
  const key = `${getClientIp(req)}|${username.toLowerCase()}`;
  const now = Date.now();
  const a = attempts.get(key);

  if (a && a.blockedUntil > now) {
    return Math.ceil((a.blockedUntil - now) / 1000);
  }
  if (!a || now - a.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 0, firstAt: now, blockedUntil: 0 });
    return 0;
  }
  return 0;
}

/** Record a failed attempt; returns seconds blocked after this failure. */
export function recordLoginFailure(req: Request, username: string): number {
  const key = `${getClientIp(req)}|${username.toLowerCase()}`;
  const now = Date.now();
  const a = attempts.get(key) ?? { count: 0, firstAt: now, blockedUntil: 0 };
  if (now - a.firstAt > WINDOW_MS) {
    a.count = 0;
    a.firstAt = now;
  }
  a.count += 1;
  if (a.count >= MAX_ATTEMPTS) {
    a.blockedUntil = now + BLOCK_MS;
  }
  attempts.set(key, a);
  return a.blockedUntil > now ? Math.ceil((a.blockedUntil - now) / 1000) : 0;
}

export function clearLoginFailures(req: Request, username: string): void {
  attempts.delete(`${getClientIp(req)}|${username.toLowerCase()}`);
}

/* ------------------------- Initial provisioning ------------------------- */

/**
 * Ensure the initial administrator exists (idempotent).
 * Credentials come exclusively from environment variables —
 * never from source code.
 */
export async function ensureInitialAdmin(): Promise<void> {
  const username = process.env.ADMIN_INITIAL_USERNAME?.trim();
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!username || !password || password.length < 8) return;

  const existing = await db.adminUser.findUnique({ where: { username } });
  if (existing) return;

  await db.adminUser.create({
    data: { username, passwordHash: hashPassword(password), role: "admin" },
  });
  console.log(`[auth] initial administrator provisioned: ${username}`);
}

/**
 * Boot-time provisioning gate — run once per server process.
 * Uses an in-memory flag + a DB-level existence check so multiple
 * workers don't race.
 */
let provisioned = false;
export async function ensureAuthBooted(): Promise<void> {
  if (provisioned) return;
  provisioned = true;
  try {
    await ensureInitialAdmin();
  } catch (err) {
    provisioned = false;
    console.error("[auth] provisioning failed:", err);
  }
}
