"use client";

/**
 * IntroSplash — one-time brand reveal on first load (~1.1s).
 * Ivory curtain, ink wordmark, cobalt orbital ring — a quiet,
 * premium handshake before the storefront appears.
 * Respects reduced-motion (instant dismiss).
 */

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { EASE, prefersReducedMotion } from "@/lib/motion";
import { BUSINESS } from "@/lib/config";

export function IntroSplash({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      // One-time mount decision reading an external system (matchMedia) —
      // the cleanest place to collapse the splash for reduced-motion users.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGone(true);
      onDone();
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setGone(true);
          onDone();
        },
      });

      tl.fromTo(
        "[data-intro='mark']",
        { opacity: 0, scale: 0.7 },
        { opacity: 1, scale: 1, duration: 0.5, ease: EASE.spring }
      )
        .fromTo(
          "[data-intro='ring']",
          { strokeDasharray: 300, strokeDashoffset: 300 },
          { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" },
          "-=0.35"
        )
        .fromTo(
          "[data-intro='word']",
          { yPercent: 110, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.55, ease: EASE.out, stagger: 0.09 },
          "-=0.5"
        )
        .fromTo(
          "[data-intro='tag']",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4, ease: EASE.out },
          "-=0.2"
        )
        .fromTo(
          "[data-intro='bar']",
          { scaleX: 0 },
          { scaleX: 1, duration: 0.75, ease: "power2.inOut", transformOrigin: "right" },
          "-=0.6"
        )
        .to(el, {
          clipPath: "inset(0 0 100% 0)",
          duration: 0.6,
          ease: EASE.inOut,
          delay: 0.15,
        });
    }, el);

    return () => ctx.revert();
     
  }, []);

  if (gone) return null;

  return (
    <div
      ref={ref}
      aria-hidden
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      style={{ clipPath: "inset(0 0 0% 0)" }}
    >
      {/* Orbital emblem */}
      <div data-intro="mark" className="relative mb-7 h-28 w-28">
        <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5B8FC7" />
              <stop offset="100%" stopColor="#14476F" />
            </linearGradient>
          </defs>
          <ellipse
            data-intro="ring"
            cx="60"
            cy="60"
            rx="52"
            ry="20"
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth="2.5"
            transform="rotate(-16 60 60)"
            strokeLinecap="round"
          />
          <ellipse
            cx="60"
            cy="60"
            rx="52"
            ry="20"
            fill="none"
            stroke="rgba(36,34,29,0.12)"
            strokeWidth="1"
            transform="rotate(58 60 60)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-tech text-5xl font-bold text-silver select-none" style={{ transform: "skewX(-8deg)" }}>
            H
          </span>
        </div>
      </div>

      {/* Wordmark */}
      <div className="overflow-hidden px-2">
        <div className="flex items-baseline gap-1 select-none" style={{ transform: "skewX(-8deg)" }}>
          <span data-intro="word" className="font-tech text-4xl font-bold tracking-tight text-silver sm:text-5xl">
            HYPER
          </span>
          <span data-intro="word" className="font-tech text-4xl font-bold tracking-tight text-electric sm:text-5xl">
            TECH
          </span>
        </div>
      </div>

      <p data-intro="tag" className="mt-4 font-display text-lg font-light tracking-wide text-muted-foreground sm:text-xl">
        {BUSINESS.taglineArabic}
      </p>

      {/* Progress bar */}
      <div className="absolute bottom-16 h-px w-40 overflow-hidden bg-foreground/10">
        <div data-intro="bar" className="h-full w-full bg-primary" />
      </div>

      <div className="pointer-events-none absolute inset-0 orb-glow opacity-60" />
    </div>
  );
}
