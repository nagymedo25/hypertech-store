/**
 * ============================================================
 * HYPER TECH — Public Coupon Validation (POST /api/coupons/validate)
 * ============================================================
 * Takes { code, cartSubtotal } and returns validated discount amount
 * and final total, with honest Arabic error messages.
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, readJson, serverError } from "@/lib/server/http";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      return badRequest("بيانات الطلب غير صالحة");
    }

    const { code, cartSubtotal } = body as { code?: string; cartSubtotal?: number };

    const cleanCode = typeof code === "string" ? code.trim().toUpperCase() : "";
    if (!cleanCode) {
      return badRequest("يرجى إدخال كود الخصم");
    }

    const subtotal = Number(cartSubtotal);
    if (isNaN(subtotal) || subtotal < 0) {
      return badRequest("إجمالي سلة المشتريات غير صحيح");
    }

    const coupon = await db.discountCode.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon) {
      return badRequest("كود الخصم غير موجود، تأكد من صحة الكود");
    }

    if (!coupon.isActive) {
      return badRequest("كود الخصم هذا متوقف وغير مفعّل حاليًا");
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return badRequest("انتهت صلاحية كود الخصم هذا");
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return badRequest("تم استنفاد الحد الأقصى لمرات استخدام هذا الكود");
    }

    if (coupon.minOrderAmount !== null && coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
      return badRequest(`يتطلب هذا الكوبون حدًا أدنى لقيمة الطلب ${coupon.minOrderAmount} ج.م`);
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      const rawDiscount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount !== null && coupon.maxDiscountAmount > 0) {
        discountAmount = Math.min(rawDiscount, coupon.maxDiscountAmount);
      } else {
        discountAmount = rawDiscount;
      }
    } else {
      // fixed_amount
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;
    discountAmount = Math.max(0, Math.min(discountAmount, subtotal));
    const finalTotal = Math.round((subtotal - discountAmount) * 100) / 100;

    return json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      subtotal,
      finalTotal,
      message: "تم تطبيق كود الخصم بنجاح",
    });
  } catch (err) {
    return serverError(err);
  }
}
