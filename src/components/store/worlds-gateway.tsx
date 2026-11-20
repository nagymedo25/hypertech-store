"use client";

/**
 * ============================================================
 * HYPER TECH — Store Entry Gateway: Animated "Worlds" Experience
 * ============================================================
 * Presented when entering the Store section (#/store) before
 * picking a specific category filter. Features 3 visually stunning,
 * high-impact interactive cards ("Worlds"):
 *   1. Workstation (ورك ستيشن) — High performance, rendering & multitasking
 *   2. Gaming (جيمنج) — High refresh rates, dedicated RTX GPUs & RGB
 *   3. Economic / Budget (اقتصادي) — Reliable value laptops & PCs for study
 *
 * Smooth transitions into pre-filtered store catalog, with option to
 * view all products or jump straight to any specific world.
 * ============================================================
 */

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  Coins,
  Cpu,
  Gamepad2,
  HardDrive,
  Headphones,
  Keyboard,
  Laptop,
  Layers,
  LayoutGrid,
  MemoryStick,
  Mouse,
  Package,
  ShieldCheck,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Category, Product } from "@/types";
import { EASE, prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* --------------------------- Icon Resolver --------------------------- */

const ICON_MAP: Record<string, LucideIcon> = {
  Cpu,
  Gamepad2,
  Coins,
  Briefcase,
  Laptop,
  Sparkles,
  Zap,
  ShieldCheck,
  Layers,
  HardDrive,
  MemoryStick,
  Keyboard,
  Mouse,
  Headphones,
  Package,
};

function resolveIcon(name?: string, fallback: LucideIcon = Package): LucideIcon {
  if (!name) return fallback;
  return ICON_MAP[name] ?? fallback;
}

/** Color-mix helper for clean translucent tints */
const mix = (color: string, pct: number) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/* -------------------------- World Definitions ------------------------- */

interface WorldSpec {
  slug: string;
  defaultTitle: string;
  defaultTagline: string;
  defaultDescription: string;
  badge: string;
  accent: string;
  defaultIcon: LucideIcon;
  defaultImage: string;
  highlights: string[];
  ctaLabel: string;
}

const PRIMARY_WORLDS: WorldSpec[] = [
  {
    slug: "workstation",
    defaultTitle: "ورك ستيشن",
    defaultTagline: "قوة وإنتاجية فائقة للأعمال والريندر",
    defaultDescription:
      "محطات عمل ولابتوبات قوية مجهزة لمعالجة التصاميم الهندسية، الريندر المعماري، والمونتاج الثقيل 4K/8K بأقصى درجات الاستقرار والاعتمادية.",
    badge: "إنتاجية وهندسة • PRO WORKSTATION",
    accent: "#0284c7", // Sky / Vibrant Cyan Blue
    defaultIcon: Cpu,
    defaultImage: "/atmosphere/cat-computers.jpg",
    highlights: [
      "معالجات Intel Core i7/i9 & Xeon متعددة الأنوية",
      "كروت شاشة RTX / Quadro مخصصة للريندر والمونتاج",
      "شاشات فائقة الدقة 100% sRGB / DCI-P3 للألوان الواقعية",
      "أنظمة تبريد مكثفة للعمل المتواصل 24/7 دون هبوط أداء",
    ],
    ctaLabel: "دخول عالم الوورك ستيشن",
  },
  {
    slug: "gaming",
    defaultTitle: "جيمنج",
    defaultTagline: "أداء ناري ومعدلات إطارات فائقة ⚡",
    defaultDescription:
      "أقوى أجهزة ولابتوبات الألعاب بكروت شاشة منفصلة وشاشات فائقة السرعة وتبريد احترافي لتجربة لعب وبث استثنائية بدون أي تهنيج.",
    badge: "ألعاب وبث • HIGH FPS GAMING",
    accent: "#10b981", // Emerald / Gaming Neon Green
    defaultIcon: Gamepad2,
    defaultImage: "/atmosphere/cat-builds.jpg",
    highlights: [
      "أحدث كروت NVIDIA GeForce RTX 40-Series",
      "شاشات بترددات فائقة 144Hz / 165Hz / 240Hz",
      "أنظمة تبريد ذكية لثبات الأداء في أصعب المعارك",
      "إضاءة RGB وتصميم حماسي مخصص للألعاب والبث",
    ],
    ctaLabel: "دخول عالم الجيمنج",
  },
  {
    slug: "economic",
    defaultTitle: "اقتصادي",
    defaultTagline: "أفضل قيمة واعتمادية للدراسة والأعمال",
    defaultDescription:
      "أجهزة متوازنة وعملية للطلبة، العمل المكتبي، والتصفح اليومي — تجمع بين سرعة الاستجابة والجودة العالية بأوفر ميزانية مع ضمان معتمد.",
    badge: "قيمة ذكية • SMART VALUE & STUDY",
    accent: "#f59e0b", // Warm Amber / Gold
    defaultIcon: Coins,
    defaultImage: "/atmosphere/cat-laptops.jpg",
    highlights: [
      "أقراص NVMe SSD فائقة السرعة لإقلاع واستجابة لحظية",
      "بطاريات تدوم طويلاً واستهلاك طاقة منخفض ومثالي",
      "وزن خفيف وخامات متينة تتحمل التنقل اليومي",
      "أفضل قيمة مقابل كل جنيه تدفعه مع ضمان فحص شامل",
    ],
    ctaLabel: "دخول العالم الاقتصادي",
  },
];

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
  buildsCount = 0,
  onSelectCategory,
  onViewAll,
}: WorldsGatewayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Entrance animations for the header, cards, and bottom action bar
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
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.65, ease: EASE.out }
      );
    }

    if (cards.length) {
      tl.fromTo(
        cards,
        { opacity: 0, y: 40, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.12,
          ease: EASE.out,
          clearProps: "transform,opacity",
        },
        "-=0.4"
      );
    }

    if (footer) {
      tl.fromTo(
        footer,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: EASE.out },
        "-=0.3"
      );
    }

    return () => {
      tl.kill();
    };
  }, []);

  // Compute product count per world
  const getProductCount = (slug: string): number => {
    const cat = categories.find((c) => c.slug === slug);
    if (!cat) return 0;
    const directCount = products.filter((p) => p.categoryId === cat.id).length;
    // For gaming, we can optionally note builds count
    return directCount;
  };

  // Other active categories that are not the 3 primary worlds
  const otherCategories = categories.filter(
    (c) =>
      c.active !== false &&
      !PRIMARY_WORLDS.some((w) => w.slug === c.slug)
  );

  return (
    <section
      ref={containerRef}
      aria-label="بوابة عوالم المتجر"
      className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12"
    >
      {/* ================= Atmospheric Ambient Lighting ================= */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-10 -z-10 flex justify-center overflow-hidden"
      >
        <div className="h-[420px] w-[800px] rounded-full bg-gradient-to-b from-primary/15 via-primary/5 to-transparent blur-[110px]" />
      </div>

      {/* ================= Gateway Header ================= */}
      <header className="gateway-header text-center mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.08] px-4 py-1.5 text-xs font-bold text-primary shadow-sm backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          <span>بوابة العوالم الرقمية • HYPER TECH WORLDS</span>
        </div>

        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          اختر <span className="text-electric">عالمك الرقمي</span> المتخصص
        </h1>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-7">
          قسمنا أجهزتنا في 3 عوالم متخصصة لتصل فورًا إلى العتاد الدقيق المناسب لاحتياجك الفعلي —
          سواء كنت محترف ريندر ومونتاج، جيمر يبحث عن أقصى إطارات، أو طالب ورائد أعمال يبحث عن أفضل قيمة واعتمادية.
        </p>

        {/* Confidence Trust Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-foreground/80">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-hair bg-elevated/70 px-3 py-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ضمان شامل وفحص عتاد معتمد
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-hair bg-elevated/70 px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-500" />
            استشارة وتوافق تقني دقيق
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-hair bg-elevated/70 px-3 py-1">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            ترقيات فورية للرام والتخزين
          </span>
        </div>
      </header>

      {/* ================= The 3 Worlds Cards Grid ================= */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PRIMARY_WORLDS.map((spec) => {
          // Check if category exists dynamically in DB
          const cat = categories.find((c) => c.slug === spec.slug);
          const title = cat?.name || spec.defaultTitle;
          const tagline = cat?.tagline || spec.defaultTagline;
          const description = cat?.description || spec.defaultDescription;
          const accent = cat?.accent || spec.accent;
          const image = cat?.image || spec.defaultImage;
          const IconComponent = resolveIcon(cat?.icon, spec.defaultIcon);
          const productCount = getProductCount(spec.slug);

          return (
            <article
              key={spec.slug}
              className="world-card group relative flex flex-col overflow-hidden rounded-3xl border border-hair bg-surface/70 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:border-foreground/30 hover:shadow-2xl"
              style={
                {
                  "--world-accent": accent,
                  "--world-glow": mix(accent, 35),
                  boxShadow: `0 10px 30px -15px ${mix(accent, 40)}`,
                } as React.CSSProperties
              }
            >
              {/* Dynamic top glowing strip */}
              <div
                className="h-1.5 w-full transition-all duration-500 group-hover:h-2"
                style={{ backgroundColor: accent }}
              />

              {/* Cover Image & Atmospheric Backdrop */}
              <div className="relative h-52 w-full overflow-hidden bg-elevated">
                {image ? (
                  <img
                    src={image}
                    alt={title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted/30">
                    <IconComponent className="h-16 w-16 opacity-30 text-muted-foreground" />
                  </div>
                )}

                {/* Dark Gradient Veil */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#14151a] via-[#14151a]/60 to-transparent" />

                {/* Accent Color Ambient Radial Flare on Hover */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-40"
                  style={{
                    background: `radial-gradient(circle at 50% 30%, ${accent} 0%, transparent 75%)`,
                  }}
                />

                {/* Top Floating Badge */}
                <div className="absolute left-4 top-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.68rem] font-bold tracking-wide text-white backdrop-blur-md shadow-md"
                    style={{
                      borderColor: mix(accent, 50),
                      backgroundColor: "rgba(15, 17, 23, 0.75)",
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full animate-pulse"
                      style={{ backgroundColor: accent }}
                    />
                    {spec.badge}
                  </span>
                </div>

                {/* Live Product Count Badge */}
                <div className="absolute right-4 top-4">
                  <span className="rounded-full bg-black/60 px-2.5 py-1 font-tech text-xs font-semibold text-white/90 backdrop-blur-md border border-white/10">
                    {productCount > 0 ? `${productCount} منتج متاح` : "أجهزة مختارة"}
                  </span>
                </div>

                {/* Icon & Title Header inside Image Area */}
                <div className="absolute bottom-4 right-4 left-4 flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border backdrop-blur-md shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                    style={{
                      borderColor: mix(accent, 45),
                      backgroundColor: "rgba(20, 22, 30, 0.85)",
                      color: accent,
                    }}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-bold text-white drop-shadow sm:text-2xl">
                      {title}
                    </h2>
                    <p className="line-clamp-1 text-xs font-medium text-white/80">
                      {tagline}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                <div>
                  <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-6">
                    {description}
                  </p>

                  {/* Highlights Bullet Points */}
                  <ul className="mt-4 space-y-2 border-t border-hair pt-4">
                    {spec.highlights.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-foreground/85"
                      >
                        <span
                          className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: accent }}
                          aria-hidden
                        />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action CTA Button */}
                <div className="mt-6 pt-4 border-t border-hair">
                  <button
                    type="button"
                    onClick={() => onSelectCategory(spec.slug)}
                    className="group/btn relative flex w-full items-center justify-between overflow-hidden rounded-2xl border px-4 py-3 text-sm font-bold transition-all duration-300 active:scale-[0.98]"
                    style={{
                      borderColor: mix(accent, 40),
                      backgroundColor: mix(accent, 10),
                      color: accent,
                    }}
                  >
                    {/* Hover fill layer */}
                    <span
                      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent to-white/10 transition-transform duration-500 group-hover/btn:translate-x-full"
                      aria-hidden
                    />
                    <span className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      <span>{spec.ctaLabel}</span>
                    </span>
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-300 group-hover/btn:-translate-x-1"
                      style={{
                        backgroundColor: mix(accent, 20),
                        color: accent,
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* ================= Gateway Footer: All Products & Other Categories ================= */}
      <footer className="gateway-footer mt-12 rounded-3xl border border-hair bg-surface/50 p-6 sm:p-8 backdrop-blur-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold text-foreground sm:text-lg">
              تريد تصفح كل ما في المتجر دون قيود؟
            </h3>
            <p className="text-xs text-muted-foreground sm:text-sm">
              يمكنك استعراض كامل الكتالوج والبحث والتصفية بحرية تامة حسب الماركة، السعر، أو التوفر.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onViewAll}
              className="inline-flex items-center gap-2.5 rounded-2xl border border-primary/30 bg-primary/10 px-6 py-3 text-sm font-bold text-primary transition-all duration-300 hover:bg-primary/20 hover:border-primary/50 hover:shadow-md active:scale-95"
            >
              <LayoutGrid className="h-4 w-4" />
              <span>عرض كل المنتجات ({products.length})</span>
              <ChevronLeft className="h-4 w-4 opacity-75" />
            </button>
          </div>
        </div>

        {/* Other Categories Quick Jump */}
        {otherCategories.length > 0 && (
          <div className="mt-6 border-t border-hair pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground ml-2">
                أو انتقل مباشرة إلى:
              </span>
              {otherCategories.map((c) => {
                const Ico = resolveIcon(c.icon);
                const count =
                  c.slug === "builds"
                    ? buildsCount
                    : products.filter((p) => p.categoryId === c.id).length;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectCategory(c.slug)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-hair bg-elevated/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-foreground/30 hover:bg-elevated active:scale-95"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: c.accent || "var(--primary)" }}
                    />
                    <Ico className="h-3 w-3 text-muted-foreground" />
                    <span>{c.name}</span>
                    <span className="font-tech text-[0.68rem] text-faint">
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </footer>
    </section>
  );
}
export default WorldsGateway;
