/**
 * ============================================================
 * HYPER TECH — Backup Records (GET list / POST create)
 * ============================================================
 * POST starts a backup: the server snapshots current record
 * counts AND the full report payload in one transaction —
 * the browser renders the premium PDF from exactly that
 * snapshot, uploads it to Cloudinary raw storage via the
 * signed endpoint, then PATCHes the record with the file URL.
 * ============================================================
 */

import { db } from "@/lib/db";
import { json, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { toProduct, toCategory, toBuild, toOrder, toMaintenance, toSettings } from "@/lib/server/serializers";
import { logAudit } from "@/lib/server/audit";

export async function GET(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const rows = await db.backupRecord.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
    return json({
      backups: rows.map((r) => ({
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        counts: {
          products: r.products,
          categories: r.categories,
          builds: r.builds,
          orders: r.orders,
          maintenance: r.maintenance,
        },
        status: r.status,
        fileUrl: r.fileUrl,
        fileName: r.fileName,
        fileSize: r.fileSize,
        exportPeriod: r.exportPeriod,
        actor: r.actor,
      })),
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    /* ONE isolated read transaction — counts and payload are consistent */
    const snapshot = await db.$transaction(async (tx) => {
      const [productRows, categoryRows, buildRows, orderRows, maintenanceRows, settingsRow] =
        await Promise.all([
          tx.product.findMany({ orderBy: { createdAt: "desc" } }),
          tx.category.findMany({ orderBy: { order: "asc" } }),
          tx.pCBuild.findMany({ orderBy: { createdAt: "desc" } }),
          tx.orderRecord.findMany({ orderBy: { createdAt: "desc" } }),
          tx.maintenanceRecord.findMany({ orderBy: { createdAt: "desc" } }),
          tx.storeSettings.findUnique({ where: { id: "singleton" } }),
        ]);
      return {
        products: productRows.map(toProduct),
        categories: categoryRows.map(toCategory),
        builds: buildRows.map(toBuild),
        orders: orderRows.map(toOrder),
        maintenance: maintenanceRows.map(toMaintenance),
        settings: settingsRow ? toSettings(settingsRow) : null,
      };
    });

    const counts = {
      products: snapshot.products.length,
      categories: snapshot.categories.length,
      builds: snapshot.builds.length,
      orders: snapshot.orders.length,
      maintenance: snapshot.maintenance.length,
    };

    const row = await db.backupRecord.create({
      data: {
        status: "pending",
        actor,
        ...counts,
        exportPeriod: `من بداية النشاط حتى ${new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}`,
      },
    });

    await logAudit("backup_started", actor, { id: row.id, ...counts });

    return json(
      {
        backup: {
          id: row.id,
          createdAt: row.createdAt.toISOString(),
          counts,
          status: row.status,
          exportPeriod: row.exportPeriod,
        },
        snapshot,
        serverTime: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (err) {
    return serverError(err);
  }
}
