/**
 * ============================================================
 * HYPER TECH — Admin Orders (GET list)
 * ============================================================
 */

import { db } from "@/lib/db";
import { json, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { toOrder } from "@/lib/server/serializers";

export async function GET(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const rows = await db.orderRecord.findMany({ orderBy: { createdAt: "desc" } });
    return json({ orders: rows.map(toOrder) });
  } catch (err) {
    return serverError(err);
  }
}
