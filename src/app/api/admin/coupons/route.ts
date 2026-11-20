/**
 * ============================================================
 * HYPER TECH — Admin Coupons Management (GET / POST)
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, readJson, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { toDiscountCode } from "@/lib/server/serializers";
import { logAudit } from "@/lib/server/audit";

export async function GET(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const rows = await db.discountCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    return json({ coupons: rows.map(toDiscountCode) });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      return badRequest("بيانات الكوبون غير صالحة");
    }

    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      expiresAt,
      isActive,
    } = body as Record<string, any>;

    const cleanCode = typeof code === "string" ? code.trim().toUpperCase() : "";
    if (!cleanCode) {
      return badRequest("كود الخصم مطلوب");
    }

    if (discountType !== "percentage" && discountType !== "fixed_amount") {
      return badRequest("نوع الخصم يجب أن يكون إما نسبة مئوية (percentage) أو مبلغ ثابت (fixed_amount)");
    }

    const val = Number(discountValue);
    if (isNaN(val) || val <= 0) {
      return badRequest("قيمة الخصم يجب أن تكون رقمًا أكبر من الصفر");
    }

    if (discountType === "percentage" && val > 100) {
      return badRequest("نسبة الخصم المئوية لا يمكن أن تتجاوز 100%");
    }

    // Check code uniqueness
    const existing = await db.discountCode.findUnique({
      where: { code: cleanCode },
    });
    if (existing) {
      return badRequest("كود الخصم هذا موجود بالفعل، يرجى اختيار كود آخر");
    }

    const minAmt = minOrderAmount !== undefined && minOrderAmount !== null && minOrderAmount !== ""
      ? Math.max(0, Number(minOrderAmount))
      : null;

    const maxDisc = maxDiscountAmount !== undefined && maxDiscountAmount !== null && maxDiscountAmount !== ""
      ? Math.max(0, Number(maxDiscountAmount))
      : null;

    const limit = usageLimit !== undefined && usageLimit !== null && usageLimit !== ""
      ? Math.max(1, Math.floor(Number(usageLimit)))
      : null;

    let parsedExpiry: Date | null = null;
    if (expiresAt) {
      const d = new Date(expiresAt);
      if (!isNaN(d.getTime())) {
        parsedExpiry = d;
      }
    }

    const row = await db.discountCode.create({
      data: {
        code: cleanCode,
        discountType,
        discountValue: val,
        minOrderAmount: minAmt,
        maxDiscountAmount: maxDisc,
        usageLimit: limit,
        usedCount: 0,
        expiresAt: parsedExpiry,
        isActive: isActive !== false,
      },
    });

    await logAudit("coupon_created", actor, { id: row.id, code: row.code });
    return json({ coupon: toDiscountCode(row) }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
