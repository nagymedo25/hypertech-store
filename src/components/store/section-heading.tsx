"use client";

/**
 * SectionHeading — the editorial section header used across all views.
 * kicker (small uppercase) + display title (word-safe GSAP reveal) + optional description.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASE, splitWordsSafe, prefersReducedMotion, STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function SectionHeading({
  kicker,
  title,
  description,
  align = "start",
  accentWord,
  titleId,
  className,
  children,
}: {
  kicker?: string;
  title: string;
  description?: string;
  align?: "start" | "center";
  /** Part of the title rendered in the electric accent (e.g. "ترفع مستواك") */
  accentWord?: string;
  /** Optional id for the h2 — lets the section's aria-labelledby resolve */
  titleId?: string;
  className?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = el.querySelectorAll<HTMLElement>("[data-anim-words]");
    if (!words.length) return;

    if (prefersReducedMotion()) {
      gsap.set(words, { opacity: 1, y: 0 });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // Animate whole WORDS only — Arabic shaping stays intact
      const spans: HTMLElement[] = [];
      words.forEach((w) => spans.push(...splitWordsSafe(w)));
      gsap.fromTo(
        spans,
        { yPercent: 90, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.7,
          ease: EASE.out,
          stagger: STAGGER.tight,
          scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
        }
      );
      const kickerEl = el.querySelector("[data-kicker]");
      if (kickerEl) {
        gsap.fromTo(
          kickerEl,
          { opacity: 0, x: 14 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            ease: EASE.out,
            scrollTrigger: { trigger: el, start: "top 88%" },
          }
        );
      }
    }, el);
    return () => ctx.revert();
  }, [title]);

  // Split title around accentWord
  let before = title;
  let after = "";
  if (accentWord && title.includes(accentWord)) {
    const idx = title.indexOf(accentWord);
    before = title.slice(0, idx);
    after = title.slice(idx + accentWord.length);
  }

  return (
    <div
      ref={ref}
      className={cn(
        "mb-10 sm:mb-14",
        align === "center" ? "text-center" : "text-right",
        className
      )}
    >
      {kicker && (
        <p
          data-kicker
          className={cn(
            "mb-3 flex items-center gap-2.5 text-[0.7rem] font-bold uppercase tracking-[0.28em] text-primary",
            align === "center" && "justify-center",
            "opacity-0"
          )}
        >
          <span className="inline-block h-px w-7 bg-primary/70" aria-hidden />
          {kicker}
          {align === "center" && <span className="inline-block h-px w-7 bg-primary/70" aria-hidden />}
        </p>
      )}
      <h2 id={titleId} className="font-display text-3xl font-bold leading-[1.2] sm:text-4xl lg:text-[2.75rem]">
        <span data-anim-words className="inline">{before}</span>
        {/* Guarantee a real space between the base title and the accent —
            JSX adjacent inline elements render with NO whitespace, which
            smashed words like "ماركاتنثق فيها" together. */}
        {accentWord && before && !before.endsWith(" ") ? " " : ""}
        {accentWord && <span data-anim-words className="inline text-electric">{accentWord}</span>}
        {after && <span data-anim-words className="inline">{" " + after}</span>}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
