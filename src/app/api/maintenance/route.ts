/**
 * ============================================================
 * HYPER TECH — Public Maintenance Submission (POST /api/maintenance)
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, readJson, serverError } from "@/lib/server/http";
import { toMaintenance } from "@/lib/server/serializers";
import { logAudit } from "@/lib/server/audit";
import { maintenanceSubmitSchema, zodMessage } from "@/lib/server/validators";
import { maintenanceRef, uid } from "@/lib/server/ids";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const parsed = maintenanceSubmitSchema.safeParse(body);
    if (!parsed.success) return badRequest("بيانات الطلب غير صالحة", zodMessage(parsed.error));

    const input = parsed.data;
    const count = await db.maintenanceRecord.count();
    const ref = maintenanceRef(count + 1);

    const row = await db.maintenanceRecord.create({
      data: {
        id: uid("mnt"),
        ref,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        deviceType: input.deviceType,
        deviceBrand: input.deviceBrand ?? null,
        deviceModel: input.deviceModel ?? null,
        problemCategory: input.problemCategory,
        problemDescription: input.problemDescription,
        additionalNotes: input.additionalNotes ?? null,
        status: "new",
      },
    });

    await logAudit("maintenance_created", "customer", { ref, deviceType: row.deviceType });
    return json({ request: toMaintenance(row) }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
