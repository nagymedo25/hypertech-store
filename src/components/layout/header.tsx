"use client";

/**
 * ============================================================
 * Header — light premium navigation (Luxury Light)
 * ============================================================
 *  • Transparent at top → warm ivory glass after slight scroll
 *  • Active-route pill, animated cart badge, search palette
 *  • MOBILE: "Concierge Sheet" — an elegant ivory sheet that
 *    drops smoothly from beneath the header. Snappy masked-row
 *    choreography, elastic chips, fast reverse exit. Calm,
 *    refined, never a hard pop.
 * ============================================================
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import {
  Search,
  ShoppingBag,
  Menu,
  Wrench,
  Cpu,
  Laptop,
  Home,
  Gamepad2,
  X,
  ChevronLeft,
  Facebook,
  Music2,
  Mouse,
  Keyboard,
  MemoryStick,
  HardDrive,
  Headphones,
  MapPin,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { useRouterStore, type Route } from "@/lib/router";
import { useCartStore, cartCount } from "@/lib/store/cart-store";
import { useUIStore } from "@/lib/store/ui-store";
import { useMockDB } from "@/lib/store/db-store";
import { EASE, prefersReducedMotion } from "@/lib/motion";
import { BUSINESS } from "@/lib/config";
import { cn } from "@/lib/utils";
import { WhatsAppIcon, TikTokIcon, FacebookIcon } from "@/components/layout/brand-icons";

const NAV_ITEMS = [
  { label: "الرئيسية", target: { name: "home" } as const, match: "home", icon: Home },
  { label: "المتجر", target: { name: "store" } as const, match: "store", icon: Laptop },
  { label: "تجميعات PC", target: { name: "builds" } as const, match: "builds", icon: Cpu },
  { label: "الصيانة", target: { name: "maintenance" } as const, match: "maintenance", icon: Wrench },
];

/** Category icon-name → Lucide component (admin data stays a string) */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Laptop,
  Gamepad2,
  Mouse,
  Keyboard,
  MemoryStick,
  HardDrive,
  Cpu,
  Headphones,
};

export function Header({ booted }: { booted: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const route = useRouterStore((s) => s.route);
  const navigate = useRouterStore((s) => s.navigate);
  const items = useCartStore((s) => s.items);
  const count = cartCount(items);
  const cartViewed = useCartStore((s) => s.cartViewed);
  const markCartViewed = useCartStore((s) => s.markCartViewed);
  const settings = useMockDB((s) => s.settings);
  const setCartOpen = useUIStore((s) => s.setCartOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    // Toast "عرض السلة" action → open the cart drawer and mark as read
    const openCart = () => {
      useCartStore.getState().markCartViewed();
      useUIStore.getState().setCartOpen(true);
    };
    window.addEventListener("open-cart", openCart);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("open-cart", openCart);
    };
  }, []);

  /* Header entrance after intro */
  useEffect(() => {
    if (!booted) return;
    gsap.fromTo(
      "[data-header]",
      { y: -70, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: EASE.out, stagger: 0.06 }
    );
  }, [booted]);

  const active =
    route.name === NAV_ITEMS.find((n) => n.match === route.name)?.match ? route.name : null;

  return (
    <>
      <header
        data-header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled
            ? "glass shadow-[0_14px_44px_-20px_rgba(36,31,24,0.28)]"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-[4.5rem]">
          {/* Brand */}
          <Link
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              navigate({ name: "home" });
            }}
            className="group flex items-center gap-3"
            aria-label="هايبر تك — الصفحة الرئيسية"
          >
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.storeName || "هايبر تك"}
                className="h-10 max-h-10 w-auto max-w-[140px] object-contain transition-transform group-hover:scale-105"
              />
            ) : (
              <>
                <span className="relative flex h-10 w-10 items-center justify-center">
                  <svg viewBox="0 0 44 44" className="absolute inset-0 h-full w-full text-primary" aria-hidden>
                    <ellipse
                      cx="22"
                      cy="22"
                      rx="19"
                      ry="7.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      transform="rotate(-16 22 22)"
                      className="transition-all duration-500 group-hover:stroke-[#5B8FC7]"
                    />
                  </svg>
                  <span className="font-tech text-xl font-bold text-silver" style={{ transform: "skewX(-8deg)" }}>
                    H
                  </span>
                </span>
                <span className="hidden select-none flex-col leading-none sm:flex">
                  <span className="font-tech text-lg font-bold tracking-tight" style={{ transform: "skewX(-8deg)" }}>
                    <span className="text-silver">HYPER</span>
                    <span className="text-electric"> TECH</span>
                  </span>
                  <span className="mt-1 font-display text-[0.7rem] font-light text-muted-foreground">
                    {settings.tagline || BUSINESS.taglineArabic}
                  </span>
                </span>
              </>
            )}
          </Link>

          {/* Desktop nav */}
          <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.match;
              return (
                <button
                  key={item.match}
                  onClick={() => navigate(item.target)}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-foreground/[0.05] text-foreground"
                      : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                  <span
                    className={cn(
                      "absolute inset-x-4 bottom-1 h-px bg-primary/70 transition-opacity",
                      isActive ? "opacity-100" : "opacity-0"
                    )}
                  />
                </button>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-all hover:border-foreground/10 hover:bg-foreground/[0.05] hover:text-foreground active:scale-95"
              aria-label="بحث في المتجر"
            >
              <Search className="h-5 w-5" />
            </button>

            <button
              onClick={() => {
                markCartViewed();
                setCartOpen(true);
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-all hover:border-foreground/10 hover:bg-foreground/[0.05] hover:text-foreground active:scale-95"
              aria-label={`سلة المشتريات (${count} منتج)`}
            >
              <ShoppingBag className="h-5 w-5" />
              <CartBadge count={count} show={!cartViewed && count > 0} />
            </button>

            <button
              onClick={() => setMobileNavOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 bg-foreground/[0.03] text-foreground transition-transform active:scale-90 md:hidden"
              aria-label="القائمة"
              aria-expanded={mobileNavOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileNav />
    </>
  );
}

/* --------------------------- Cart badge -------------------------------- */

function CartBadge({ count, show = true }: { count: number; show?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!show || count <= 0 || !ref.current) return;
    gsap.fromTo(
      ref.current,
      { scale: 0.4 },
      { scale: 1, duration: 0.5, ease: EASE.elastic }
    );
  }, [count, show]);

  if (!show || count <= 0) return null;
  return (
    <span
      ref={ref}
      className="absolute -top-0.5 -left-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 font-tech text-[0.7rem] font-bold text-primary-foreground glow-accent-sm"
    >
      {count}
    </span>
  );
}

/* ------------------------------ Mobile nav ------------------------------ */

/**
 * MobileNav — "The Concierge Sheet".
 * An elegant ivory sheet drops smoothly from beneath the header:
 * backdrop softens → sheet drops with expo ease → editorial rows
 * rise behind their masks → category chips pop elastically →
 * CTA settles. Exit is the same choreography reversed, accelerated.
 * Always mounted but hidden (visibility) — state never juggles.
 */
function MobileNav() {
  const open = useUIStore((s) => s.mobileNavOpen);
  const setOpen = useUIStore((s) => s.setMobileNavOpen);
  const navigate = useRouterStore((s) => s.navigate);
  const route = useRouterStore((s) => s.route);
  const categories = useMockDB((s) => s.categories);
  const settings = useMockDB((s) => s.settings);

  const rootRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const reducedRef = useRef(false);

  const visibleCategories = [...categories]
    .sort((a, b) => a.order - b.order)
    .filter((c) => c.active !== false)
    .filter((c) => c.slug !== "builds" || settings.showBuildsCategory !== false);

  /* Build the (paused) choreography once on mount */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = prefersReducedMotion();
    reducedRef.current = reduced;

    const ctx = gsap.context(() => {
      // GSAP owns the panel transform from the start (an inline CSS
      // translateY% would be parsed as pixels and never reset)
      gsap.set("[data-mn-panel]", { yPercent: -100 });

      const tl = gsap.timeline({ paused: true });

      tl
        // Root becomes interactive/visible the instant we open
        .set(root, { visibility: "visible" }, 0)
        // Backdrop softens in
        .fromTo(
          "[data-mn-backdrop]",
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: "power1.out" },
          0
        )
        // Sheet drops from beneath the header — smooth expo ease
        .fromTo(
          "[data-mn-panel]",
          { yPercent: -100 },
          { yPercent: 0, duration: 0.52, ease: "expo.out" },
          0.02
        )
        // Brand row settles
        .fromTo(
          "[data-mn-brand]",
          { y: -18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" },
          0.3
        )
        // Big rows rise behind their masks
        .fromTo(
          "[data-mn-row-inner]",
          { yPercent: 112 },
          { yPercent: 0, duration: 0.52, ease: "power4.out", stagger: 0.055 },
          0.33
        )
        // Row icons soften in
        .fromTo(
          "[data-mn-row-icon]",
          { scale: 0.6, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.42, ease: EASE.spring, stagger: 0.055 },
          0.43
        )
        // Active bar draws
        .fromTo(
          "[data-mn-row-bar]",
          { scaleY: 0 },
          { scaleY: 1, duration: 0.35, ease: "power3.out", transformOrigin: "top" },
          0.52
        )
        // Section label + category chips
        .fromTo(
          "[data-mn-label]",
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
          0.58
        );

      const chips = root.querySelectorAll("[data-mn-chip]");
      if (chips.length > 0) {
        tl.fromTo(
          chips,
          { opacity: 0, y: 12, scale: 0.92 },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: EASE.spring, stagger: 0.045 },
          0.63
        );
      }

      tl
        // CTA + social row rise
        .fromTo(
          "[data-mn-cta]",
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" },
          0.74
        )
        .fromTo(
          "[data-mn-social]",
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.34, ease: "power2.out", stagger: 0.05 },
          0.8
        );

      tlRef.current = tl;
    }, root);

    return () => ctx.revert();
  }, []);

  /* Play / reverse when `open` flips — exit runs accelerated */
  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    if (reducedRef.current) {
      tl.progress(open ? 1 : 0);
    } else if (open) {
      tl.timeScale(1).play();
    } else {
      tl.timeScale(1.55).reverse();
    }
  }, [open]);

  /* Scroll lock while the sheet is on screen */
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  /* Escape closes */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  /* Focus the close button for keyboard users when opened */
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      rootRef.current
        ?.querySelector<HTMLButtonElement>("[data-mn-close-btn]")
        ?.focus({ preventScroll: true });
    }, 80);
    return () => window.clearTimeout(t);
  }, [open]);

  const active = route.name;

  const go = (target: Route) => {
    navigate(target);
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[70] md:hidden"
      style={{ visibility: "hidden" }}
      role="dialog"
      aria-modal="true"
      aria-label="قائمة التنقل"
    >
      {/* Backdrop */}
      <button
        data-mn-backdrop
        className="absolute inset-0 bg-[#24221d]/35 backdrop-blur-[6px]"
        onClick={() => setOpen(false)}
        aria-label="إغلاق القائمة"
        tabIndex={-1}
      />

      {/* The sheet — drops from the top, ivory, rounded foot */}
      <div
        data-mn-panel
        className="absolute inset-x-0 top-0 flex h-full flex-col overflow-hidden rounded-b-[1.75rem] border-b border-hair bg-background shadow-[0_30px_80px_-20px_rgba(36,31,24,0.35)]"
      >
        {/* Atmosphere — whisper-quiet drafting grid */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-grid-fine opacity-60" />
          <div className="absolute -top-[18vh] left-1/2 h-[45vh] w-[85vw] -translate-x-1/2 orb-glow opacity-70" />
        </div>

        {/* Brand header */}
        <div className="relative flex items-center justify-between border-b border-hair px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4">
          <div data-mn-brand>
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.storeName || "هايبر تك"}
                className="h-8 max-h-8 w-auto max-w-[130px] object-contain"
              />
            ) : (
              <span className="font-tech text-xl font-bold" style={{ transform: "skewX(-8deg)" }}>
                <span className="text-silver">HYPER</span>
                <span className="text-electric"> TECH</span>
              </span>
            )}
          </div>
          <button
            data-mn-close-btn
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 bg-elevated text-foreground transition-transform active:scale-90"
            aria-label="إغلاق القائمة"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-y-auto px-6 py-6 overscroll-contain">
          {/* Main destinations — big editorial rows */}
          <ul className="divide-y divide-hair/70">
            {NAV_ITEMS.map((item, i) => {
              const isActive = active === item.match;
              return (
                <li key={item.match}>
                  <button
                    onClick={() => go(item.target)}
                    className="group relative flex w-full items-center gap-4 py-4 text-right"
                    aria-current={isActive ? "page" : undefined}
                  >
                    {/* Active bar (start side in RTL) — always mounted
                        so GSAP targets stay stable across route changes */}
                    <span
                      data-mn-row-bar
                      className={cn(
                        "absolute top-3 bottom-3 right-0 w-1 rounded-full",
                        isActive ? "bg-primary" : "bg-transparent"
                      )}
                      aria-hidden
                    />
                    {/* Masked row */}
                    <span className="block overflow-hidden">
                      <span data-mn-row-inner className="flex items-center gap-4">
                        <span
                          data-mn-row-icon
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-colors",
                            isActive
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-foreground/10 bg-elevated text-muted-foreground group-hover:text-foreground"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                        </span>
                        <span
                          className={cn(
                            "font-display text-2xl font-bold transition-colors",
                            isActive ? "text-foreground" : "text-foreground/85 group-hover:text-foreground"
                          )}
                        >
                          {item.label}
                        </span>
                        <span className="mr-auto font-tech text-xs font-bold tracking-widest text-faint" dir="ltr">
                          0{i + 1}
                        </span>
                        <ChevronLeft className="h-5 w-5 text-faint transition-transform group-hover:-translate-x-1" />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Categories */}
          <p data-mn-label className="mt-7 mb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            تصفح الفئات
          </p>
          <div className="flex flex-wrap gap-2.5">
            {visibleCategories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.icon] ?? Cpu;
              return (
                <button
                  key={cat.id}
                  data-mn-chip
                  onClick={() => go({ name: "store", categorySlug: cat.slug })}
                  className="flex items-center gap-2 rounded-xl border border-hair bg-elevated px-4 py-3 text-sm font-semibold transition-all hover:border-foreground/25 hover:bg-raised active:scale-95"
                >
                  <Icon className="h-4 w-4" style={{ color: cat.accent }} />
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Contact strip — fills the mid sheet with useful, verified info */}
          <div data-mn-label className="mt-9 rounded-2xl border border-hair bg-elevated p-4">
            <p className="mb-2.5 text-[0.65rem] font-bold uppercase tracking-widest text-faint">تواصل مباشر</p>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2.5 text-sm font-bold" dir="ltr">
                <MessageCircle className="h-4 w-4 text-[#1fae53]" aria-hidden />
                <span className="font-tech tracking-wide">{BUSINESS.whatsappDisplay}</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden />
                {BUSINESS.city}
              </span>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="relative border-t border-hair px-6 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3">
            <a
              data-mn-cta
              href={`https://wa.me/${BUSINESS.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1fae53] px-4 py-4 font-bold text-white shadow-[0_10px_28px_-10px_rgba(31,174,83,0.5)] transition-transform active:scale-[0.98]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              تواصل واتساب
            </a>
            <a
              data-mn-social
              href={BUSINESS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-2xl border border-hair bg-elevated text-[#1877F2] transition-all active:scale-95"
              aria-label="صفحتنا على فيسبوك"
            >
              <FacebookIcon className="h-5 w-5" />
            </a>
            <a
              data-mn-social
              href={BUSINESS.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-2xl border border-hair bg-elevated text-foreground/80 transition-all active:scale-95"
              aria-label="حسابنا على تيك توك"
            >
              <TikTokIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
