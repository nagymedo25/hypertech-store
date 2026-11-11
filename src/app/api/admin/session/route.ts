/**
 * ============================================================
 * HYPER TECH — Admin Session Check (GET /api/admin/session)
 * ============================================================
 */

import { json } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";

export async function GET(req: Request) {
  const username = await requireAdmin(req);
  return json({ authed: Boolean(username), username });
}
