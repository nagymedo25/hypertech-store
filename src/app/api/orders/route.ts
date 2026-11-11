/**
 * ============================================================
 * HYPER TECH — Public Order Submission (POST /api/orders)
 * ============================================================
 * Prices and totals are computed SERVER-SIDE from the live
 * database — the frontend cart is never trusted. Availability
 * is re-checked at submission time.
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, readJson, serverError } from "@/lib/server/http";
import { toOrder } from "@/lib/server/serializers";
import { logAudit } from "@/lib/server/audit";
import { orderSubmitSchema, zodMessage } from "@/lib/server/validators";
import { orderRef, uid } from "@/lib/server/ids";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const parsed = orderSubmitSchema.safeParse(body);
    if (!parsed.success) return badRequest("بيانات الطلب غير صالحة", zodMessage(parsed.error));

    const { customerName, customerPhone, notes, items } = parsed.data;

    /* Server-side pricing — one authoritative DB read */
    const ids = items.map((i) => i.productId);
    const productRows = await db.product.findMany({ where: { id: { in: ids } } });
    const byId = new Map(productRows.map((p) => [p.id, p]));

    const lines: { productId: string; name: string; qty: number; price: number }[] = [];
    const problems: string[] = [];

    for (const item of items) {
      const p = byId.get(item.productId);
      if (!p) {
        problems.push(`منتج غير موجود: ${item.productId}`);
        continue;
      }
      if (p.availability === "out-of-stock" || p.availability === "pre-order") {
        problems.push(`${p.name} غير متاح حاليًا`);
        continue;
      }
      lines.push({ productId: p.id, name: p.name, qty: item.qty, price: p.price });
    }

    if (problems.length) return badRequest(problems[0], { problems });
    if (!lines.length) return badRequest("لا توجد منتجات صالحة في الطلب");

    const total = lines.reduce((acc, l) => acc + l.price * l.qty, 0);
    const count = await db.orderRecord.count();
    const ref = orderRef(count + 1);

    const row = await db.orderRecord.create({
      data: {
        id: uid("ord"),
        ref,
        customerName,
        customerPhone,
        items: lines,
        total,
        status: "new",
        notes: notes ?? null,
      },
    });

    await logAudit("order_created", "customer", { ref, total, lines: lines.length });
    return json({ order: toOrder(row) }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
