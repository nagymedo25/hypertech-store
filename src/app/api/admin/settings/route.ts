/**
 * ============================================================
 * HYPER TECH — Store Settings (GET / PUT)
 * ============================================================
 * GET is admin-only (contains business contact data); the
 * public storefront receives settings through /api/bootstrap.
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, readJson, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { toSettings } from "@/lib/server/serializers";
import { logAudit } from "@/lib/server/audit";
import { settingsPatchSchema, zodMessage } from "@/lib/server/validators";
import { invalidateBootstrapCache } from "@/app/api/bootstrap/route";

export async function GET(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const row = await db.storeSettings.findUnique({ where: { id: "singleton" } });
    if (!row) return json({ settings: null });
    return json({ settings: toSettings(row) });
  } catch (err) {
    return serverError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const body = await readJson(req);
    const parsed = settingsPatchSchema.safeParse(body);
    if (!parsed.success) return badRequest("بيانات الإعدادات غير صالحة", zodMessage(parsed.error));

    const input = parsed.data;
    const existing = await db.storeSettings.findUnique({ where: { id: "singleton" } });

    const data = {
      ...(input.storeName !== undefined ? { storeName: input.storeName } : {}),
      ...(input.tagline !== undefined ? { tagline: input.tagline } : {}),
      ...(input.whatsappNumber !== undefined ? { whatsappNumber: input.whatsappNumber } : {}),
      ...(input.whatsappDisplay !== undefined ? { whatsappDisplay: input.whatsappDisplay } : {}),
      ...(input.facebookUrl !== undefined ? { facebookUrl: input.facebookUrl } : {}),
      ...(input.tiktokUrl !== undefined ? { tiktokUrl: input.tiktokUrl } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.businessDescription !== undefined ? { businessDescription: input.businessDescription } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl ?? null } : {}),
      ...(input.showBuildsCategory !== undefined ? { showBuildsCategory: input.showBuildsCategory } : {}),
    };

    const row = existing
      ? await db.storeSettings.update({ where: { id: "singleton" }, data })
      : await db.storeSettings.create({ data: { id: "singleton", ...data } as never });

    await logAudit("settings_updated", actor, { fields: Object.keys(input) });
    invalidateBootstrapCache();
    return json({ settings: toSettings(row) });
  } catch (err) {
    return serverError(err);
  }
}
