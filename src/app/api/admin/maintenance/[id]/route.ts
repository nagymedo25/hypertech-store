/**
 * ============================================================
 * HYPER TECH — Admin Maintenance by id (PATCH / DELETE)
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, notFound, readJson, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { toMaintenance } from "@/lib/server/serializers";
import { logAudit } from "@/lib/server/audit";
import { maintenancePatchSchema, zodMessage } from "@/lib/server/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const { id } = await ctx.params;
    const body = await readJson(req);
    const parsed = maintenancePatchSchema.safeParse(body);
    if (!parsed.success) return badRequest("بيانات التعديل غير صالحة", zodMessage(parsed.error));

    const existing = await db.maintenanceRecord.findUnique({ where: { id } });
    if (!existing) return notFound("الطلب غير موجود");

    const row = await db.maintenanceRecord.update({
      where: { id },
      data: {
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
        ...(parsed.data.adminNotes !== undefined ? { adminNotes: parsed.data.adminNotes ?? null } : {}),
      },
    });

    await logAudit("maintenance_updated", actor, { id, ref: row.ref, status: row.status });
    return json({ request: toMaintenance(row) });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const { id } = await ctx.params;
    const existing = await db.maintenanceRecord.findUnique({ where: { id } });
    if (!existing) return notFound("الطلب غير موجود");

    await db.maintenanceRecord.delete({ where: { id } });
    await logAudit("maintenance_deleted", actor, { id, ref: existing.ref });
    return json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
