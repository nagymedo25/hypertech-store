/**
 * ============================================================
 * HYPER TECH — Safe Store Reset (POST /api/admin/reset)
 * ============================================================
 * Destructive operation guarded by LAYERS:
 *   1. Admin session required.
 *   2. An explicit confirmation phrase ("RESET-STORE") required.
 *   3. A VERIFIED successful backup must exist AND its Cloudinary
 *      file must be reachable (server-side HEAD check) — reset is
 *      impossible without a real, downloadable archive.
 *   4. Transactional wipe of operational tables ONLY:
 *      products, categories, builds, orders, maintenance.
 *      Preserved: admin accounts, backup records, audit log,
 *      store settings (essential configuration).
 *   5. Double execution prevented: while a reset runs, the
 *      in-process lock rejects concurrent attempts.
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, readJson, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { logAudit } from "@/lib/server/audit";
import { invalidateBootstrapCache } from "@/app/api/bootstrap/route";

const CONFIRM_PHRASE = "RESET-STORE";
let resetting = false;

async function backupVerified(): Promise<{ ok: boolean; reason?: string; backupId?: string }> {
  const latest = await db.backupRecord.findFirst({
    where: { status: "success" },
    orderBy: { createdAt: "desc" },
  });
  if (!latest) return { ok: false, reason: "لا توجد نسخة احتياطية ناجحة" };
  if (!latest.fileUrl) return { ok: false, reason: "النسخة الاحتياطية بدون ملف" };

  /* Live reachability check of the archived PDF (5s budget) */
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(latest.fileUrl, { method: "HEAD", signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return { ok: false, reason: "ملف النسخة الاحتياطية غير متاح للتحميل" };
  } catch {
    return { ok: false, reason: "تعذر التحقق من ملف النسخة الاحتياطية" };
  }

  return { ok: true, backupId: latest.id };
}

export async function POST(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    if (resetting) return badRequest("عملية مسح بالفعل جارية");

    const body = await readJson(req);
    const confirm = typeof body?.confirm === "string" ? body.confirm.trim().toUpperCase() : "";

    if (confirm !== CONFIRM_PHRASE) {
      return badRequest(`عبارة التأكيد غير صحيحة — اكتب ${CONFIRM_PHRASE} بالظبط`);
    }

    const verification = await backupVerified();
    if (!verification.ok) {
      await logAudit("reset_blocked", actor, { reason: verification.reason });
      return badRequest(verification.reason ?? "النسخة الاحتياطية غير موثّقة");
    }

    resetting = true;
    try {
      const deleted = await db.$transaction(async (tx) => {
        const [products, categories, builds, orders, maintenance] = await Promise.all([
          tx.product.deleteMany(),
          tx.category.deleteMany(),
          tx.pCBuild.deleteMany(),
          tx.orderRecord.deleteMany(),
          tx.maintenanceRecord.deleteMany(),
        ]);
        return {
          products: products.count,
          categories: categories.count,
          builds: builds.count,
          orders: orders.count,
          maintenance: maintenance.count,
        };
      });

      await logAudit("reset_executed", actor, {
        ...deleted,
        backupId: verification.backupId,
      });

      invalidateBootstrapCache();
      return json({ ok: true, deleted, preservedBackupId: verification.backupId });
    } finally {
      resetting = false;
    }
  } catch (err) {
    resetting = false;
    return serverError(err);
  }
}

/** GET — dry-run: reports whether reset is currently possible (used by the UI). */
export async function GET(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const verification = await backupVerified();
    const counts = {
      products: await db.product.count(),
      categories: await db.category.count(),
      builds: await db.pCBuild.count(),
      orders: await db.orderRecord.count(),
      maintenance: await db.maintenanceRecord.count(),
    };

    return json({
      canReset: verification.ok,
      reason: verification.reason,
      backupId: verification.backupId,
      counts,
      confirmPhrase: CONFIRM_PHRASE,
    });
  } catch (err) {
    return serverError(err);
  }
}
