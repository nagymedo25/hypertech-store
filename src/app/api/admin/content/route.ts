/**
 * ============================================================
 * HYPER TECH — Site Content Management (GET / PUT)
 * ============================================================
 * Controls dynamic CMS content for the storefront (Hero,
 * Bestsellers, Categories, Trust & Services, Footer).
 * Updates invalidate the public /api/bootstrap cache.
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, readJson, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { toSiteContent } from "@/lib/server/serializers";
import { logAudit } from "@/lib/server/audit";
import { invalidateBootstrapCache } from "@/app/api/bootstrap/route";

export async function GET(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    let row = await db.siteContent.findUnique({ where: { id: "singleton" } });
    if (!row) {
      row = await db.siteContent.create({
        data: {
          id: "singleton",
          data: {},
        },
      });
    }

    return json({ content: toSiteContent(row) });
  } catch (err) {
    return serverError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      return badRequest("بيانات المحتوى غير صالحة");
    }

    // Body may contain { data: Record<string, any> } or be the data record directly
    const incomingData = "data" in body && typeof body.data === "object" && body.data !== null
      ? body.data
      : body;

    const existing = await db.siteContent.findUnique({ where: { id: "singleton" } });
    const currentData = existing && typeof existing.data === "object" && existing.data !== null && !Array.isArray(existing.data)
      ? (existing.data as Record<string, any>)
      : {};

    const mergedData = {
      ...currentData,
      ...incomingData,
    };

    const updated = await db.siteContent.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        data: mergedData,
      },
      update: {
        data: mergedData,
      },
    });

    await logAudit("content_updated", actor, { sections: Object.keys(incomingData) });
    invalidateBootstrapCache();

    return json({ content: toSiteContent(updated) });
  } catch (err) {
    return serverError(err);
  }
}
