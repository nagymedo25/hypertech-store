/**
 * ============================================================
 * HYPER TECH — Cloudinary server-side signing (server-only)
 * ============================================================
 * Secure signed direct uploads: the browser never sees the API
 * secret. The admin asks this library (via /api/admin/cloudinary/sign)
 * for a signature over an agreed parameter set, then uploads the
 * file DIRECTLY to Cloudinary with those parameters — giving us
 * real XHR progress events without any secret exposure.
 *
 * Raw (non-image) uploads are used for PDF backups
 * (resource_type: "raw", folder: "hypertech/backups").
 * ============================================================
 */

import { createHash } from "crypto";

const cloudName = () => {
  const v = process.env.CLOUDINARY_CLOUD_NAME;
  if (!v) throw new Error("CLOUDINARY_CLOUD_NAME is not configured");
  return v;
};

const apiKey = () => {
  const v = process.env.CLOUDINARY_API_KEY;
  if (!v) throw new Error("CLOUDINARY_API_KEY is not configured");
  return v;
};

const apiSecret = () => {
  const v = process.env.CLOUDINARY_API_SECRET;
  if (!v) throw new Error("CLOUDINARY_API_SECRET is not configured");
  return v;
};

export interface SignedUpload {
  /** The exact params to append to the upload form-data */
  params: Record<string, string | number>;
  /** Space-separated parameter string Cloudinary expects in `signature` order */
  signature: string;
  api_key: string;
  cloud_name: string;
  /** The upload endpoint URL */
  upload_url: string;
  /** Where the delivered asset will live (public_id + transformation base) */
  folder: string;
}

/**
 * Sign an upload. The caller decides the folder + resource_type;
 * the timestamp is generated here so signatures are always fresh.
 */
export function signUpload(opts: {
  folder: string;
  resourceType?: "image" | "raw";
  publicId?: string;
}): SignedUpload {
  const timestamp = Math.floor(Date.now() / 1000);

  const params: Record<string, string | number> = {
    folder: opts.folder,
    timestamp,
  };
  if (opts.publicId) params.public_id = opts.publicId;

  // Cloudinary signature: sha1 of "k1=v1&k2=v2...&api_secret", keys sorted
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  const signature = createHash("sha1").update(`${toSign}${apiSecret()}`).digest("hex");

  return {
    params,
    signature,
    api_key: apiKey(),
    cloud_name: cloudName(),
    upload_url: `https://api.cloudinary.com/v1_1/${cloudName()}/${opts.resourceType ?? "image"}/upload`,
    folder: opts.folder,
  };
}

/** Build the standard delivery URL for an uploaded public_id. */
export function deliveryUrl(publicId: string, transform = "f_auto,q_auto"): string {
  return `https://res.cloudinary.com/${cloudName()}/image/upload/${transform}/${publicId}`;
}

/** Verify an admin-uploaded Cloudinary URL is well-formed (returns normalized). */
export function isCloudinaryUrl(url: string): boolean {
  return /^https:\/\/res\.cloudinary\.com\/[a-z0-9]+\/(image|raw)\/upload\//.test(url);
}
