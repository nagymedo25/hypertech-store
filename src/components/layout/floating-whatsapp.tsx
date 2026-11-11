"use client";

/**
 * FloatingWhatsApp — persistent quick-contact action.
 * Premium reactive behavior: quietly tucks away while the user
 * scrolls down through content, and glides back the moment they
 * scroll up — so it never smothers card actions at the viewport
 * bottom. Honest copy: يفتح محادثة واتساب (لا يدّعي تسجيل الطلب).
 */

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { whatsappUrl } from "@/lib/config";
import { EASE, DUR, prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function FloatingWhatsApp({ visible = true }: { visible?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    // Gentle float loop on the inner wrapper (outer `y` is reserved
    // for the scroll-tuck so the two tweens never fight)
    const inner = el.querySelector<HTMLElement>(".group");
    if (!inner) return;
    const tween = gsap.to(inner, {
      y: -8,
      duration: 1.6,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
    return () => {
      tween.kill();
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;
    gsap.fromTo(
      el,
      { scale: 0, rotate: -30 },
      { scale: 1, rotate: 0, duration: 0.6, ease: EASE.spring, delay: 1.2 }
    );
  }, []);

  /* Reactive visibility — tuck away scrolling down, glide back scrolling up */
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let lastY = window.scrollY;
    let tucked = false;
    const yTo = gsap.quickTo(el, "y", { duration: DUR.fast, ease: EASE.out });

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (delta > 8 && y > 200 && !tucked) {
        tucked = true;
        yTo(120);
      } else if ((delta < -8 || y < 120) && tucked) {
        tucked = false;
        yTo(0);
      }
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        // safe-area aware: lifts clear of the iOS home indicator
        "fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 z-40 transition-opacity duration-300 sm:bottom-6 sm:left-6",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <div className="group relative">
        <button
          onClick={() => window.open(whatsappUrl("السلام عليكم، عندي استفسار بخصوص منتجات هايبر تك ⚡"), "_blank", "noopener,noreferrer")}
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          onFocus={() => setShowTip(true)}
          onBlur={() => setShowTip(false)}
          className="relative flex h-13 w-13 items-center justify-center rounded-full bg-[#1fae53] p-3.5 shadow-[0_10px_32px_-8px_rgba(31,174,83,0.55)] ring-4 ring-[#1fae53]/15 transition-transform hover:scale-105 active:scale-95"
          aria-label="تواصل معنا عبر واتساب"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" aria-hidden>
            <path d="M12.04 2a9.9 9.9 0 0 0-8.51 14.9L2 22l5.25-1.38A9.9 9.9 0 1 0 12.04 2Zm5.8 14.15c-.25.7-1.45 1.33-2 1.38-.55.05-1.06.25-3.6-.75-3.05-1.2-4.95-4.35-5.1-4.55-.15-.2-1.2-1.6-1.2-3.05 0-1.45.75-2.15 1.02-2.45.27-.3.6-.37.8-.37s.4 0 .57.01c.18.01.43-.07.67.51.25.6.85 2.05.92 2.2.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.61.17.3.75 1.24 1.61 2 1.1.98 2.03 1.29 2.33 1.44.3.15.47.12.64-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.28.1 1.75.83 2.05.98.3.15.5.22.57.35.08.12.08.72-.17 1.42Z" />
          </svg>
        </button>

        <div
          className={cn(
            "pointer-events-none absolute bottom-1/2 left-full ml-3 hidden translate-y-1/2 whitespace-nowrap rounded-xl border border-hair bg-elevated px-3.5 py-2 text-xs font-medium text-foreground shadow-card transition-all duration-300 sm:block",
            showTip ? "opacity-100 translate-x-0" : "translate-x-2 opacity-0"
          )}
          role="tooltip"
        >
          تحب تسأل عن حاجة؟ كلمنا واتساب
          <span className="absolute right-full top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-b border-l border-hair bg-elevated" aria-hidden />
        </div>
      </div>
    </div>
  );
}
