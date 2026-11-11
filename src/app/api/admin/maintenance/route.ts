/**
 * ============================================================
 * HYPER TECH — Admin Maintenance Requests (GET list)
 * ============================================================
 */

import { db } from "@/lib/db";
import { json, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { toMaintenance } from "@/lib/server/serializers";

export async function GET(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const rows = await db.maintenanceRecord.findMany({ orderBy: { createdAt: "desc" } });
    return json({ requests: rows.map(toMaintenance) });
  } catch (err) {
    return serverError(err);
  }
}
