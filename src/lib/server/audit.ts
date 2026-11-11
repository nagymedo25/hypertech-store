/**
 * ============================================================
 * HYPER TECH — Audit log helper (server-only)
 * ============================================================
 */

import { db } from "@/lib/db";

export async function logAudit(
  action: string,
  actor?: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action,
        actor: actor ?? null,
        details: (details satisfies Record<string, unknown> | undefined) as never,
      },
    });
  } catch (err) {
    // Auditing must never break the main operation
    console.error("[audit] failed:", err);
  }
}
