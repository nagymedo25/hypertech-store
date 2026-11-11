/**
 * HYPER TECH — formatting utilities (Arabic/Egypt-aware)
 * Prices use Eastern Arabic locale with Latin digits for technical clarity.
 */

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Format a price in EGP, e.g. 24999 → "24,999 ج.م" */
export function formatPrice(value: number): string {
  return `${nf.format(value)} ج.م`;
}

/** Compact price for tight UI areas, e.g. 24999 → "24,999" */
export function formatPriceCompact(value: number): string {
  return nf.format(value);
}

/** Discount percentage between old and current price */
export function discountPercent(price: number, oldPrice?: number): number | null {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

/** Arabic-relative date, e.g. "منذ ٣ أيام" */
export function timeAgo(iso: string): string {
  const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  if (days < 30) return rtf.format(-days, "day");
  const months = Math.floor(days / 30);
  if (months < 12) return rtf.format(-months, "month");
  return rtf.format(-Math.floor(months / 12), "year");
}

/** Arabic absolute date, e.g. "١٢ نوفمبر ٢٠٢٥" style (Latin digits) */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    numberingSystem: "latn",
  }).format(new Date(iso));
}

/* ------------------------- Display helpers -------------------------- */

export const AVAILABILITY_META: Record<
  string,
  { label: string; tone: "success" | "warn" | "danger" | "info" }
> = {
  "in-stock": { label: "متوفر", tone: "success" },
  "low-stock": { label: "كمية محدودة", tone: "warn" },
  "out-of-stock": { label: "غير متوفر حاليًا", tone: "danger" },
  "pre-order": { label: "حجز مسبق", tone: "info" },
};

export const ORDER_STATUS_META: Record<string, { label: string; tone: string }> = {
  new: { label: "جديد", tone: "text-sky-400 bg-sky-400/10 border-sky-400/20" },
  contacted: { label: "تم التواصل", tone: "text-cyan-300 bg-cyan-300/10 border-cyan-300/20" },
  confirmed: { label: "مؤكد", tone: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  completed: { label: "مكتمل", tone: "text-emerald-300 bg-emerald-300/10 border-emerald-300/20" },
  cancelled: { label: "ملغي", tone: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
};

export const MAINTENANCE_STATUS_META: Record<string, { label: string; tone: string }> = {
  new: { label: "طلب جديد", tone: "text-sky-400 bg-sky-400/10 border-sky-400/20" },
  "in-review": { label: "قيد الفحص", tone: "text-amber-300 bg-amber-300/10 border-amber-300/20" },
  repairing: { label: "جاري الإصلاح", tone: "text-violet-300 bg-violet-300/10 border-violet-300/20" },
  ready: { label: "جاهز للاستلام", tone: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  delivered: { label: "تم التسليم", tone: "text-emerald-300 bg-emerald-300/10 border-emerald-300/20" },
  cancelled: { label: "ملغي", tone: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
};

export const DEVICE_TYPE_META: Record<string, string> = {
  laptop: "لابتوب",
  desktop: "كمبيوتر مكتبي",
  phone: "هاتف",
  other: "جهاز آخر",
};

export const PROBLEM_CATEGORY_META: Record<string, string> = {
  hardware: "عطل هاردوير (قطع/مكونات)",
  software: "مشكلة سوفتوير",
  performance: "بطء وضعف أداء",
  os: "نظام تشغيل",
  display: "شاشة / عرض",
  other: "أخرى",
};

export const BUILD_TYPE_META: Record<string, string> = {
  gaming: "تجميعة ألعاب",
  workstation: "تجميعة أعمال احترافية",
  budget: "تجميعة اقتصادية",
  creator: "تجميعة مبدعين ومونتاج",
};
