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

    const { customerName, customerPhone, notes, items, couponCode } = parsed.data;

    /* Server-side pricing — authoritative DB read */
    const ids = items.map((i) => i.productId);
    const [productRows, upgradeRates] = await Promise.all([
      db.product.findMany({ where: { id: { in: ids } } }),
      db.hardwareUpgradeRate.findMany({ where: { active: true } }),
    ]);
    const byId = new Map(productRows.map((p) => [p.id, p]));
    const ramRateMap = new Map(
      upgradeRates.filter((r) => r.componentType === "ram").map((r) => [r.label, r.priceDelta])
    );
    const storageRateMap = new Map(
      upgradeRates.filter((r) => r.componentType === "storage").map((r) => [r.label, r.priceDelta])
    );

    const lines: {
      productId: string;
      name: string;
      qty: number;
      price: number;
      selectedRam?: string;
      selectedStorage?: string;
      ramUpgradePrice?: number;
      storageUpgradePrice?: number;
    }[] = [];
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

      let ramUpgradePrice = 0;
      let storageUpgradePrice = 0;
      const customPricing = (p.customHardwarePricing as Record<string, number> | null) ?? {};

      if (item.selectedRam && p.allowRamUpgrade) {
        if (item.selectedRam !== p.baseRam) {
          if (customPricing[item.selectedRam] !== undefined) {
            ramUpgradePrice = Number(customPricing[item.selectedRam]) || 0;
          } else if (ramRateMap.has(item.selectedRam)) {
            ramUpgradePrice = ramRateMap.get(item.selectedRam) || 0;
          }
        }
      }

      if (item.selectedStorage && p.allowStorageUpgrade) {
        if (item.selectedStorage !== p.baseStorage) {
          if (customPricing[item.selectedStorage] !== undefined) {
            storageUpgradePrice = Number(customPricing[item.selectedStorage]) || 0;
          } else if (storageRateMap.has(item.selectedStorage)) {
            storageUpgradePrice = storageRateMap.get(item.selectedStorage) || 0;
          }
        }
      }

      const unitPrice = p.price + ramUpgradePrice + storageUpgradePrice;

      lines.push({
        productId: p.id,
        name: p.name,
        qty: item.qty,
        price: unitPrice,
        selectedRam: item.selectedRam,
        selectedStorage: item.selectedStorage,
        ramUpgradePrice: ramUpgradePrice > 0 ? ramUpgradePrice : undefined,
        storageUpgradePrice: storageUpgradePrice > 0 ? storageUpgradePrice : undefined,
      });
    }

    if (problems.length) return badRequest(problems[0], { problems });
    if (!lines.length) return badRequest("لا توجد منتجات صالحة في الطلب");

    const subtotal = lines.reduce((acc, l) => acc + l.price * l.qty, 0);
    let discountAmount = 0;
    let validatedCouponCode: string | null = null;

    if (couponCode && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const coupon = await db.discountCode.findUnique({
        where: { code: cleanCode },
      });

      if (!coupon) {
        return badRequest("كود الخصم غير موجود");
      }
      if (!coupon.isActive) {
        return badRequest("كود الخصم هذا متوقف حاليًا");
      }
      if (coupon.expiresAt && new Date() > coupon.expiresAt) {
        return badRequest("انتهت صلاحية كود الخصم");
      }
      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        return badRequest("تم استنفاد الحد الأقصى لاستخدام هذا الكود");
      }
      if (coupon.minOrderAmount !== null && coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
        return badRequest(`يتطلب هذا الكوبون حدًا أدنى لقيمة الطلب ${coupon.minOrderAmount} ج.م`);
      }

      if (coupon.discountType === "percentage") {
        const rawDiscount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount !== null && coupon.maxDiscountAmount > 0) {
          discountAmount = Math.min(rawDiscount, coupon.maxDiscountAmount);
        } else {
          discountAmount = rawDiscount;
        }
      } else {
        discountAmount = Math.min(coupon.discountValue, subtotal);
      }

      discountAmount = Math.round(discountAmount * 100) / 100;
      discountAmount = Math.max(0, Math.min(discountAmount, subtotal));
      validatedCouponCode = coupon.code;

      // Atomically increment usedCount
      await db.discountCode.update({
        where: { id: coupon.id },
        data: {
          usedCount: { increment: 1 },
        },
      });
    }

    const total = Math.round((subtotal - discountAmount) * 100) / 100;
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
        couponCode: validatedCouponCode,
        discountAmount,
      },
    });

    await logAudit("order_created", "customer", {
      ref,
      total,
      subtotal,
      discountAmount,
      couponCode: validatedCouponCode,
      lines: lines.length,
    });
    return json({ order: toOrder(row) }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
