"use client";

/**
 * Reveal — the standard scroll-entrance primitive.
 * direction: up | down | start(RTL-aware right) | end(RTL-aware left) | scale | clip
 * All animations respect prefers-reduced-motion (instantly visible).
 */

import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASE, DUR, STAGGER, prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Dir = "up" | "down" | "start" | "end" | "scale" | "clip" | "fade";

const OFFSETS: Record<Dir, { x?: number; y?: number }> = {
  up: { y: 44 },
  down: { y: -44 },
  start: { x: 48 }, // enters from the start side (right in RTL)
  end: { x: -48 },
  scale: {},
  clip: {},
  fade: {},
};

export function Reveal({
  children,
  dir = "up",
  delay = 0,
  duration = DUR.base,
  className,
  style,
  once = true,
  as: Tag = "div",
}: {
  children: ReactNode;
  dir?: Dir;
  delay?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
  once?: boolean;
  as?: "div" | "section" | "span" | "li" | "h2" | "h3" | "p" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);

    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, clearProps: "transform" });
      return;
    }

    const from: gsap.TweenVars = { opacity: 0, ...OFFSETS[dir] };
    if (dir === "scale") from.scale = 0.92;
    if (dir === "clip") from.clipPath = "inset(0 0 100% 0)";

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        from,
        {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          clipPath: dir === "clip" ? "inset(0 0 0% 0)" : undefined,
          duration,
          delay,
          ease: EASE.out,
          clearProps: "transform,clipPath",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: once ? "play none none none" : "play none none reverse",
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [dir, delay, duration, once]);

  const Component = Tag as any;
  return (
    <Component
      ref={ref as any}
      className={cn("will-change-transform", className)}
      style={{ visibility: undefined, ...style }}
    >
      {children}
    </Component>
  );
}

/**
 * StaggerReveal — container that staggers its direct children in.
 */
export function StaggerReveal({
  children,
  className,
  stagger = STAGGER.base,
  dir = "up",
  start = "top 85%",
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  dir?: Dir;
  start?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);

    const kids = Array.from(el.children) as HTMLElement[];
    if (!kids.length) return;

    if (prefersReducedMotion()) {
      gsap.set(kids, { opacity: 1 });
      return;
    }

    const from: gsap.TweenVars = { opacity: 0, ...OFFSETS[dir] };
    if (dir === "scale") from.scale = 0.94;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        kids,
        from,
        {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: DUR.base,
          ease: EASE.out,
          stagger,
          clearProps: "transform",
          scrollTrigger: { trigger: el, start, toggleActions: "play none none none" },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [stagger, dir, start]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
