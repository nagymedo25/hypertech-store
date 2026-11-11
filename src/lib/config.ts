/**
 * ============================================================
 * HYPER TECH — Centralized Business Configuration
 * ============================================================
 * Single source of truth for all business identity data.
 * Verified sources:
 *  - Facebook page: facebook.com/HyperTech012 ("HYPER TECH | Mansoura")
 *  - Facebook og:description: "موقع متخصص في بيع وشراء و استبدال
 *    الالكترونيات ( لاب توب - اجزاء الكمبيوتر - الهواتف )"
 *  - TikTok: @hypertech108 (supplied by owner)
 *  - WhatsApp receiving number: 01553153156 (supplied by owner)
 *
 * ⚠️ PHASE 02 NOTE: This layer is a frontend configuration shim.
 * In Phase 02 these values should be served/overridden by the backend
 * (StoreSettings entity + admin "Store Settings" screen).
 * ============================================================
 */

export const BUSINESS = {
  /** Brand name (Latin) as shown in the verified logo wordmark */
  nameLatin: "HYPER TECH",
  /** Brand name (Arabic) */
  nameArabic: "هايبر تك",
  /** Verified tagline from the official logo: "POWER YOUR NEXT LEVEL" */
  taglineLatin: "POWER YOUR NEXT LEVEL",
  /** Arabic rendering of the brand tagline */
  taglineArabic: "شغّل مستواك التالي",
  /** Verified short description (adapted from Facebook og:description) */
  description:
    "هايبر تك — متجرك المتخصص في بيع وشراء واستبدال الإلكترونيات: لابتوب، أجزاء كمبيوتر، وهواتف. جودة موثوقة وخبرة حقيقية في عالم التقنية.",
  /** Verified location (city-level only — no street address was exposed publicly) */
  city: "المنصورة",
  country: "مصر",
  address: "المنصورة، الدقهلية، مصر",

  /**
   * WhatsApp receiving number supplied by the owner (01553153156).
   * Stored in E.164-ish form WITHOUT "+" for wa.me links.
   */
  whatsappNumber: "201553153156",
  /** Human-friendly local display format */
  whatsappDisplay: "015 5315 3156",

  /** Verified Facebook page (resolved from the share link) */
  facebook: "https://www.facebook.com/HyperTech012",
  /** TikTok account supplied by the owner */
  tiktok: "https://www.tiktok.com/@hypertech108",

  /** Verified community size at research time (Facebook) */
  socialProof: {
    facebookFollowers: 1700,
  },

  /** Verified business activities from Facebook description */
  activities: ["بيع", "شراء", "استبدال"] as const,
} as const;

/** Build a wa.me click-to-chat URL with an optional pre-filled message */
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${BUSINESS.whatsappNumber}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
