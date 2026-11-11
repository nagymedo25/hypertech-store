/**
 * ============================================================
 * HYPER TECH — Admin PC Builds (GET / POST)
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, readJson, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { toBuild } from "@/lib/server/serializers";
import { logAudit } from "@/lib/server/audit";
import { buildInputSchema, zodMessage } from "@/lib/server/validators";
import { slugify, uid } from "@/lib/server/ids";
import { invalidateBootstrapCache } from "@/app/api/bootstrap/route";

export async function GET(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const rows = await db.pCBuild.findMany({ orderBy: { createdAt: "desc" } });
    return json({ builds: rows.map(toBuild) });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const body = await readJson(req);
    const parsed = buildInputSchema.safeParse(body);
    if (!parsed.success) return badRequest("بيانات التجميعة غير مكتملة", zodMessage(parsed.error));

    const input = parsed.data;
    const row = await db.pCBuild.create({
      data: {
        id: uid("bld"),
        slug: `${slugify(input.title)}-${Math.random().toString(36).slice(2, 5)}`,
        title: input.title,
        type: input.type,
        description: input.description,
        images: input.images,
        components: input.components,
        totalPrice: input.totalPrice,
        availability: input.availability,
        performance: input.performance,
        featured: input.featured,
      },
    });

    await logAudit("build_created", actor, { id: row.id, title: row.title });
    invalidateBootstrapCache();
    return json({ build: toBuild(row) }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
