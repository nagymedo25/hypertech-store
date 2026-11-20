/**
 * ============================================================
 * HYPER TECH — Admin Hardware Pricing (GET list / POST create)
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, readJson, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { toHardwareUpgradeRate } from "@/lib/server/serializers";
import { logAudit } from "@/lib/server/audit";
import { hardwareUpgradeRateInputSchema, zodMessage } from "@/lib/server/validators";
import { uid } from "@/lib/server/ids";
import { invalidateBootstrapCache } from "@/app/api/bootstrap/route";

export async function GET(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const rows = await db.hardwareUpgradeRate.findMany({
      orderBy: [{ componentType: "asc" }, { order: "asc" }, { capacityGb: "asc" }],
    });
    return json({ hardwareUpgradeRates: rows.map(toHardwareUpgradeRate) });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const body = await readJson(req);
    const parsed = hardwareUpgradeRateInputSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("بيانات فئة الترقية غير صالحة", zodMessage(parsed.error));
    }

    const input = parsed.data;

    // Default order to next available if not explicitly provided
    let orderNum = input.order;
    if (orderNum === 0) {
      const maxOrder = await db.hardwareUpgradeRate.aggregate({
        where: { componentType: input.componentType },
        _max: { order: true },
      });
      orderNum = (maxOrder._max.order ?? -1) + 1;
    }

    const row = await db.hardwareUpgradeRate.create({
      data: {
        id: uid("hur"),
        componentType: input.componentType,
        label: input.label,
        capacityGb: input.capacityGb ?? null,
        priceDelta: input.priceDelta,
        order: orderNum,
        active: input.active,
      },
    });

    await logAudit("hardware_rate_created", actor, {
      id: row.id,
      label: row.label,
      componentType: row.componentType,
      priceDelta: row.priceDelta,
    });
    invalidateBootstrapCache();
    return json({ rate: toHardwareUpgradeRate(row) }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
