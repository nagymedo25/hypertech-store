/**
 * ============================================================
 * HYPER TECH — Admin Category by id (PATCH / DELETE / reorder)
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, notFound, readJson, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { toCategory } from "@/lib/server/serializers";
import { logAudit } from "@/lib/server/audit";
import { categoryPatchSchema, zodMessage } from "@/lib/server/validators";
import { invalidateBootstrapCache } from "@/app/api/bootstrap/route";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const { id } = await ctx.params;
    const body = await readJson(req);

    /* Directional reorder (single swap, mirrors the UI arrows) */
    if (body && typeof body === "object" && "reorder" in body) {
      const direction = body.reorder === "up" ? "up" : body.reorder === "down" ? "down" : null;
      if (!direction) return badRequest("اتجاه غير صالح");

      const sorted = await db.category.findMany({ orderBy: { order: "asc" } });
      const idx = sorted.findIndex((c) => c.id === id);
      if (idx < 0) return notFound("القسم غير موجود");
      const swapWith = direction === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= sorted.length) return json({ categories: sorted.map(toCategory) });

      const reordered = [...sorted];
      [reordered[idx], reordered[swapWith]] = [reordered[swapWith], reordered[idx]];

      await db.$transaction(
        reordered.map((c, i) => db.category.update({ where: { id: c.id }, data: { order: i } }))
      );
      await logAudit("category_reordered", actor, { id, direction });
      invalidateBootstrapCache();

      const rows = await db.category.findMany({ orderBy: { order: "asc" } });
      return json({ categories: rows.map(toCategory) });
    }

    const parsed = categoryPatchSchema.safeParse(body);
    if (!parsed.success) return badRequest("بيانات التعديل غير صالحة", zodMessage(parsed.error));

    const input = parsed.data;
    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) return notFound("القسم غير موجود");

    const row = await db.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.tagline !== undefined ? { tagline: input.tagline } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.image !== undefined ? { image: input.image } : {}),
        ...(input.accent !== undefined ? { accent: input.accent } : {}),
        ...(input.icon !== undefined ? { icon: input.icon } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });

    await logAudit("category_updated", actor, { id, name: row.name, active: row.active });
    invalidateBootstrapCache();
    return json({ category: toCategory(row) });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const { id } = await ctx.params;
    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) return notFound("القسم غير موجود");

    await db.category.delete({ where: { id } });
    await logAudit("category_deleted", actor, { id, name: existing.name });
    invalidateBootstrapCache();
    return json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
