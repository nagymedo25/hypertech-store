/**
 * ============================================================
 * HYPER TECH — Admin PC Build by id (PATCH / DELETE)
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, notFound, readJson, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { toBuild } from "@/lib/server/serializers";
import { logAudit } from "@/lib/server/audit";
import { buildPatchSchema, zodMessage } from "@/lib/server/validators";
import { invalidateBootstrapCache } from "@/app/api/bootstrap/route";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const { id } = await ctx.params;
    const body = await readJson(req);
    const parsed = buildPatchSchema.safeParse(body);
    if (!parsed.success) return badRequest("بيانات التعديل غير صالحة", zodMessage(parsed.error));

    const input = parsed.data;
    const existing = await db.pCBuild.findUnique({ where: { id } });
    if (!existing) return notFound("التجميعة غير موجودة");

    const row = await db.pCBuild.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.images !== undefined ? { images: input.images } : {}),
        ...(input.components !== undefined ? { components: input.components } : {}),
        ...(input.totalPrice !== undefined ? { totalPrice: input.totalPrice } : {}),
        ...(input.availability !== undefined ? { availability: input.availability } : {}),
        ...(input.performance !== undefined ? { performance: input.performance } : {}),
        ...(input.featured !== undefined ? { featured: input.featured } : {}),
      },
    });

    await logAudit("build_updated", actor, { id, title: row.title });
    invalidateBootstrapCache();
    return json({ build: toBuild(row) });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const { id } = await ctx.params;
    const existing = await db.pCBuild.findUnique({ where: { id } });
    if (!existing) return notFound("التجميعة غير موجودة");

    await db.pCBuild.delete({ where: { id } });
    await logAudit("build_deleted", actor, { id, title: existing.title });
    invalidateBootstrapCache();
    return json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
