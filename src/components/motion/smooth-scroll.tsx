"use client";

/**
 * SmoothScrollProvider — Lenis + GSAP ScrollTrigger sync.
 * Respects prefers-reduced-motion (native scroll untouched).
 * One instance for the whole app; destroyed on unmount.
 */

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";

let lenisInstance: Lenis | null = null;

/** Expose for router (scroll-to-top on view change) */
export function getLenis(): Lenis | null {
  return lenisInstance;
}

export function scrollTop(immmediate = true): void {
  if (lenisInstance) {
    lenisInstance.scrollTo(0, { immediate: immmediate });
  } else {
    window.scrollTo({ top: 0, behavior: immmediate ? "auto" : "smooth" });
  }
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (prefersReducedMotion()) return; // native scroll stays

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.4,
    });
    lenisInstance = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  return <>{children}</>;
}
