"use client";

/**
 * ViewHeader — inner-view editorial hero (store, maintenance, cart…).
 * Kicker + display title + description + optional accent theming.
 */

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { EASE, splitWordsSafe, prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function ViewHeader({
  kicker,
  title,
  accentWord,
  description,
  accent = "var(--primary)",
  children,
  className,
}: {
  kicker?: string;
  title: string;
  accentWord?: string;
  description?: string;
  /** CSS color for theming (category accent) */
  accent?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const words = el.querySelectorAll<HTMLElement>("[data-vw-words]");
      const spans: HTMLElement[] = [];
      words.forEach((w) => spans.push(...splitWordsSafe(w)));
      gsap.fromTo(
        spans,
        { yPercent: 90, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.75, ease: EASE.out, stagger: 0.05, delay: 0.1 }
      );
      const kickerEl = el.querySelector("[data-vw-kicker]");
      if (kickerEl) {
        gsap.fromTo(kickerEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: EASE.out, delay: 0.05 });
      }
      const descEl = el.querySelector("[data-vw-desc]");
      if (descEl) {
        gsap.fromTo(descEl, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55, ease: EASE.out, delay: 0.3 });
      }
    }, el);
    return () => ctx.revert();
  }, [title]);

  let before = title;
  let after = "";
  if (accentWord && title.includes(accentWord)) {
    const idx = title.indexOf(accentWord);
    before = title.slice(0, idx);
    after = title.slice(idx + accentWord.length);
  }

  return (
    <div ref={ref} className={cn("relative pt-28 pb-8 sm:pt-32 sm:pb-10", className)}>
      {/* Accent glow — max-w-full keeps the 24rem glow inside its
          container on narrow phones (RTL left-bleed otherwise grows
          the document's scrolling area) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 right-0 h-56 w-96 max-w-full rounded-full opacity-25 blur-3xl"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
      />
      {kicker && (
        <p
          data-vw-kicker
          className="mb-3 flex items-center gap-2.5 text-[0.7rem] font-bold uppercase tracking-[0.28em] opacity-0"
          style={{ color: accent }}
        >
          <span className="inline-block h-px w-8" style={{ background: accent }} aria-hidden />
          {kicker}
        </p>
      )}
      <h1 className="font-display text-3xl font-bold leading-[1.18] sm:text-5xl lg:text-6xl">
        <span data-vw-words className="inline">{before}</span>
        {/* Real space between base title and accent — otherwise JSX renders
            "بياناتالطلب" with the words smashed together. */}
        {accentWord && before && !before.endsWith(" ") ? " " : ""}
        {accentWord && (
          <span data-vw-words className="inline text-electric">
            {accentWord}
          </span>
        )}
        {after && <span data-vw-words className="inline">{" " + after}</span>}
      </h1>
      {description && (
        <p
          data-vw-desc
          className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground opacity-0 sm:text-base sm:leading-8"
        >
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
