/**
 * ============================================================
 * HYPER TECH — Secure Backup Download (GET /api/admin/backups/[id]/download)
 * ============================================================
 * Streams the archived backup PDF to the authenticated admin
 * with the correct content type + filename. The file is stored
 * on Cloudinary raw storage under a delivery-allowed extension
 * (.dat — Cloudinary policy blocks direct .pdf delivery on this
 * account); this proxy restores the proper .pdf experience and
 * keeps downloads admin-only.
 * ============================================================
 */

import { db } from "@/lib/db";
import { notFound, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const { id } = await ctx.params;
    const record = await db.backupRecord.findUnique({ where: { id } });
    if (!record) return notFound("سجل النسخة الاحتياطية غير موجود");
    if (record.status !== "success" || !record.fileUrl) {
      return notFound("النسخة الاحتياطية غير مكتملة أو بدون ملف");
    }

    const upstream = await fetch(record.fileUrl);
    if (!upstream.ok || !upstream.body) {
      return notFound("ملف النسخة الاحتياطية غير متاح حاليًا على التخزين السحابي");
    }

    const fileName = record.fileName ?? `hypertech-backup-${id}.pdf`;
    const headers = new Headers({
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${fileName}"`,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    });
    const len = record.fileSize ?? upstream.headers.get("content-length");
    if (len) headers.set("content-length", String(len));

    return new Response(upstream.body, { headers });
  } catch (err) {
    return serverError(err);
  }
}
