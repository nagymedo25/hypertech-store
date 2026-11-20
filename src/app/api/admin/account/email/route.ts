/**
 * ============================================================
 * HYPER TECH — Admin Account Email Update
 * (POST / PATCH /api/admin/account/email)
 * ============================================================
 */

import { badRequest, readJson, serverError, unauthorized } from "@/lib/server/http";
import { getAdminAccount } from "@/lib/server/auth";
import { handleEmailUpdate } from "../route";

export async function POST(req: Request) {
  try {
    const admin = await getAdminAccount(req);
    if (!admin) return unauthorized();
    const body = await readJson(req);
    return await handleEmailUpdate(admin, body);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: Request) {
  return POST(req);
}

export async function PUT(req: Request) {
  return POST(req);
}
