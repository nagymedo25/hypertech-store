/**
 * ============================================================
 * HYPER TECH — Admin Coupon by ID (PUT / DELETE)
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, readJson, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { toDiscountCode } from "@/lib/server/serializers";
import { logAudit } from "@/lib/server/audit";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const { id } = await params;
    if (!id) return badRequest("معرف الكوبون مطلوب");

    const existing = await db.discountCode.findUnique({ where: { id } });
    if (!existing) {
      return json({ error: "كوبون الخصم غير موجود" }, { status: 404 });
    }

    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      return badRequest("بيانات التعديل غير صالحة");
    }

    const patch: Record<string, any> = {};

    if ("code" in body) {
      const cleanCode = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
      if (!cleanCode) return badRequest("كود الخصم لا يمكن أن يكون فارغًا");

      if (cleanCode !== existing.code) {
        const dup = await db.discountCode.findUnique({ where: { code: cleanCode } });
        if (dup) {
          return badRequest("كود الخصم هذا مستخدم بالفعل");
        }
      }
      patch.code = cleanCode;
    }

    if ("discountType" in body) {
      if (body.discountType !== "percentage" && body.discountType !== "fixed_amount") {
        return badRequest("نوع الخصم غير صحيح");
      }
      patch.discountType = body.discountType;
    }

    if ("discountValue" in body) {
      const val = Number(body.discountValue);
      if (isNaN(val) || val <= 0) {
        return badRequest("قيمة الخصم يجب أن تكون أكبر من الصفر");
      }
      const type = patch.discountType || existing.discountType;
      if (type === "percentage" && val > 100) {
        return badRequest("نسبة الخصم المئوية لا يمكن أن تتجاوز 100%");
      }
      patch.discountValue = val;
    }

    if ("minOrderAmount" in body) {
      patch.minOrderAmount =
        body.minOrderAmount !== null && body.minOrderAmount !== undefined && body.minOrderAmount !== ""
          ? Math.max(0, Number(body.minOrderAmount))
          : null;
    }

    if ("maxDiscountAmount" in body) {
      patch.maxDiscountAmount =
        body.maxDiscountAmount !== null && body.maxDiscountAmount !== undefined && body.maxDiscountAmount !== ""
          ? Math.max(0, Number(maxDiscountAmountIn(body.maxDiscountAmount)))
          : null;
    }

    if ("usageLimit" in body) {
      patch.usageLimit =
        body.usageLimit !== null && body.usageLimit !== undefined && body.usageLimit !== ""
          ? Math.max(1, Math.floor(Number(body.usageLimit)))
          : null;
    }

    if ("expiresAt" in body) {
      if (!body.expiresAt) {
        patch.expiresAt = null;
      } else {
        const d = new Date(String(body.expiresAt));
        patch.expiresAt = !isNaN(d.getTime()) ? d : null;
      }
    }

    if ("isActive" in body) {
      patch.isActive = Boolean(body.isActive);
    }

    const updated = await db.discountCode.update({
      where: { id },
      data: patch,
    });

    await logAudit("coupon_updated", actor, { id, code: updated.code, changed: Object.keys(patch) });
    return json({ coupon: toDiscountCode(updated) });
  } catch (err) {
    return serverError(err);
  }
}

function maxDiscountAmountIn(val: any) {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const { id } = await params;
    if (!id) return badRequest("معرف الكوبون مطلوب");

    const existing = await db.discountCode.findUnique({ where: { id } });
    if (!existing) {
      return json({ error: "كوبون الخصم غير موجود" }, { status: 404 });
    }

    await db.discountCode.delete({ where: { id } });
    await logAudit("coupon_deleted", actor, { id, code: existing.code });

    return json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
