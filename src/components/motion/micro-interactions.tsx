"use client";

/**
 * Micro-interaction primitives:
 *  - AnimatedNumber: GSAP ticker number roll (prices/totals)
 *  - Magnetic: pointer-magnetic hover for CTAs
 *  - Tilt: 3D perspective tilt for product media (desktop pointers only)
 */

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASE, DUR, prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* --------------------------- AnimatedNumber --------------------------- */

export function AnimatedNumber({
  value,
  format = (n: number) => String(Math.round(n)),
  className,
  duration = 0.6,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = format(value);
      prev.current = value;
      return;
    }
    const obj = { n: prev.current };
    const tween = gsap.to(obj, {
      n: value,
      duration,
      ease: EASE.out,
      onUpdate: () => {
        el.textContent = format(obj.n);
      },
    });
    prev.current = value;
    return () => {
      tween.kill();
    };
  }, [value, duration, format]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {format(value)}
    </span>
  );
}

/* ------------------------------- Magnetic ------------------------------ */

export function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    if (window.matchMedia("(hover: none)").matches) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: EASE.out });
    const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: EASE.out });

    const move = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      xTo(dx * strength);
      yTo(dy * strength);
    };
    const leave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [strength]);

  return (
    <div ref={ref} className={cn("inline-block will-change-transform", className)}>
      {children}
    </div>
  );
}

/* --------------------------------- Tilt -------------------------------- */

export function Tilt({
  children,
  className,
  max = 7,
  scale = 1.02,
  style,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  scale?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    if (window.matchMedia("(hover: none)").matches) return;

    const rx = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: EASE.out });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: EASE.out });
    const s = gsap.quickTo(el, "scale", { duration: 0.5, ease: EASE.out });

    const move = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      // Invert Y so the card "looks at" the cursor
      rx(-py * max * 2);
      ry(px * max * 2);
      s(scale);
    };
    const enter = () => gsap.set(el, { transformPerspective: 900 });
    const leave = () => {
      rx(0);
      ry(0);
      s(1);
    };

    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [max, scale]);

  return (
    <div ref={ref} className={cn("will-change-transform", className)} style={style}>
      {children}
    </div>
  );
}

/* ------------------------------ Parallax ------------------------------- */

/** Scroll-linked parallax wrapper (GSAP ScrollTrigger) */
export function Parallax({
  children,
  amount = 60,
  className,
}: {
  children: ReactNode;
  amount?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: amount },
        {
          y: -amount,
          ease: "none",
          scrollTrigger: {
            trigger: el.parentElement ?? el,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        }
      );
    }, el);
    return () => ctx.revert();
  }, [amount]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
