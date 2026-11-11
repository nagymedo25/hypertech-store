/**
 * ============================================================
 * HYPER TECH — HTTP helpers (server-only)
 * ============================================================
 * Uniform JSON responses, error shapes and client-IP
 * extraction for the API layer.
 * ============================================================
 */

export function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, {
    ...init,
    headers: { "cache-control": "no-store", ...(init?.headers ?? {}) },
  });
}

export const badRequest = (message: string, details?: unknown) =>
  json({ error: message, ...(details ? { details } : {}) }, { status: 400 });

export const unauthorized = (message = "غير مصرح — سجّل دخول أولًا") =>
  json({ error: message }, { status: 401 });

export const forbidden = (message = "محظور") => json({ error: message }, { status: 403 });

export const notFound = (message = "غير موجود") => json({ error: message }, { status: 404 });

export const tooMany = (message: string, retryAfterSec: number) =>
  json({ error: message, retryAfter: retryAfterSec }, { status: 429 });

export const serverError = (err: unknown) => {
  console.error("[api] server error:", err);
  return json({ error: "خطأ داخلي في الخادم — حاول تاني" }, { status: 500 });
};

/** Best-effort client IP (behind the Caddy gateway). */
export function getClientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

/** Safely read a JSON body with a hard size ceiling (1 MB). */
export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const text = await req.text();
    if (text.length > 1_000_000) return null;
    const parsed = JSON.parse(text || "{}");
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

/** Clamp a numeric field into [min,max]; returns undefined when absent. */
export function num(value: unknown, min: number, max: number): number | undefined {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || Number.isNaN(n)) return undefined;
  return Math.min(max, Math.max(min, n));
}

/** Trim a string field; returns undefined when absent/empty. */
export function str(value: unknown, maxLen = 5000): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  return t.length ? t.slice(0, maxLen) : undefined;
}
