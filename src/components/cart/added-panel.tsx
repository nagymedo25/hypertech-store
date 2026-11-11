"use client";

/**
 * ============================================================
 * HYPER TECH — AddedPanel (Task C · لوحة «تمت الإضافة إلى السلة»)
 * ============================================================
 * Amazon-style persistent add-to-cart confirmation sheet.
 *
 * • Trigger: `markAdded()` in the cart store (called right after
 *   `add()` from product cards & the product page).
 * • GSAP slide-up (yPercent 100 → 0, power3.out, 0.45s) with
 *   prefers-reduced-motion → instant.
 * • PERSISTENCE: state lives in the persisted cart store, so the
 *   panel survives view navigation, scrolling and page refresh.
 *   It is dismissed ONLY explicitly: ✕ button, Escape key,
 *   «متابعة التسوق», or «عرض السلة» (navigate + dismiss).
 *   It auto-dismisses only when the added product leaves the cart.
 *
 * Positioning — viewport-fixed (never trapped at a page bottom):
 *   mobile → full-width bottom sheet (rounded top + safe-area pad)
 *   md+    → centered floating card (max-w-lg, bottom margin)
 * GSAP animates the INNER surface only; the OUTER wrapper keeps
 * the Tailwind centering transform (-translate-x-1/2) untouched,
 * so the two transform systems never fight.
 * No scrim on purpose — the page stays fully interactive while
 * the panel persists (clicking outside intentionally does NOT
 * dismiss; only ✕ / Escape do).
 * ============================================================
 */

import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { ArrowLeft, Check, ShoppingBag, X } from "lucide-react";
import { useCartStore, cartCount } from "@/lib/store/cart-store";
import { useMockDB } from "@/lib/store/db-store";
import { useRouterStore } from "@/lib/router";
import { formatPrice } from "@/lib/format";
import { AnimatedNumber } from "@/components/motion/micro-interactions";
import { EASE, prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* Module-level formatter — stable identity for AnimatedNumber deps */
const fmtPrice = (n: number) => formatPrice(n);

/** Arabic item-count copy (Egyptian dialect, correct plural forms) */
function countLabel(n: number): string {
  if (n === 1) return "منتج واحد في السلة";
  if (n === 2) return "منتجين في السلة";
  if (n >= 3 && n <= 10) return `${n} منتجات في السلة`;
  return `${n} منتج في السلة`;
}

/** Availability line — mint for in-stock, amber for low-stock */
function availabilityLine(status: string): { label: string; className: string } {
  switch (status) {
    case "in-stock":
      return { label: "متاح الآن", className: "text-mint" };
    case "low-stock":
      return { label: "كمية محدودة", className: "text-amber" };
    case "pre-order":
      return { label: "حجز مسبق", className: "text-primary" };
    default:
      return { label: "غير متوفر حاليًا", className: "text-danger" };
  }
}

export function AddedPanel() {
  const items = useCartStore((s) => s.items);
  const panelOpen = useCartStore((s) => s.panelOpen);
  const lastAdded = useCartStore((s) => s.lastAdded);
  const setPanelOpen = useCartStore((s) => s.setPanelOpen);
  const products = useMockDB((s) => s.products);
  const navigate = useRouterStore((s) => s.navigate);

  /* Real product data (server is the source of truth) */
  const product = lastAdded ? products.find((p) => p.id === lastAdded.productId) : undefined;
  const lineItem = lastAdded ? items.find((i) => i.productId === lastAdded.productId) : undefined;

  /* Visibility contract: panel flag + a lastAdded that is STILL in the cart */
  const visible = panelOpen && !!lastAdded && !!lineItem && !!product;

  /* Live subtotal across the WHOLE cart (real prices from the DB) */
  const subtotal = useMemo(
    () =>
      items.reduce((acc, i) => {
        const p = products.find((pp) => pp.id === i.productId);
        return acc + (p ? p.price * i.qty : 0);
      }, 0),
    [items, products]
  );
  const count = cartCount(items);

  const panelRef = useRef<HTMLDivElement>(null);
  const lastAtRef = useRef(0);

  /* ---------------- Slide in / out (inner surface only) ---------------- */
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    gsap.killTweensOf(el);
    if (visible) {
      if (prefersReducedMotion()) {
        gsap.set(el, { yPercent: 0, y: 0 });
      } else {
        gsap.fromTo(
          el,
          { yPercent: 100, y: 0 },
          { yPercent: 0, y: 0, duration: 0.45, ease: EASE.out }
        );
      }
    } else if (prefersReducedMotion()) {
      gsap.set(el, { yPercent: 100, y: 0 });
    } else {
      gsap.to(el, { yPercent: 100, y: 0, duration: 0.3, ease: "power3.in" });
    }
  }, [visible]);

  /* ------- Stacked adds: replace + subtle attention bounce (y wiggle) ------- */
  useEffect(() => {
    const el = panelRef.current;
    if (!el || !lastAdded) return;
    if (lastAtRef.current === lastAdded.at) return; // no fresh add
    lastAtRef.current = lastAdded.at;
    if (!visible || prefersReducedMotion()) return;
    if (gsap.isTweening(el)) return; // entrance still in flight — it is the feedback
    gsap.fromTo(el, { y: 0 }, {
      y: -10,
      duration: 0.18,
      ease: "power2.out",
      yoyo: true,
      repeat: 1,
      repeatDelay: 0.05,
    });
  }, [lastAdded, visible]);

  /* ------- Auto-dismiss: the added product left the cart (removed/qty→0) ------- */
  useEffect(() => {
    if (panelOpen && lastAdded && !lineItem) setPanelOpen(false);
  }, [panelOpen, lastAdded, lineItem, setPanelOpen]);

  /* ------- Escape closes (outside click deliberately does NOT) ------- */
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, setPanelOpen]);

  const dismiss = () => setPanelOpen(false);
  const viewCart = () => {
    setPanelOpen(false);
    navigate({ name: "cart" });
  };
  const viewProduct = () => {
    if (!product) return;
    setPanelOpen(false);
    navigate({ name: "product", slug: product.slug });
  };

  const avail = product ? availabilityLine(product.availability) : null;
  const lineQty = lineItem?.qty ?? 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[85] md:inset-x-auto md:bottom-6 md:left-1/2 md:w-full md:max-w-lg md:-translate-x-1/2">
      <div
        ref={panelRef}
        role="region"
        aria-label="تأكيد الإضافة إلى السلة"
        dir="rtl"
        inert={!visible}
        aria-hidden={!visible}
        style={{ transform: "translateY(100%)" }}
        className="pointer-events-auto overflow-hidden rounded-t-[1.75rem] border-t border-hair bg-elevated shadow-card-lg md:rounded-3xl md:border md:border-hair"
      >
        {visible && product && (
          <div
            className="relative p-5 sm:p-6"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
          >
            {/* Mobile sheet grabber (visual affordance only) */}
            <span
              aria-hidden
              className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-foreground/15 md:hidden"
            />

            {/* ✕ — top-left corner; the ONLY click dismissal (+ Escape) */}
            <button
              type="button"
              onClick={dismiss}
              className="absolute left-2.5 top-2.5 flex h-10 w-10 items-center justify-center rounded-xl text-faint transition-all hover:bg-foreground/[0.06] hover:text-foreground active:scale-90"
              aria-label="إغلاق لوحة الإضافة"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

            {/* Screen-reader confirmation (visual feedback is the panel itself) */}
            <p className="sr-only" aria-live="polite">
              تمت إضافة {product.name} إلى السلة — إجمالي السلة {formatPrice(subtotal)}
            </p>

            {/* Success header */}
            <div className="flex items-center gap-3.5 pl-12">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-mint/30 bg-mint/10">
                <Check className="h-5 w-5 text-mint" strokeWidth={2.75} aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-base font-bold leading-6 sm:text-lg sm:leading-7">
                  تمت الإضافة إلى السلة
                </h2>
                <p className="truncate text-xs text-muted-foreground">
                  خلاص، «{product.name}» في سلتك
                </p>
              </div>
            </div>

            {/* Product line — real image, real live price, qty badge */}
            <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-hair bg-raised/50 p-3">
              <button
                type="button"
                onClick={viewProduct}
                className="relative flex h-20 w-20 shrink-0 aspect-square items-center justify-center overflow-hidden rounded-xl border border-hair bg-[#0d0f13] p-1.5"
                aria-label={`عرض ${product.name}`}
              >
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="h-full w-full object-contain img-grade"
                />
                {lineQty > 1 && (
                  <span
                    dir="ltr"
                    className="absolute bottom-1.5 left-1.5 rounded-full bg-[#24221d]/75 px-2 py-0.5 font-tech text-[0.65rem] font-bold tabular-nums text-white backdrop-blur-sm"
                  >
                    ×{lineQty}
                  </span>
                )}
              </button>

              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={viewProduct}
                  className="line-clamp-2 text-right text-sm font-bold leading-6 transition-colors hover:text-primary"
                >
                  {product.name}
                </button>
                {avail && (
                  <p
                    className={cn(
                      "mt-1.5 flex items-center gap-1.5 text-[0.7rem] font-semibold",
                      avail.className
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                    {avail.label}
                  </p>
                )}
              </div>

              <div className="shrink-0 text-left">
                <p className="font-tech text-sm font-bold tabular-nums">
                  {formatPrice(product.price * lineQty)}
                </p>
                {lineQty > 1 && (
                  <p className="mt-0.5 font-tech text-[0.65rem] tabular-nums text-muted-foreground">
                    {formatPrice(product.price)} للوحدة
                  </p>
                )}
              </div>
            </div>

            {/* Updated subtotal — full-width row */}
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-hair pt-4">
              <div className="min-w-0">
                <p className="font-display text-sm font-bold sm:text-base">إجمالي السلة</p>
                <p className="mt-0.5 text-[0.7rem] text-muted-foreground">{countLabel(count)}</p>
              </div>
              <span className="shrink-0 font-tech text-lg font-bold tabular-nums text-primary sm:text-xl">
                <AnimatedNumber value={subtotal} format={fmtPrice} />
              </span>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={viewCart}
                className="glow-accent-sm flex min-h-[3.25rem] min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-md transition-all hover:bg-[#2a6cb3] active:scale-[0.98]"
              >
                <ShoppingBag className="h-5 w-5" aria-hidden />
                عرض السلة وإتمام الطلب
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="flex min-h-[3.25rem] shrink-0 items-center justify-center gap-2 rounded-2xl border border-hair px-6 py-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground active:scale-[0.98]"
              >
                متابعة التسوق
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
