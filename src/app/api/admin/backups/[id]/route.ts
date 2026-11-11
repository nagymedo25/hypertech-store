/**
 * ============================================================
 * HYPER TECH — Backup by id (PATCH finalize / DELETE)
 * ============================================================
 * PATCH attaches the uploaded Cloudinary file (URL, name, size)
 * and flips the status to success/failed. Only pending records
 * can be finalized — no retro-editing history.
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, notFound, readJson, serverError, unauthorized, num, str } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { isCloudinaryUrl } from "@/lib/server/cloudinary";
import { logAudit } from "@/lib/server/audit";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const { id } = await ctx.params;
    const body = await readJson(req);
    const status = str(body?.status, 20);
    const fileUrl = str(body?.fileUrl, 2000);
    const fileName = str(body?.fileName, 200);
    const fileSize = num(body?.fileSize, 0, 200_000_000);

    if (status !== "success" && status !== "failed") {
      return badRequest("حالة غير صالحة");
    }
    if (status === "success" && (!fileUrl || !isCloudinaryUrl(fileUrl))) {
      return badRequest("رابط الملف مطلوب ويجب أن يكون على Cloudinary");
    }

    const existing = await db.backupRecord.findUnique({ where: { id } });
    if (!existing) return notFound("سجل النسخة الاحتياطية غير موجود");
    if (existing.status !== "pending") return badRequest("السجل مكتمل بالفعل");

    const row = await db.backupRecord.update({
      where: { id },
      data: {
        status,
        fileUrl: fileUrl ?? null,
        fileName: fileName ?? null,
        fileSize: fileSize ?? null,
      },
    });

    await logAudit(status === "success" ? "backup_created" : "backup_failed", actor, {
      id,
      fileName: row.fileName,
      fileSize: row.fileSize,
    });

    return json({
      backup: {
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        counts: {
          products: row.products,
          categories: row.categories,
          builds: row.builds,
          orders: row.orders,
          maintenance: row.maintenance,
        },
        status: row.status,
        fileUrl: row.fileUrl,
        fileName: row.fileName,
        fileSize: row.fileSize,
        exportPeriod: row.exportPeriod,
        actor: row.actor,
      },
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const { id } = await ctx.params;
    const existing = await db.backupRecord.findUnique({ where: { id } });
    if (!existing) return notFound("السجل غير موجود");

    /* The LATEST successful backup must never be deletable (reset safety net). */
    const latest = await db.backupRecord.findFirst({
      where: { status: "success" },
      orderBy: { createdAt: "desc" },
    });
    if (latest && latest.id === id) {
      return badRequest("لا يمكن حذف آخر نسخة احتياطية ناجحة");
    }

    await db.backupRecord.delete({ where: { id } });
    await logAudit("backup_deleted", actor, { id });
    return json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
