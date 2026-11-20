"use client";

/**
 * ============================================================
 * HYPER TECH — Store Entry Gateway: Minimal Luxury Worlds
 * ============================================================
 * Clean, high-impact category gateway:
 * - Generous top spacing clearing the navbar cleanly
 * - The ENTIRE card is clickable (image, card, button)
 * - Concise, punchy copy ("ما قل ودل") with zero text bloat
 * - Smooth entrance animations & premium hover interactions
 * ============================================================
 */

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  ArrowLeft,
  ChevronLeft,
  Cpu,
  Gamepad2,
  Coins,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { Category, Product } from "@/types";
import { EASE, prefersReducedMotion } from "@/lib/motion";

/* -------------------------- World Definitions ------------------------- */

interface WorldSpec {
  slug: string;
  defaultTitle: string;
  englishTitle: string;
  tagline: string;
  accent: string;
  icon: LucideIcon;
  defaultImage: string;
}

const PRIMARY_WORLDS: WorldSpec[] = [
  {
    slug: "workstation",
    defaultTitle: "ورك ستيشن",
    englishTitle: "WORKSTATION",
    tagline: "قوة وإنتاجية فائقة للريندر والمونتاج والأعمال الهندسية الثقيلة",
    accent: "#0284c7", // Sky Cyan
    icon: Cpu,
    defaultImage: "/atmosphere/cat-computers.jpg",
  },
  {
    slug: "gaming",
    defaultTitle: "جيمنج",
    englishTitle: "GAMING",
    tagline: "أداء ناري ومعدلات إطارات فائقة مع أقوى كروت الشاشة والشاشات السريعة",
    accent: "#10b981", // Emerald Neon Green
    icon: Gamepad2,
    defaultImage: "/atmosphere/cat-builds.jpg",
  },
  {
    slug: "economic",
    defaultTitle: "اقتصادي",
    englishTitle: "BUDGET & STUDY",
    tagline: "أفضل قيمة واعتمادية وسرعة استجابة للدراسة والعمل اليومي",
    accent: "#f59e0b", // Warm Amber
    icon: Coins,
    defaultImage: "/atmosphere/cat-laptops.jpg",
  },
];

const mix = (color: string, pct: number) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/* ------------------------------- Props -------------------------------- */

export interface WorldsGatewayProps {
  categories: Category[];
  products: Product[];
  buildsCount?: number;
  onSelectCategory: (categorySlug: string) => void;
  onViewAll: () => void;
}

/* ------------------------------ Component ----------------------------- */

export function WorldsGateway({
  categories,
  products,
  onSelectCategory,
  onViewAll,
}: WorldsGatewayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReducedMotion()) return;

    const cards = el.querySelectorAll<HTMLElement>(".world-card");
    const header = el.querySelector<HTMLElement>(".gateway-header");
    const footer = el.querySelector<HTMLElement>(".gateway-footer");

    const tl = gsap.timeline();

    if (header) {
      tl.fromTo(
        header,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.6, ease: EASE.out }
      );
    }

    if (cards.length) {
      tl.fromTo(
        cards,
        { opacity: 0, y: 35, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.65,
          stagger: 0.1,
          ease: EASE.out,
          clearProps: "transform,opacity",
        },
        "-=0.35"
      );
    }

    if (footer) {
      tl.fromTo(
        footer,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.45, ease: EASE.out },
        "-=0.25"
      );
    }

    return () => {
      tl.kill();
    };
  }, []);

  const getProductCount = (slug: string): number => {
    const cat = categories.find((c) => c.slug === slug);
    if (!cat) return 0;
    return products.filter((p) => p.categoryId === cat.id).length;
  };

  const otherCategories = categories.filter(
    (c) =>
      c.active !== false &&
      !PRIMARY_WORLDS.some((w) => w.slug === c.slug)
  );

  return (
    <section
      ref={containerRef}
      aria-label="بوابة عوالم المتجر"
      className="relative mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 sm:pt-32 sm:pb-24 lg:pt-36 lg:pb-28"
    >
      {/* Ambient Radial Aura */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-12 -z-10 flex justify-center overflow-hidden"
      >
        <div className="h-[460px] w-[850px] rounded-full bg-gradient-to-b from-primary/15 via-primary/5 to-transparent blur-[120px]" />
      </div>

      {/* ================= Gateway Header (Concise & Impactful) ================= */}
      <header className="gateway-header text-center mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary shadow-xs backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          <span>بوابة العوالم الرقمية</span>
        </div>

        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          اختر <span className="text-electric">عالمك</span>
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          ثلاثة عوالم متخصصة صُممت بدقة لتصل فوراً إلى العتاد المناسب لاحتياجك.
        </p>
      </header>

      {/* ================= The 3 Worlds Cards Grid ================= */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PRIMARY_WORLDS.map((spec) => {
          const cat = categories.find((c) => c.slug === spec.slug);
          const title = cat?.name || spec.defaultTitle;
          const tagline = cat?.tagline || spec.tagline;
          const accent = cat?.accent || spec.accent;
          const image = cat?.image || spec.defaultImage;
          const IconComponent = spec.icon;
          const count = getProductCount(spec.slug);

          return (
            <article
              key={spec.slug}
              onClick={() => onSelectCategory(spec.slug)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectCategory(spec.slug);
                }
              }}
              aria-label={`دخول عالم ${title}`}
              className="world-card group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-hair bg-elevated shadow-card cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={
                {
                  "--world-accent": accent,
                  boxShadow: `0 12px 36px -16px ${mix(accent, 45)}`,
                } as React.CSSProperties
              }
            >
              {/* Accent colored top accent border */}
              <div
                className="h-1.5 w-full transition-all duration-300 group-hover:h-2"
                style={{ backgroundColor: accent }}
              />

              {/* Cover Image Plate */}
              <div className="relative h-60 w-full overflow-hidden bg-raised">
                {image ? (
                  <img
                    src={image}
                    alt={title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted/40">
                    <IconComponent className="h-16 w-16 opacity-30 text-muted-foreground" />
                  </div>
                )}

                {/* Dark gradient veil */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#14151a] via-[#14151a]/55 to-transparent" />

                {/* Ambient glow flare on hover */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-40"
                  style={{
                    background: `radial-gradient(circle at 50% 40%, ${accent} 0%, transparent 70%)`,
                  }}
                />

                {/* Top Badge: English Sub-label */}
                <div className="absolute left-4 top-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.65rem] font-bold tracking-wider text-white backdrop-blur-md shadow-xs"
                    style={{
                      borderColor: mix(accent, 45),
                      backgroundColor: "rgba(18, 20, 26, 0.78)",
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full animate-pulse"
                      style={{ backgroundColor: accent }}
                    />
                    {spec.englishTitle}
                  </span>
                </div>

                {/* Floating World Icon & Title Banner */}
                <div className="absolute inset-x-5 bottom-4 flex items-center justify-between gap-3 text-white">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: accent,
                        color: "#ffffff",
                      }}
                    >
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-bold tracking-tight text-white drop-shadow-sm">
                        {title}
                      </h2>
                      <span className="text-xs font-semibold text-white/80">
                        {count > 0 ? `${count} جهاز متوفر` : "تشكيلة متجددة"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body: Punchy 1-line description + Action button */}
              <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {tagline}
                </p>

                {/* Action CTA Button */}
                <div className="mt-5 pt-4 border-t border-hair">
                  <div
                    className="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition-all duration-300 group-hover:brightness-105"
                    style={{
                      borderColor: mix(accent, 35),
                      backgroundColor: mix(accent, 12),
                      color: accent,
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      <span>دخول عالم {title}</span>
                    </span>
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-300 group-hover:-translate-x-1"
                      style={{
                        backgroundColor: mix(accent, 22),
                        color: accent,
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* ================= Gateway Footer: Clean & Direct ================= */}
      <footer className="gateway-footer mt-12 flex flex-col items-center justify-center gap-4 text-center sm:mt-16">
        <button
          type="button"
          onClick={onViewAll}
          className="group inline-flex items-center gap-2.5 rounded-full border border-hair bg-elevated px-6 py-3 text-sm font-bold text-foreground shadow-sm transition-all hover:border-foreground/30 hover:bg-surface active:scale-95"
        >
          <span>تصفح كل أجهزة المتجر بدون تصنيف</span>
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        </button>

        {otherCategories.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
            <span className="text-faint font-medium">أقسام أخرى سريعة:</span>
            {otherCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCategory(c.slug)}
                className="rounded-full border border-hair bg-surface px-3 py-1 font-medium text-foreground/80 transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </footer>
    </section>
  );
}
