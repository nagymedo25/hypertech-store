/**
 * ============================================================
 * HYPER TECH — Admin Products (GET list / POST create)
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, readJson, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { toProduct } from "@/lib/server/serializers";
import { logAudit } from "@/lib/server/audit";
import { productInputSchema, zodMessage } from "@/lib/server/validators";
import { slugify, uid } from "@/lib/server/ids";
import { invalidateBootstrapCache } from "@/app/api/bootstrap/route";

export async function GET(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const rows = await db.product.findMany({ orderBy: { createdAt: "desc" } });
    return json({ products: rows.map(toProduct) });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const body = await readJson(req);
    const parsed = productInputSchema.safeParse(body);
    if (!parsed.success) return badRequest("بيانات المنتج غير مكتملة", zodMessage(parsed.error));

    const input = parsed.data;
    const row = await db.product.create({
      data: {
        id: uid("prd"),
        slug: `${slugify(input.name)}-${Math.random().toString(36).slice(2, 6)}`,
        name: input.name,
        brand: input.brand,
        shortDescription: input.shortDescription,
        description: input.description,
        price: input.price,
        oldPrice: input.oldPrice ?? null,
        promotionalLabel: input.promotionalLabel ?? null,
        categoryId: input.categoryId,
        images: input.images,
        availability: input.availability,
        stockQty: input.stockQty,
        featured: input.featured,
        isNew: input.isNew,
        rating: input.rating,
        specs: input.specs,
        specLayout: input.specLayout,
        heroEligible: input.heroEligible,
      },
    });

    await logAudit("product_created", actor, { id: row.id, name: row.name });
    invalidateBootstrapCache();
    return json({ product: toProduct(row) }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
