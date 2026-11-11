/**
 * ============================================================
 * HYPER TECH — Admin Logout (POST /api/admin/logout)
 * ============================================================
 */

import { json } from "@/lib/server/http";
import { clearSessionCookieHeader, readSessionCookie, verifySessionToken } from "@/lib/server/auth";
import { logAudit } from "@/lib/server/audit";

export async function POST(req: Request) {
  const username = verifySessionToken(readSessionCookie(req));
  if (username) await logAudit("logout", username);
  return json(
    { ok: true },
    { headers: { "set-cookie": clearSessionCookieHeader() } }
  );
}
