/**
 * ============================================================
 * HYPER TECH — Admin Account & Security Management
 * (GET / PATCH / POST /api/admin/account)
 * ============================================================
 * Allows the administrator to:
 *   1. View current account details (GET)
 *   2. Update admin email address with password verification (PATCH / POST)
 *   3. Update admin password with confirmation & verification (PATCH / POST)
 * Automatically issues a refreshed session cookie so the admin
 * is never logged out or locked out.
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, readJson, serverError, unauthorized } from "@/lib/server/http";
import {
  createSessionToken,
  getAdminAccount,
  hashPassword,
  sessionCookieHeader,
  verifyPassword,
} from "@/lib/server/auth";
import { logAudit } from "@/lib/server/audit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req: Request) {
  try {
    const admin = await getAdminAccount(req);
    if (!admin) return unauthorized();

    return json({
      ok: true,
      account: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
        lastLoginAt: admin.lastLoginAt,
      },
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: Request) {
  return handleAccountUpdate(req);
}

export async function PATCH(req: Request) {
  return handleAccountUpdate(req);
}

export async function handleEmailUpdate(
  admin: NonNullable<Awaited<ReturnType<typeof getAdminAccount>>>,
  body: Record<string, unknown> | null
) {
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newEmail = typeof body?.newEmail === "string" ? body.newEmail.trim().toLowerCase() : "";

  if (!currentPassword) {
    return badRequest("كلمة المرور الحالية مطلوبة لتأكيد التغيير");
  }

  if (!verifyPassword(currentPassword, admin.passwordHash)) {
    return badRequest("كلمة المرور الحالية غير صحيحة");
  }

  if (!newEmail) {
    return badRequest("البريد الإلكتروني الجديد مطلوب");
  }

  if (!EMAIL_REGEX.test(newEmail)) {
    return badRequest("صيغة البريد الإلكتروني غير صحيحة — مثال: admin@hypertech.com");
  }

  if (admin.email?.toLowerCase() === newEmail && admin.username.toLowerCase() === newEmail) {
    return badRequest("البريد الإلكتروني الجديد مطابق للبريد الحالي");
  }

  // Ensure email/username uniqueness across other admin accounts
  const duplicate = await db.adminUser.findFirst({
    where: {
      AND: [
        { id: { not: admin.id } },
        {
          OR: [{ email: newEmail }, { username: newEmail }],
        },
      ],
    },
  });

  if (duplicate) {
    return badRequest("هذا البريد الإلكتروني مستخدم بالفعل لحساب آخر");
  }

  const updated = await db.adminUser.update({
    where: { id: admin.id },
    data: {
      email: newEmail,
      username: newEmail,
    },
  });

  await logAudit("admin_email_updated", newEmail, {
    adminId: admin.id,
    oldEmail: admin.email,
    newEmail,
    oldUsername: admin.username,
    newUsername: newEmail,
  });

  // Re-issue signed session cookie with new username/email so admin is NOT logged out
  const newToken = createSessionToken(newEmail);

  return json(
    {
      ok: true,
      message: "تم تحديث البريد الإلكتروني بنجاح",
      account: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        role: updated.role,
      },
    },
    {
      headers: {
        "set-cookie": sessionCookieHeader(newToken),
      },
    }
  );
}

export async function handlePasswordUpdate(
  admin: NonNullable<Awaited<ReturnType<typeof getAdminAccount>>>,
  body: Record<string, unknown> | null
) {
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

  if (!currentPassword) {
    return badRequest("كلمة المرور الحالية مطلوبة");
  }

  if (!verifyPassword(currentPassword, admin.passwordHash)) {
    return badRequest("كلمة المرور الحالية غير صحيحة");
  }

  if (!newPassword) {
    return badRequest("كلمة المرور الجديدة مطلوبة");
  }

  if (newPassword.length < 8) {
    return badRequest("كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف");
  }

  if (!confirmPassword) {
    return badRequest("يرجى تأكيد كلمة المرور الجديدة");
  }

  if (newPassword !== confirmPassword) {
    return badRequest("كلمة المرور الجديدة وتأكيدها غير متطابقين");
  }

  if (verifyPassword(newPassword, admin.passwordHash)) {
    return badRequest("كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور الحالية");
  }

  const passwordHash = hashPassword(newPassword);

  await db.adminUser.update({
    where: { id: admin.id },
    data: {
      passwordHash,
    },
  });

  await logAudit("admin_password_updated", admin.username, {
    adminId: admin.id,
    username: admin.username,
  });

  // Refresh session cookie cleanly
  const newToken = createSessionToken(admin.username);

  return json(
    {
      ok: true,
      message: "تم تغيير كلمة المرور بنجاح — الجلسة مستمرة ومحمية",
    },
    {
      headers: {
        "set-cookie": sessionCookieHeader(newToken),
      },
    }
  );
}

async function handleAccountUpdate(req: Request) {
  try {
    const admin = await getAdminAccount(req);
    if (!admin) return unauthorized();

    const body = await readJson(req);
    const action = typeof body?.action === "string" ? body.action : "";

    if (action === "password" || (body?.newPassword && !body?.newEmail)) {
      return await handlePasswordUpdate(admin, body);
    }

    if (action === "email" || body?.newEmail) {
      return await handleEmailUpdate(admin, body);
    }

    return badRequest("نوع العملية غير صالح — يرجى تحديد تعديل البريد أو كلمة المرور");
  } catch (err) {
    return serverError(err);
  }
}
