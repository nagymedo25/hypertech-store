/**
 * ============================================================
 * HYPER TECH — Audit Log (GET /api/admin/audit)
 * ============================================================
 */

import { db } from "@/lib/db";
import { json, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";

export async function GET(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const rows = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    return json({
      logs: rows.map((r) => ({
        id: r.id,
        action: r.action,
        actor: r.actor,
        details: r.details,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return serverError(err);
  }
}
