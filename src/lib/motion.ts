/**
 * ============================================================
 * HYPER TECH — Motion Design System
 * ============================================================
 * One consistent motion language across the whole application:
 * easing curves, duration scale, stagger rhythm. GSAP is the
 * orchestration engine; nothing animates on conflicting systems.
 * ============================================================
 */

export const EASE = {
  /** Standard deceleration for entrances */
  out: "power3.out",
  /** Cinematic in+out for overlays/curtains */
  inOut: "power4.inOut",
  /** Expo — snappy, premium feel for large surfaces */
  expo: "expo.out",
  /** Soft spring for playful micro-interactions */
  spring: "back.out(1.6)",
  /** Elastic for badge/cart-count pops */
  elastic: "elastic.out(1, 0.45)",
} as const;

export const DUR = {
  micro: 0.16,
  fast: 0.28,
  base: 0.55,
  slow: 0.9,
  cinematic: 1.25,
} as const;

export const STAGGER = {
  tight: 0.045,
  base: 0.08,
  wide: 0.14,
} as const;

/** Reduced-motion preference (client only) */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Splits Arabic/Latin text into word spans — SAFE for Arabic shaping:
 * we never split characters, only whole words (natural break points),
 * so ligatures and contextual forms stay intact.
 *
 * GRADIENT-TEXT SAFE: if the element is a gradient-clipped display span
 * (background-clip: text — e.g. .text-electric / .text-silver), the paint
 * is moved onto each word span. A descendant with a transform (GSAP leaves
 * `transform: translate(0,0)` after animating yPercent) breaks the
 * ancestor's background-clip:text painting in Chromium — per-word
 * backgrounds are immune to this and render identically.
 */
export function splitWordsSafe(el: HTMLElement): HTMLElement[] {
  if (el.dataset.wordsSplit === "true") {
    return Array.from(el.querySelectorAll<HTMLElement>("[data-word]"));
  }
  const text = el.textContent ?? "";
  // Preserve normal spaces; split on whitespace only
  const words = text.split(/\s+/).filter(Boolean);
  el.textContent = "";
  const spans: HTMLElement[] = [];

  // Detect gradient-clipped display text and move the paint per-word
  const cs = typeof window !== "undefined" ? getComputedStyle(el) : null;
  const webkitClip = cs ? ((cs as unknown as { webkitBackgroundClip?: string }).webkitBackgroundClip ?? "") : "";
  const isGradientText =
    !!cs && cs.backgroundImage !== "none" && (cs.backgroundClip === "text" || webkitClip === "text");

  words.forEach((word, i) => {
    const span = document.createElement("span");
    span.dataset.word = "true";
    span.textContent = word;
    span.style.display = "inline-block";
    if (isGradientText && cs) {
      span.style.backgroundImage = cs.backgroundImage;
      span.style.backgroundClip = "text";
      (span.style as unknown as { webkitBackgroundClip: string }).webkitBackgroundClip = "text";
    }
    el.appendChild(span);
    if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    spans.push(span);
  });
  if (isGradientText) {
    // The parent no longer needs its background — every word self-paints
    el.style.backgroundImage = "none";
  }
  el.dataset.wordsSplit = "true";
  return spans;
}
