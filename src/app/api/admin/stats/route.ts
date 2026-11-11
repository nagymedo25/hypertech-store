/**
 * ============================================================
 * HYPER TECH — Admin Overview Stats (GET /api/admin/stats)
 * ============================================================
 * Every number here is REAL — computed live from the database.
 * No simulated analytics.
 * ============================================================
 */

import { db } from "@/lib/db";
import { json, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";

export async function GET(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const [
      productCount,
      categoryCount,
      buildCount,
      revenueAgg,
      orderCount,
      maintenanceCount,
      orderStatusGroups,
      maintenanceStatusGroups,
      lowStock,
      recentOrders,
      latestBackup,
    ] = await Promise.all([
      db.product.count(),
      db.category.count(),
      db.pCBuild.count(),
      db.orderRecord.aggregate({ _sum: { total: true }, where: { status: { notIn: ["cancelled"] } } }),
      db.orderRecord.count(),
      db.maintenanceRecord.count(),
      db.orderRecord.groupBy({ by: ["status"], _count: { _all: true } }),
      db.maintenanceRecord.groupBy({ by: ["status"], _count: { _all: true } }),
      db.product.findMany({
        where: { stockQty: { lte: 3 } },
        orderBy: { stockQty: "asc" },
        take: 6,
        select: { id: true, name: true, stockQty: true, availability: true },
      }),
      db.orderRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, ref: true, customerName: true, total: true, status: true, createdAt: true },
      }),
      db.backupRecord.findFirst({ orderBy: { createdAt: "desc" } }),
    ]);

    const revenue = revenueAgg._sum.total ?? 0;

    /* Daily revenue for the last 14 days (real orders only) */
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const revenueRows = await db.orderRecord.findMany({
      where: { createdAt: { gte: since }, status: { notIn: ["cancelled"] } },
      select: { total: true, createdAt: true },
    });
    const daily = new Map<string, number>();
    for (const r of revenueRows) {
      const day = r.createdAt.toISOString().slice(0, 10);
      daily.set(day, (daily.get(day) ?? 0) + r.total);
    }
    const revenueTrend = [...daily.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([day, value]) => ({ day, value }));

    return json({
      products: productCount,
      categories: categoryCount,
      builds: buildCount,
      orders: orderCount,
      maintenance: maintenanceCount,
      revenue,
      orderStatus: Object.fromEntries(orderStatusGroups.map((g) => [g.status, g._count._all])),
      maintenanceStatus: Object.fromEntries(maintenanceStatusGroups.map((g) => [g.status, g._count._all])),
      lowStock,
      recentOrders: recentOrders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() })),
      latestBackup: latestBackup
        ? {
            id: latestBackup.id,
            createdAt: latestBackup.createdAt.toISOString(),
            status: latestBackup.status,
            counts: {
              products: latestBackup.products,
              categories: latestBackup.categories,
              builds: latestBackup.builds,
              orders: latestBackup.orders,
              maintenance: latestBackup.maintenance,
            },
          }
        : null,
      revenueTrend,
    });
  } catch (err) {
    return serverError(err);
  }
}
