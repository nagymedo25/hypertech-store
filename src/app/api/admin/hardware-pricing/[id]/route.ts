/**
 * ============================================================
 * HYPER TECH — Admin Hardware Pricing by id (PUT / PATCH / DELETE)
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, notFound, readJson, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { toHardwareUpgradeRate } from "@/lib/server/serializers";
import { logAudit } from "@/lib/server/audit";
import { hardwareUpgradeRatePatchSchema, zodMessage } from "@/lib/server/validators";
import { invalidateBootstrapCache } from "@/app/api/bootstrap/route";

type Ctx = { params: Promise<{ id: string }> };

async function handleUpdate(req: Request, ctx: Ctx) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const { id } = await ctx.params;
    const body = await readJson(req);
    const parsed = hardwareUpgradeRatePatchSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("بيانات التعديل غير صالحة", zodMessage(parsed.error));
    }

    const existing = await db.hardwareUpgradeRate.findUnique({ where: { id } });
    if (!existing) return notFound("فئة الترقية غير موجودة");

    const input = parsed.data;
    const row = await db.hardwareUpgradeRate.update({
      where: { id },
      data: {
        ...(input.componentType !== undefined ? { componentType: input.componentType } : {}),
        ...(input.label !== undefined ? { label: input.label } : {}),
        ...(input.capacityGb !== undefined ? { capacityGb: input.capacityGb ?? null } : {}),
        ...(input.priceDelta !== undefined ? { priceDelta: input.priceDelta } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });

    await logAudit("hardware_rate_updated", actor, {
      id,
      label: row.label,
      componentType: row.componentType,
      priceDelta: row.priceDelta,
      active: row.active,
    });
    invalidateBootstrapCache();
    return json({ rate: toHardwareUpgradeRate(row) });
  } catch (err) {
    return serverError(err);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  return handleUpdate(req, ctx);
}

export async function PATCH(req: Request, ctx: Ctx) {
  return handleUpdate(req, ctx);
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const { id } = await ctx.params;
    const existing = await db.hardwareUpgradeRate.findUnique({ where: { id } });
    if (!existing) return notFound("فئة الترقية غير موجودة");

    await db.hardwareUpgradeRate.delete({ where: { id } });
    await logAudit("hardware_rate_deleted", actor, { id, label: existing.label });
    invalidateBootstrapCache();
    return json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
