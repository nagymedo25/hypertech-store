"use client";

/**
 * ============================================================
 * HERO v3.1 — "THE SHOWCASE" · product-driven luxury gallery.
 * ============================================================
 * The hero behaves like a premium product gallery — and since
 * v3.1 it is wired to a REAL product from the production
 * database (the server's intelligent pick, exposed by the store
 * as `heroProduct`, kept fresh against live catalog edits):
 *
 *   • the gallery plate displays the hero product's real photo
 *     (dark display-window treatment; sheen, breathing float,
 *     parallax all preserved — falls back to the curated
 *     showcase image if the photo fails to load);
 *   • the floating spec chips are derived from the product's
 *     REAL specs (keyword-matched icons, up to four chips);
 *   • the shoppable card shows the live price, old price +
 *     discount badge, promo pill and the true availability;
 *   • while the database is still bootstrapping, the plate
 *     renders as a skeleton — no fake data, ever.
 *
 *  1. CURATED ENTRANCE (GSAP master timeline, fires when the
 *     intro splash lifts): kicker pill settles → massive SOLID
 *     Alexandria headline lines rise behind clip masks
 *     (Arabic-safe: whole lines) → the product plate is
 *     unveiled from a soft veil → floating spec chips pop in
 *     elastically, one after another → a shoppable price card
 *     slides in → stats count up.
 *
 *  2. LIVING IDLE: the plate breathes (gyroscopic float), each
 *     chip drifts on its own phase, the orbital ring rotates
 *     almost imperceptibly, a gallery sheen sweeps the plate,
 *     and on desktop the whole stage answers the pointer with
 *     parallax depth (plate slow, chips fast, ring opposite).
 *
 *  3. LEAVING THE GALLERY (ScrollTrigger scrub): the stage
 *     drifts and settles back while the copy rises away —
 *     like walking past a shop window.
 *
 * Every glyph is solid ink — nothing transparent, nothing
 * worn. Calm, expensive, deliberate.
 * ============================================================
 */

import { useLayoutEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronDown,
  Cpu,
  Gauge,
  HardDrive,
  MemoryStick,
  Monitor,
  PackageCheck,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IMG } from "@/lib/data/images";
import { BUSINESS } from "@/lib/config";
import { useRouterStore } from "@/lib/router";
import { useMockDB } from "@/lib/store/db-store";
import { discountPercent, formatPriceCompact } from "@/lib/format";
import { EASE, prefersReducedMotion } from "@/lib/motion";
import { PromoBadge } from "@/components/store/catalog-atoms";
import type { Product, ProductAvailability, SpecItem } from "@/types";

/* ============================================================
 * REAL-DATA CHIP CONFIGURATION
 * ============================================================
 * The chip frame (design, anchor positions, elastic pop-in)
 * is identical to v3 — only the CONTENT became dynamic: each
 * chip carries a real spec of the hero product. */

const CHIP_POSITIONS = [
  "-top-5 -right-3 lg:-right-6",
  "top-[28%] -left-3 lg:-left-7",
  "bottom-[24%] -right-4 lg:-right-9",
  "-bottom-5 -left-3 lg:-left-6",
] as const;

/** Spec keyword → icon, in display priority order. */
const CHIP_RULES: { icon: LucideIcon; test: RegExp }[] = [
  // كارت الشاشة / GPU — claims the graphics spec before the display rule
  { icon: Zap, test: /كارت|كرت|جرافيك|GPU|RTX|GTX|NVIDIA|VGA/i },
  { icon: Cpu, test: /معالج|بروسيسور|CPU|Processor|Core|Ryzen|Pentium|Celeron/i },
  { icon: MemoryStick, test: /ذاكرة|رامات|رام|RAM|DDR/i },
  { icon: HardDrive, test: /تخزين|هارد|SSD|HDD|NVMe|Storage|قرص/i },
  { icon: Monitor, test: /شاشة|بوصة|دقة|Display|Monitor|Hz|Refresh/i },
];

/** Availability presentation next to the real price. */
const HERO_AVAILABILITY: Record<ProductAvailability, { label: string; dot: string; text: string }> = {
  "in-stock": { label: "متاح الآن", dot: "bg-mint animate-pulse-dot", text: "text-mint" },
  "low-stock": { label: "كمية محدودة", dot: "bg-amber", text: "text-amber" },
  "pre-order": { label: "حجز مسبق", dot: "bg-faint", text: "text-muted-foreground" },
  "out-of-stock": { label: "غير متوفر حاليًا", dot: "bg-danger", text: "text-danger" },
};

interface HeroChip {
  icon: LucideIcon;
  title: string;
  sub: string;
  pos: string;
}

const specKey = (s: SpecItem) => `${s.label}::${s.value}`;

/**
 * Condenses a raw spec value for chip display: drops trailing
 * parenthetical notes (e.g. "16GB DDR5 (قابلة للترقية)") and
 * trailing " — …" detail tails (e.g. "Intel Core i7-12700H — 14 نواة")
 * so the core technical value fits the chip without ellipses.
 * The full value stays untouched on the product page.
 */
function condenseSpecValue(value: string): string {
  const raw = value.trim();
  let v = raw.replace(/\s*\([^)]*\)\s*$/, "").trim();
  v = v.split(/\s+[—–]\s+/)[0].trim();
  return v || raw;
}

/**
 * Derives up to 4 floating chips from the hero product's REAL
 * specs: keyword-matched specs first (GPU → CPU → RAM → Storage
 * → Display priority), remaining specs fill any free slot. No
 * specs at all → two honest generic chips (brand + availability).
 * Never invents technical values.
 */
function deriveHeroChips(product: Product): HeroChip[] {
  const chips: HeroChip[] = [];
  const used = new Set<string>();
  const place = (icon: LucideIcon, spec: SpecItem) => {
    if (chips.length >= CHIP_POSITIONS.length) return;
    const key = specKey(spec);
    if (used.has(key)) return;
    used.add(key);
    chips.push({
      icon,
      title: condenseSpecValue(spec.value),
      sub: spec.label.trim(),
      pos: CHIP_POSITIONS[chips.length],
    });
  };

  const specs = (product.specs ?? []).filter(
    (s) => (s.value ?? "").trim().length > 0 && (s.label ?? "").trim().length > 0
  );

  if (specs.length === 0) {
    // Honest fallback — brand + availability, never fake specs
    if (product.brand?.trim()) {
      chips.push({
        icon: BadgeCheck,
        title: product.brand.trim(),
        sub: "الماركة",
        pos: CHIP_POSITIONS[chips.length],
      });
    }
    const avail = HERO_AVAILABILITY[product.availability] ?? HERO_AVAILABILITY["in-stock"];
    chips.push({ icon: PackageCheck, title: avail.label, sub: "التوفر", pos: CHIP_POSITIONS[chips.length] });
    return chips;
  }

  for (const rule of CHIP_RULES) {
    if (chips.length >= CHIP_POSITIONS.length) break;
    const hit = specs.find((s) => !used.has(specKey(s)) && rule.test.test(`${s.label} ${s.value}`));
    if (hit) place(rule.icon, hit);
  }
  // Fill any remaining slots from the product's other real specs
  for (const s of specs) {
    if (chips.length >= CHIP_POSITIONS.length) break;
    place(Gauge, s);
  }
  return chips;
}

export function Hero({ booted }: { booted: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const navigate = useRouterStore((s) => s.navigate);
  const products = useMockDB((s) => s.products);
  const categories = useMockDB((s) => s.categories);
  const settings = useMockDB((s) => s.settings);
  const heroProduct = useMockDB((s) => s.heroProduct);

  /* The showcase product — the server's intelligent pick, kept
     fresh against live catalog edits (same id → newest data),
     with a client-side fallback chain if the pick ever leaves
     the catalog. Null while the DB is still bootstrapping. */
  const hero = useMemo(() => {
    if (heroProduct) {
      const fresh = products.find((p) => p.id === heroProduct.id);
      if (fresh) return fresh;
    }
    return (
      products.find((p) => p.featured && p.availability !== "out-of-stock" && p.images.length > 0) ??
      products.find((p) => p.availability === "in-stock" && p.images.length > 0) ??
      null
    );
  }, [heroProduct, products]);

  const chips = useMemo(() => (hero ? deriveHeroChips(hero) : []), [hero]);

  const visibleCategoryCount = categories.filter(
    (c) => c.active !== false && (c.slug !== "builds" || settings.showBuildsCategory !== false)
  ).length;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    gsap.registerPlugin(ScrollTrigger);

    const reduced = prefersReducedMotion();
    // Real-data presence — chips / shoppable card exist only once
    // the hero product has arrived (selector guards keep the GSAP
    // choreography identical for whatever chip count it yields).
    const hasChips = chips.length > 0;
    const hasCard = !!hero;
    let bootWatch: ReturnType<typeof setInterval> | undefined;
    let safetyTimer: ReturnType<typeof setTimeout> | undefined;

    const ctx = gsap.context(() => {
      /* ---------- Static reveal targets (initial hidden states) ---------- */
      // Chips / shoppable card exist only once real data arrived —
      // their selectors are included conditionally so the GSAP
      // choreography stays exactly the same for whatever count
      // of chips the hero product yields.
      const fadeTargets = [
        "[data-hero-kicker]",
        "[data-hero-desc]",
        "[data-hero-cta]",
        "[data-hero-stats]",
        ...(hasChips ? ["[data-hero-chip]"] : []),
        ...(hasCard ? ["[data-hero-card]"] : []),
      ].join(", ");
      gsap.set(fadeTargets, { opacity: 0, y: 22 });
      gsap.set("[data-hero-line]", { yPercent: 115 });
      gsap.set("[data-hero-plate]", { opacity: 0, y: 44, scale: 0.965 });
      if (hasChips) gsap.set("[data-hero-chip]", { opacity: 0, scale: 0.55, y: 18 });
      if (hasCard) gsap.set("[data-hero-card]", { opacity: 0, y: 26, scale: 0.94 });
      gsap.set("[data-hero-ring]", { strokeDasharray: 340, strokeDashoffset: 340 });
      gsap.set("[data-hero-sheen]", { xPercent: -130, opacity: 0 });
      gsap.set("[data-hero-cue]", { opacity: 0 });
      gsap.set("[data-hero-stat-value]", { textContent: 0 });

      if (reduced) {
        gsap.set([...fadeTargets.split(", "), "[data-hero-cue]"].join(", "), {
          opacity: 1,
          y: 0,
          scale: 1,
        });
        gsap.set("[data-hero-line]", { yPercent: 0 });
        gsap.set("[data-hero-plate]", { opacity: 1, y: 0, scale: 1 });
        gsap.set("[data-hero-ring]", { strokeDashoffset: 0 });
        gsap.set("[data-hero-stat-value]", {
          textContent: (i, el) => el.dataset.target ?? "",
        });
        return;
      }

      /* ------------------- Master entrance ------------------- */
      const enter = gsap.timeline({ paused: true, defaults: { ease: EASE.out } });

      enter
        // Orbital ring draws itself
        .to("[data-hero-ring]", { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" }, 0.05)
        // Kicker settles
        .to("[data-hero-kicker]", { opacity: 1, y: 0, duration: 0.5 }, 0.15)
        // Headline lines rise behind their masks
        .to("[data-hero-line]", { yPercent: 0, duration: 0.85, stagger: 0.12, ease: "power4.out" }, 0.28)
        // Plate unveils
        .to("[data-hero-plate]", { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "power3.out" }, 0.42)
        // Copy block
        .to("[data-hero-desc]", { opacity: 1, y: 0, duration: 0.55 }, 0.62)
        .to("[data-hero-cta]", { opacity: 1, y: 0, duration: 0.55 }, 0.74);
      // Real spec chips pop elastically (whatever count they are)
      if (hasChips) {
        enter.to(
          "[data-hero-chip]",
          { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: EASE.spring, stagger: 0.09 },
          0.78
        );
      }
      if (hasCard) {
        // Shoppable card slides in
        enter.to(
          "[data-hero-card]",
          { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: "back.out(1.4)" },
          1.02
        );
      }
      enter
        .to("[data-hero-stats]", { opacity: 1, y: 0, duration: 0.6 }, 0.9)
        // Stats count up
        .to(
          "[data-hero-stat-value]",
          {
            textContent: (i, el) => Number(el.dataset.target ?? 0),
            duration: 1.1,
            ease: "power2.out",
            snap: { textContent: 1 },
            onUpdate: function () {
              document.querySelectorAll<HTMLElement>("[data-hero-stat-value]").forEach((el) => {
                const isLatin = el.dataset.latin === "true";
                const n = Number(el.textContent?.replace(/[^\d]/g, "") ?? 0);
                const suffix = el.dataset.suffix ?? "";
                el.textContent = isLatin
                  ? n.toLocaleString("en-US") + suffix
                  : String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]) + suffix;
              });
            },
          },
          1.0
        )
        // Scroll cue
        .to("[data-hero-cue]", { opacity: 1, duration: 0.5 }, 1.3);

      /* ------------------- Living idle ------------------- */
      // Plate breathes — gyroscopic float
      gsap.to("[data-hero-plate]", {
        y: 10,
        rotation: 0.7,
        duration: 3.4,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
      // Chips drift on individual phases
      chips.forEach((_, i) => {
        gsap.to(`[data-hero-chip='${i}']`, {
          y: i % 2 === 0 ? -9 : 9,
          duration: 2.4 + i * 0.5,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          delay: i * 0.35,
        });
      });
      // Ring rotates almost imperceptibly
      gsap.to("[data-hero-ring-group]", {
        rotation: 360,
        duration: 90,
        repeat: -1,
        ease: "none",
        transformOrigin: "center",
      });
      // Gallery sheen sweeps the plate periodically
      const sheenTl = gsap.timeline({ repeat: -1, repeatDelay: 4.2 });
      sheenTl
        .set("[data-hero-sheen]", { xPercent: -130, opacity: 0 })
        .to("[data-hero-sheen]", { opacity: 1, duration: 0.2 }, 0)
        .to("[data-hero-sheen]", { xPercent: 130, duration: 1.4, ease: "power2.inOut" }, 0)
        .to("[data-hero-sheen]", { opacity: 0, duration: 0.25 }, 1.15);

      /* ------------------- Pointer parallax (desktop) ------------------- */
      const stage = section.querySelector<HTMLElement>("[data-hero-stage]");
      if (stage && window.matchMedia("(pointer: fine)").matches) {
        const qxPlate = gsap.quickTo("[data-hero-plate]", "x", { duration: 0.9, ease: "power3.out" });
        const qyPlate = gsap.quickTo("[data-hero-plate]", "y", { duration: 0.9, ease: "power3.out" });
        const qxChips = gsap.quickTo("[data-hero-chips]", "x", { duration: 1.1, ease: "power3.out" });
        const qyChips = gsap.quickTo("[data-hero-chips]", "y", { duration: 1.1, ease: "power3.out" });
        const qxRing = gsap.quickTo("[data-hero-ring-group]", "x", { duration: 1.3, ease: "power3.out" });
        const qyRing = gsap.quickTo("[data-hero-ring-group]", "y", { duration: 1.3, ease: "power3.out" });

        const onMove = (e: PointerEvent) => {
          const r = stage.getBoundingClientRect();
          const dx = (e.clientX - r.left) / r.width - 0.5; // -0.5..0.5
          const dy = (e.clientY - r.top) / r.height - 0.5;
          qxPlate(dx * 10);
          qyPlate(dy * 8);
          qxChips(dx * -22);
          qyChips(dy * -16);
          qxRing(dx * 16);
          qyRing(dy * 12);
        };
        stage.addEventListener("pointermove", onMove);
        // cleanup stored on context
        (gsap as unknown as { _heroCleanup?: () => void })._heroCleanup = () =>
          stage.removeEventListener("pointermove", onMove);
      }

      /* ------------------- Leaving the gallery ------------------- */
      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom 35%",
            scrub: 0.6,
          },
        })
        .to("[data-hero-copy]", { y: -46, opacity: 0.4, ease: "none" }, 0)
        .to("[data-hero-stage]", { y: 54, scale: 0.965, ease: "none" }, 0)
        .to("[data-hero-cue]", { opacity: 0, ease: "none" }, 0);

      /* Play entrance when the splash lifts */
      if (booted) enter.play();
      else {
        const check = setInterval(() => {
          if (booted) {
            enter.play();
            clearInterval(check);
          }
        }, 120);
        bootWatch = check;
        // Safety: always start within 1.6s
        safetyTimer = setTimeout(() => enter.play(), 1600);
      }
    }, section);

    return () => {
      if (bootWatch) clearInterval(bootWatch);
      if (safetyTimer) clearTimeout(safetyTimer);
      const cleanup = (gsap as unknown as { _heroCleanup?: () => void })._heroCleanup;
      cleanup?.();
      (gsap as unknown as { _heroCleanup?: () => void })._heroCleanup = undefined;
      ctx.revert();
    };
  }, [booted, hero, chips]);

  /* Real-data derivatives for the shoppable card */
  const heroDiscount = hero ? discountPercent(hero.price, hero.oldPrice) : null;
  const heroAvail = hero ? HERO_AVAILABILITY[hero.availability] : undefined;

  return (
    <section ref={sectionRef} className="relative overflow-hidden" aria-label="مقدمة المتجر">
      {/* Local atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-[26%] left-[8%] h-[60vh] w-[55vw] orb-glow opacity-70" />
        <div className="absolute bottom-[-24%] right-[-12%] h-[50vh] w-[45vw] orb-warm opacity-60" />
      </div>

      {/* grid-cols-1 (minmax(0,1fr)) keeps the implicit mobile track
          viewport-sized instead of max-content sized */}
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-7 px-4 pt-[5.5rem] pb-14 sm:px-6 sm:pt-28 sm:pb-20 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:grid-rows-[auto_auto] lg:items-center lg:gap-x-8 lg:gap-y-0 lg:pt-36 lg:pb-24">
        {/* ==================== Copy ==================== */}
        <div data-hero-copy className="relative z-10 text-center lg:row-start-1 lg:col-start-1 lg:text-right">
          {/* Kicker — the hero brand when the showcase has a real pick */}
          <p data-hero-kicker className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-hair bg-elevated/80 px-4 py-2 text-xs font-semibold text-muted-foreground shadow-card lg:mb-6">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-mint" />
            </span>
            {hero?.brand?.trim()
              ? `عرضنا المميّز — ${hero.brand.trim()}`
              : `متجر إلكترونيات موثوق — ${BUSINESS.city}`}
            <BadgeCheck className="h-3.5 w-3.5 text-mint" aria-hidden />
          </p>

          {/* Headline — solid ink, nothing transparent */}
          <h1 className="font-display text-[2.35rem] font-extrabold leading-[1.14] tracking-tight text-foreground sm:text-6xl lg:text-[4.2rem] lg:leading-[1.12]">
            <span className="block overflow-hidden pb-1">
              <span data-hero-line className="block">
                شغّل
              </span>
            </span>
            <span className="block overflow-hidden pb-2">
              <span data-hero-line className="block">
                مستواك <span className="text-electric">التالي</span>
              </span>
            </span>
          </h1>

          {/* Description */}
          <p data-hero-desc className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base sm:leading-9 lg:mx-0 lg:mt-6 lg:leading-8">
            لابتوب، تجميعات PC، وأجزاء واكسسوارات مختارة بعناية — مع بيع وشراء واستبدال،
            وخدمة صيانة بنفس المكان. كل اللي تحتاجه لتقنيتك، تحت سقف واحد.
          </p>

          {/* CTAs */}
          <div data-hero-cta className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:mt-9 lg:justify-start">
            <button
              onClick={() => navigate({ name: "store" })}
              className="glow-accent-sm group inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground transition-all hover:bg-[#2a6cb3] hover:shadow-[0_14px_38px_-12px_rgba(26,92,166,0.5)] active:scale-[0.97] sm:w-auto lg:py-4"
            >
              ابدأ التسوّق
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            </button>
            <button
              onClick={() => navigate({ name: "builds" })}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-foreground/12 bg-elevated/60 px-8 py-3.5 text-base font-bold text-foreground transition-all hover:border-foreground/25 hover:bg-elevated sm:w-auto lg:py-4"
            >
              شوف تجميعاتنا
              <span className="h-1.5 w-1.5 rounded-full bg-mint" aria-hidden />
            </button>
          </div>
        </div>

        {/* ==================== The Showcase stage ==================== */}
        <div data-hero-stage className="relative mx-auto w-full max-w-[34rem] lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:my-6 lg:max-w-none">
          {/* Orbital ring — echoes the brand emblem */}
          <div
            data-hero-ring-group
            aria-hidden
            className="pointer-events-none absolute inset-[-9%] flex items-center justify-center"
          >
            <svg viewBox="0 0 300 300" className="h-full w-full text-primary/45">
              <ellipse
                data-hero-ring
                cx="150"
                cy="150"
                rx="132"
                ry="50"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                transform="rotate(-16 150 150)"
                strokeLinecap="round"
              />
              <ellipse
                cx="150"
                cy="150"
                rx="132"
                ry="50"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.75"
                opacity="0.35"
                transform="rotate(58 150 150)"
              />
            </svg>
          </div>

          {/* Plate + chips share one anchored frame so the chips
              always kiss the plate edges, never float in dead space */}
          <div className="relative">
            {/* The gallery plate — the hero product's real photo,
                unveiled like a museum piece. While the database is
                still bootstrapping it renders as a bare skeleton. */}
            <button
              data-hero-plate
              onClick={() => navigate(hero ? { name: "product", slug: hero.slug } : { name: "store" })}
              className="relative block w-full overflow-hidden rounded-[2rem] border border-foreground/10 bg-[#0d0f13] shadow-card-lg"
              aria-label={hero ? `عرض ${hero.name}` : "تصفح المتجر"}
            >
              {hero ? (
                <img
                  src={hero.images[0] ?? IMG.heroShowcase}
                  alt={hero.name}
                  className="aspect-[16/10] w-full object-cover img-grade sm:aspect-[4/3.1] lg:aspect-[4/3.2]"
                  draggable={false}
                  fetchPriority="high"
                  onError={(e) => {
                    // Real photo failed → curated showcase fallback (once)
                    const img = e.currentTarget;
                    if (img.dataset.fallbackDone) return;
                    img.dataset.fallbackDone = "true";
                    img.src = IMG.heroShowcase;
                  }}
                />
              ) : (
                <div
                  aria-hidden
                  className="aspect-[16/10] w-full bg-raised shimmer sm:aspect-[4/3.1] lg:aspect-[4/3.2]"
                />
              )}
              {/* Gallery sheen */}
              <span
                data-hero-sheen
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent"
              />
            </button>

            {/* Floating spec chips — REAL specs of the hero product,
                anchored to the plate frame */}
            <div data-hero-chips aria-hidden className="pointer-events-none absolute inset-0">
              {chips.map((chip, i) => (
                <div
                  key={i}
                  data-hero-chip={i}
                  className={`absolute ${chip.pos} pointer-events-auto hidden max-w-[13.5rem] select-none items-center gap-2.5 rounded-2xl border border-foreground/10 bg-elevated/95 px-3.5 py-2.5 shadow-card backdrop-blur-sm sm:flex`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <chip.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate font-tech text-sm font-bold text-foreground" dir="ltr">
                      {chip.title}
                    </span>
                    <span className="block truncate text-[0.62rem] font-medium text-muted-foreground">{chip.sub}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Shoppable card — the real hero product with live price,
              discount and true availability */}
          {hero && (
            <button
              data-hero-card
              onClick={() => navigate({ name: "product", slug: hero.slug })}
              /* max-w clamp: the floating card is absolutely anchored to
                 the plate frame — on narrow phones it must never outgrow
                 the stage or it gets clipped by the hero's overflow mask */
              className="group absolute -bottom-7 right-4 flex max-w-[calc(100%-2rem)] items-center gap-4 rounded-2xl border border-foreground/10 bg-elevated p-3 pl-4 text-right shadow-card-lg backdrop-blur transition-transform hover:-translate-y-1 sm:right-8"
              aria-label={`عرض ${hero.name}`}
            >
              <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#0d0f13]">
                <img
                  src={hero.images[0] ?? IMG.heroShowcase}
                  alt=""
                  className="h-full w-full object-cover img-grade"
                  loading="lazy"
                />
              </span>
              <span className="min-w-0 max-w-[13rem]">
                {hero.promotionalLabel && (
                  <span className="mb-1 block max-w-full truncate">
                    <PromoBadge label={hero.promotionalLabel} />
                  </span>
                )}
                <span className="line-clamp-2 text-xs font-bold leading-5 text-foreground">
                  {hero.name}
                </span>
                <span className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="flex items-baseline gap-1">
                    <span className="font-tech text-sm font-bold tabular-nums text-primary" dir="ltr">
                      {formatPriceCompact(hero.price)}
                    </span>
                    <span className="text-[0.6rem] font-medium text-muted-foreground">ج.م</span>
                  </span>
                  {heroDiscount !== null && hero.oldPrice && (
                    <>
                      <s
                        className="font-tech text-[0.65rem] font-medium tabular-nums text-muted-foreground/70"
                        dir="ltr"
                      >
                        {formatPriceCompact(hero.oldPrice)}
                      </s>
                      <span
                        className="rounded-md bg-danger/15 px-1.5 py-0.5 font-tech text-[0.6rem] font-bold text-danger"
                        dir="ltr"
                      >
                        -{heroDiscount}%
                      </span>
                    </>
                  )}
                </span>
                {heroAvail && (
                  <span className={`mt-1.5 flex items-center gap-1.5 text-[0.62rem] font-semibold ${heroAvail.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${heroAvail.dot}`} aria-hidden />
                    {heroAvail.label}
                  </span>
                )}
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:-translate-x-1">
                <ArrowLeft className="h-4 w-4" />
              </span>
            </button>
          )}
        </div>

        {/* Stats — verified facts only. Sits under the showcase on
            mobile, under the CTAs on desktop (grid row 2, col 1). */}
        <dl
          data-hero-stats
          className="mt-12 flex flex-wrap items-center justify-center gap-x-7 gap-y-4 text-center sm:mt-14 lg:row-start-2 lg:col-start-1 lg:mt-8 lg:justify-start lg:gap-x-8"
        >
          <div className="flex items-center gap-3">
            <dd
              data-hero-stat-value
              data-target={BUSINESS.socialProof.facebookFollowers}
              data-suffix="+"
              data-latin="true"
              className="font-tech text-xl font-bold tabular-nums text-foreground sm:text-2xl lg:text-[1.7rem]"
              dir="ltr"
            >
              0
            </dd>
            <dt className="text-xs font-medium leading-5 text-muted-foreground">
              متابع على فيسبوك
            </dt>
          </div>
          <span className="h-6 w-px bg-foreground/10 lg:h-8" aria-hidden />
          <div className="flex items-center gap-3">
            <dd
              data-hero-stat-value
              data-target={products.length}
              className="font-tech text-xl font-bold tabular-nums text-foreground sm:text-2xl lg:text-[1.7rem]"
              dir="ltr"
            >
              0
            </dd>
            <dt className="text-xs font-medium leading-5 text-muted-foreground">منتج في المتجر</dt>
          </div>
          <span className="h-6 w-px bg-foreground/10 lg:h-8" aria-hidden />
          <div className="flex items-center gap-3">
            <dd
              data-hero-stat-value
              data-target={visibleCategoryCount}
              className="font-tech text-xl font-bold tabular-nums text-foreground sm:text-2xl lg:text-[1.7rem]"
              dir="ltr"
            >
              0
            </dd>
            <dt className="text-xs font-medium leading-5 text-muted-foreground">فئات متخصصة</dt>
          </div>
        </dl>
      </div>

      {/* Scroll cue */}
      <div data-hero-cue className="relative z-10 hidden flex-col items-center gap-2 pb-8 text-muted-foreground lg:flex">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em]">اكتشف المزيد</span>
        <ChevronDown className="h-4 w-4 animate-bounce" aria-hidden />
      </div>
    </section>
  );
}
