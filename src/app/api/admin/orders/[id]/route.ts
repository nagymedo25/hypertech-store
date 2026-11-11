/**
 * ============================================================
 * HYPER TECH — Admin Order by id (PATCH status/notes / DELETE)
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, notFound, readJson, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { toOrder } from "@/lib/server/serializers";
import { logAudit } from "@/lib/server/audit";
import { orderPatchSchema, zodMessage } from "@/lib/server/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const { id } = await ctx.params;
    const body = await readJson(req);
    const parsed = orderPatchSchema.safeParse(body);
    if (!parsed.success) return badRequest("بيانات التعديل غير صالحة", zodMessage(parsed.error));

    const existing = await db.orderRecord.findUnique({ where: { id } });
    if (!existing) return notFound("الطلب غير موجود");

    const row = await db.orderRecord.update({
      where: { id },
      data: {
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes ?? null } : {}),
      },
    });

    await logAudit("order_updated", actor, { id, ref: row.ref, status: row.status });
    return json({ order: toOrder(row) });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const { id } = await ctx.params;
    const existing = await db.orderRecord.findUnique({ where: { id } });
    if (!existing) return notFound("الطلب غير موجود");

    await db.orderRecord.delete({ where: { id } });
    await logAudit("order_deleted", actor, { id, ref: existing.ref });
    return json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
