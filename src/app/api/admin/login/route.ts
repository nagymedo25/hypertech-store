/**
 * ============================================================
 * HYPER TECH — Admin Login (POST /api/admin/login)
 * ============================================================
 * Real credential verification (scrypt), rate-limited per
 * IP+username, issues an HMAC-signed HTTP-only session cookie.
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, readJson, serverError, str, tooMany } from "@/lib/server/http";
import {
  clearLoginFailures,
  createSessionToken,
  ensureAuthBooted,
  loginRateLimit,
  recordLoginFailure,
  sessionCookieHeader,
  verifyPassword,
} from "@/lib/server/auth";
import { logAudit } from "@/lib/server/audit";

export async function POST(req: Request) {
  try {
    await ensureAuthBooted();

    const body = await readJson(req);
    const username = str(body?.username, 200)?.toLowerCase();
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || !password) {
      return badRequest("اسم المستخدم وكلمة المرور مطلوبين");
    }

    const waitSec = loginRateLimit(req, username);
    if (waitSec > 0) {
      await logAudit("login_blocked", username);
      return tooMany(`محاولات كتير — استنى ${Math.ceil(waitSec / 60)} دقيقة قبل المحاولة تاني`, waitSec);
    }

    const admin = await db.adminUser.findUnique({ where: { username } });

    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      const blocked = recordLoginFailure(req, username);
      await logAudit("login_failed", username);
      return json(
        {
          error: blocked
            ? `محاولات كتير — الحساب مقفول مؤقتًا (${Math.ceil(blocked / 60)} دقيقة)`
            : "بيانات الدخول غير صحيحة",
          ...(blocked ? { retryAfter: blocked } : {}),
        },
        { status: blocked ? 429 : 401 }
      );
    }

    clearLoginFailures(req, username);
    await db.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });
    await logAudit("login", username);

    return json(
      { ok: true, username: admin.username },
      { headers: { "set-cookie": sessionCookieHeader(createSessionToken(admin.username)) } }
    );
  } catch (err) {
    return serverError(err);
  }
}
