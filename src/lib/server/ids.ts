/**
 * ============================================================
 * HYPER TECH — Shared id/slug helpers (server-only)
 * ============================================================
 */

export function slugify(text: string): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[\s/\\]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-");
  return base || `item-${Date.now()}`;
}

export function uid(prefix = "it"): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Human-friendly order reference: HT-4821 */
export function orderRef(seq: number): string {
  return `HT-${String(1000 + seq).padStart(4, "0")}`;
}

export function maintenanceRef(seq: number): string {
  return `MNT-${String(1200 + seq).padStart(4, "0")}`;
}
