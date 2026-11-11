/**
 * ============================================================
 * HYPER TECH — Admin Product by id (PATCH / DELETE)
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, notFound, readJson, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { toProduct } from "@/lib/server/serializers";
import { logAudit } from "@/lib/server/audit";
import { productPatchSchema, zodMessage } from "@/lib/server/validators";
import { invalidateBootstrapCache } from "@/app/api/bootstrap/route";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const { id } = await ctx.params;
    const body = await readJson(req);
    const parsed = productPatchSchema.safeParse(body);
    if (!parsed.success) return badRequest("بيانات التعديل غير صالحة", zodMessage(parsed.error));

    const input = parsed.data;
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) return notFound("المنتج غير موجود");

    const row = await db.product.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.brand !== undefined ? { brand: input.brand } : {}),
        ...(input.shortDescription !== undefined ? { shortDescription: input.shortDescription } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.oldPrice !== undefined ? { oldPrice: input.oldPrice ?? null } : {}),
        ...(input.promotionalLabel !== undefined ? { promotionalLabel: input.promotionalLabel ?? null } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.images !== undefined ? { images: input.images } : {}),
        ...(input.availability !== undefined ? { availability: input.availability } : {}),
        ...(input.stockQty !== undefined ? { stockQty: input.stockQty } : {}),
        ...(input.featured !== undefined ? { featured: input.featured } : {}),
        ...(input.isNew !== undefined ? { isNew: input.isNew } : {}),
        ...(input.rating !== undefined ? { rating: input.rating } : {}),
        ...(input.specs !== undefined ? { specs: input.specs } : {}),
        ...(input.specLayout !== undefined ? { specLayout: input.specLayout } : {}),
        ...(input.heroEligible !== undefined ? { heroEligible: input.heroEligible } : {}),
      },
    });

    await logAudit("product_updated", actor, { id, name: row.name });
    invalidateBootstrapCache();
    return json({ product: toProduct(row) });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const { id } = await ctx.params;
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) return notFound("المنتج غير موجود");

    await db.product.delete({ where: { id } });
    await logAudit("product_deleted", actor, { id, name: existing.name });
    invalidateBootstrapCache();
    return json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
