/**
 * ============================================================
 * HYPER TECH — Admin Categories (GET / POST / PATCH reorder)
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, readJson, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { toCategory } from "@/lib/server/serializers";
import { logAudit } from "@/lib/server/audit";
import { categoryInputSchema, zodMessage } from "@/lib/server/validators";
import { slugify, uid } from "@/lib/server/ids";
import { invalidateBootstrapCache } from "@/app/api/bootstrap/route";

export async function GET(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const rows = await db.category.findMany({ orderBy: { order: "asc" } });
    return json({ categories: rows.map(toCategory) });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const body = await readJson(req);
    const parsed = categoryInputSchema.safeParse(body);
    if (!parsed.success) return badRequest("بيانات القسم غير مكتملة", zodMessage(parsed.error));

    const input = parsed.data;
    const maxOrder = await db.category.aggregate({ _max: { order: true } });

    const row = await db.category.create({
      data: {
        id: uid("cat"),
        slug: input.slug?.trim() ? slugify(input.slug) : `${slugify(input.name)}-${Math.random().toString(36).slice(2, 5)}`,
        name: input.name,
        tagline: input.tagline,
        description: input.description,
        image: input.image,
        accent: input.accent,
        icon: input.icon,
        order: input.order ?? (maxOrder._max.order ?? -1) + 1,
        active: input.active ?? true,
      },
    });

    await logAudit("category_created", actor, { id: row.id, name: row.name });
    invalidateBootstrapCache();
    return json({ category: toCategory(row) }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}

/** Bulk reorder: { order: string[] } — array of category ids in the desired order. */
export async function PUT(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const body = await readJson(req);
    const ids = body?.order;
    if (!Array.isArray(ids) || ids.some((x) => typeof x !== "string") || ids.length > 50) {
      return badRequest("ترتيب غير صالح");
    }

    await db.$transaction(
      ids.map((id, i) =>
        db.category.update({ where: { id: id as string }, data: { order: i } })
      )
    );
    await logAudit("categories_reordered", actor, { count: ids.length });
    invalidateBootstrapCache();

    const rows = await db.category.findMany({ orderBy: { order: "asc" } });
    return json({ categories: rows.map(toCategory) });
  } catch (err) {
    return serverError(err);
  }
}
