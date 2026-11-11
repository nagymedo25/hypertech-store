/**
 * ============================================================
 * HYPER TECH — Cloudinary Signed Upload (POST /api/admin/cloudinary/sign)
 * ============================================================
 * Returns a signature + endpoint so the admin browser can
 * upload DIRECTLY to Cloudinary with real progress events —
 * the API secret never leaves the server.
 *
 * Folder whitelist: hypertech/store (images), hypertech/backups
 * (raw PDFs). resource_type: image | raw.
 * ============================================================
 */

import { badRequest, json, readJson, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { signUpload } from "@/lib/server/cloudinary";

const ALLOWED_FOLDERS = new Set(["hypertech/store", "hypertech/products", "hypertech/categories", "hypertech/backups"]);

export async function POST(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const body = await readJson(req);
    const folder = typeof body?.folder === "string" ? body.folder : "";
    const resourceType = body?.resourceType === "raw" ? "raw" : "image";
    const publicId = typeof body?.publicId === "string" ? body.publicId.slice(0, 120) : undefined;

    if (!ALLOWED_FOLDERS.has(folder)) {
      return badRequest("مجلد غير مصرح به للرفع");
    }

    try {
      const signed = signUpload({ folder, resourceType, publicId });
      return json({ ...signed, resourceType });
    } catch {
      return serverError(new Error("Cloudinary not configured"));
    }
  } catch (err) {
    return serverError(err);
  }
}
