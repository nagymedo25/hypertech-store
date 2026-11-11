"use client";

/**
 * ============================================================
 * BUILD VIEW — detailed PC-build presentation · Light
 * ============================================================
 * Complete offering: gallery + performance meters (animated),
 * full component breakdown table, WhatsApp inquiry CTA.
 * Components are presented as parts of the build — not
 * independently purchasable (per business reality).
 * ============================================================
 */

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, MessageCircle, Gauge, Package, Check } from "lucide-react";
import { ViewHeader } from "@/components/layout/view-header";
import { NotFoundView } from "@/components/layout/not-found";
import { BuildCard } from "@/components/builds/build-card";
import { SectionHeading } from "@/components/store/section-heading";
import { AvailabilityBadge } from "@/components/store/catalog-atoms";
import { Reveal, StaggerReveal } from "@/components/motion/reveal";
import { AnimatedNumber } from "@/components/motion/micro-interactions";
import { useMockDB } from "@/lib/store/db-store";
import { useRouterStore } from "@/lib/router";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { BUILD_TYPE_META, formatPrice, formatPriceCompact } from "@/lib/format";
import { EASE, prefersReducedMotion } from "@/lib/motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/** Muted, desaturated type accents — readable on ivory/white. */
const TYPE_ACCENTS: Record<string, string> = {
  gaming: "#2E6E5E",
  workstation: "#A8703C",
  budget: "#3F6C93",
  creator: "#8A5A78",
};

export default function BuildView({ slug }: { slug: string }) {
  const builds = useMockDB((s) => s.builds);
  const navigate = useRouterStore((s) => s.navigate);
  const build = builds.find((b) => b.slug === slug);
  const others = builds.filter((b) => b.id !== build?.id).slice(0, 2);

  const [imgIdx, setImgIdx] = useState(0);
  const metersRef = useRef<HTMLDivElement>(null);

  /* Reset gallery when switching between builds — render-time adjust (React pattern) */
  const [prevSlug, setPrevSlug] = useState(slug);
  if (prevSlug !== slug) {
    setPrevSlug(slug);
    setImgIdx(0);
  }

  /* Animate performance meters on scroll */
  useEffect(() => {
    const el = metersRef.current;
    if (!el || !build || prefersReducedMotion()) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-meter-fill]",
        { scaleX: 0 },
        {
          scaleX: (i: number, target: HTMLElement) => Number(target.dataset.score) / 100,
          transformOrigin: "right",
          duration: 1.1,
          ease: EASE.out,
          stagger: 0.15,
          scrollTrigger: { trigger: el, start: "top 85%" },
        }
      );
    }, el);
    return () => ctx.revert();
  }, [build]);

  if (!build) return <NotFoundView what="التجميعة" />;

  const accent = TYPE_ACCENTS[build.type] ?? "#1a5ca6";
  const componentsSum = build.components.reduce((acc, c) => acc + (c.price ?? 0) * c.qty, 0);
  const hasPricedComponents = componentsSum > 0;

  const handleInquiry = () => {
    const url = buildWhatsAppUrl(build);
    window.open(url, "_blank", "noopener,noreferrer");
    toast.info("تم فتح محادثة واتساب", {
      description: "أكمل الإرسال من واتساب — استفسارك بيوصل لفريق هايبر تك.",
    });
  };

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-96 orb-glow opacity-40" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Breadcrumb */}
        <nav aria-label="مسار التنقل" className="flex items-center gap-2 pt-24 text-xs text-faint sm:pt-28">
          <button onClick={() => navigate({ name: "home" })} className="transition-colors hover:text-primary">
            الرئيسية
          </button>
          <span aria-hidden>/</span>
          <button onClick={() => navigate({ name: "builds" })} className="transition-colors hover:text-primary">
            تجميعات PC
          </button>
          <span aria-hidden>/</span>
          <span className="min-w-0 truncate text-muted-foreground">{build.title}</span>
        </nav>

        <ViewHeader
          kicker={BUILD_TYPE_META[build.type]}
          title={build.title}
          description={build.description}
          accent={accent}
        >
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <AvailabilityBadge status={build.availability} size="md" />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hair bg-foreground/[0.03] px-3.5 py-1.5 text-xs font-bold text-muted-foreground">
              <Package className="h-3.5 w-3.5" style={{ color: accent }} />
              {build.components.length} مكون
            </span>
            {build.featured && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/35 bg-amber/10 px-3.5 py-1.5 text-xs font-bold text-amber">
                <Gauge className="h-3.5 w-3.5" />
                تجميعة مميزة
              </span>
            )}
          </div>
        </ViewHeader>

        <div className="grid grid-cols-1 gap-8 pb-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12">
          {/* ---------- Gallery ---------- */}
          <div>
            <Reveal dir="scale">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem] border border-hair bg-[#0d0f13] shadow-card">
                {build.images.map((img, i) => (
                   
                  <img
                    key={img + i}
                    src={img}
                    alt={`${build.title} — صورة ${i + 1}`}
                    className={cn(
                      "absolute inset-0 h-full w-full object-cover img-grade transition-opacity duration-500",
                      i === imgIdx ? "opacity-100" : "opacity-0"
                    )}
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                ))}
                <span className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0d0f13]/70 to-transparent" aria-hidden />
                <span
                  className="absolute right-4 top-4 rounded-full border px-3.5 py-1.5 text-xs font-bold backdrop-blur-sm"
                  style={{ borderColor: `${accent}55`, color: accent, background: "rgba(252,251,248,0.92)" }}
                >
                  {BUILD_TYPE_META[build.type]}
                </span>
              </div>
            </Reveal>

            {build.images.length > 1 && (
              <div
                className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                aria-label="صور التجميعة"
              >
                {build.images.map((img, i) => (
                  <button
                    key={img + i}
                    onClick={() => setImgIdx(i)}
                    className={cn(
                      "relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border transition-all",
                      i === imgIdx
                        ? "border-primary shadow-[0_6px_16px_-6px_rgba(26,92,166,0.5)]"
                        : "border-hair opacity-60 hover:opacity-100"
                    )}
                    aria-label={`صورة ${i + 1}`}
                    aria-pressed={i === imgIdx}
                  >
                    { }
                    <img src={img} alt="" className="h-full w-full object-cover img-grade" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {/* Performance meters */}
            {build.performance.length > 0 && (
              <div ref={metersRef} className="mt-10 rounded-3xl border border-hair bg-elevated p-6 shadow-card sm:p-8">
                <h3 className="mb-6 flex items-center gap-2.5 font-display text-lg font-bold">
                  <Gauge className="h-5 w-5" style={{ color: accent }} />
                  مؤشرات الأداء
                  <span className="text-xs font-normal text-faint">تقدير نسبي للعرض</span>
                </h3>
                <div className="space-y-5">
                  {build.performance.map((p) => (
                    <div key={p.label}>
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-bold">{p.label}</span>
                        <span className="font-tech font-bold" style={{ color: accent }}>
                          {p.score}
                          <span className="text-muted-foreground">/100</span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-foreground/[0.06]" role="progressbar" aria-valuenow={p.score} aria-valuemin={0} aria-valuemax={100} aria-label={p.label}>
                        <div
                          data-meter-fill
                          data-score={p.score}
                          className="h-full w-full rounded-full"
                          style={{
                            background: `linear-gradient(270deg, ${accent}, ${accent}55)`,
                            transform: "scaleX(0)",
                            transformOrigin: "right",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ---------- Purchase panel ---------- */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Reveal dir="start">
              <div className="rounded-[1.75rem] border border-hair bg-elevated p-6 shadow-card sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-faint">السعر الإجمالي للتجميعة</p>
                <p className="mt-2 font-tech text-4xl font-bold text-foreground sm:text-5xl" dir="rtl">
                  <AnimatedNumber value={build.totalPrice} format={(n) => formatPriceCompact(n)} />
                  <span className="mr-2 text-lg font-medium text-muted-foreground">ج.م</span>
                </p>
                {hasPricedComponents && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    مجموع المكونات المرئية: {formatPrice(componentsSum)}
                    {componentsSum !== build.totalPrice && " — السعر النهائي يشمل التجميع والاختبار والضمان المتفق عليه"}
                  </p>
                )}

                <div className="my-6 hairline-x" />

                {/* WhatsApp CTA */}
                <button
                  onClick={handleInquiry}
                  className="glow-accent-sm flex w-full items-center justify-center gap-2.5 rounded-2xl bg-primary px-6 py-4 font-bold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.98]"
                >
                  <MessageCircle className="h-5 w-5" />
                  استفسار عن التجميعة — واتساب
                </button>
                <p className="mt-3 text-center text-[0.7rem] leading-5 text-faint">
                  يفتح محادثة واتساب بتفاصيل التجميعة كاملة — الاستفسار غير ملزم.
                </p>

                <div className="mt-6 rounded-2xl border border-hair bg-raised/50 p-4">
                  <p className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <Check className="h-4 w-4 text-mint" />
                    إمكانية تعديل المكونات
                  </p>
                  <p className="mt-1.5 text-xs leading-6 text-faint">
                    عايز نسخة أقوى أو أخف؟ كلمنا ونعمل لك تجميعة مخصصة على ميزانيتك بالظبط.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Quick specs summary */}
            <Reveal dir="start" delay={0.15} className="mt-6">
              <div className="rounded-[1.75rem] border border-hair bg-elevated p-6 shadow-card sm:p-8">
                <h3 className="mb-5 font-display text-base font-bold">نظرة سريعة على المكونات</h3>
                <ul className="space-y-3.5">
                  {build.components.slice(0, 5).map((c) => (
                    <li key={c.id} className="flex items-start justify-between gap-4 text-sm">
                      <span className="shrink-0 text-xs font-bold text-faint">{c.role}</span>
                      <span className="text-right font-medium leading-6">{c.name}</span>
                    </li>
                  ))}
                  {build.components.length > 5 && (
                    <li className="pt-1 text-xs text-primary">
                      + {build.components.length - 5} مكونات إضافية — الجدول الكامل بالأسفل
                    </li>
                  )}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>

        {/* ---------- Full components table ---------- */}
        <section className="pb-20">
          <SectionHeading
            kicker="تفاصيل التقنية"
            title="مكونات"
            accentWord="التجميعة"
            description="كل قطعة اختيرت لتوازن حقيقي — ودي تفاصيلها."
          />
          <Reveal dir="up">
            <div className="overflow-hidden rounded-3xl border border-hair bg-elevated shadow-card">
              <table className="w-full text-right">
                <caption className="sr-only">جدول مكونات {build.title}</caption>
                <thead>
                  <tr className="border-b border-hair bg-raised/70 text-xs uppercase tracking-wider text-faint">
                    <th scope="col" className="px-5 py-4 font-semibold sm:px-6">القطعة</th>
                    <th scope="col" className="hidden px-5 py-4 font-semibold sm:table-cell sm:px-6">المواصفة</th>
                    <th scope="col" className="px-5 py-4 font-semibold sm:px-6">الكمية</th>
                    <th scope="col" className="px-5 py-4 font-semibold sm:px-6">السعر التقديري</th>
                  </tr>
                </thead>
                <tbody>
                  {build.components.map((c) => (
                    <tr key={c.id} className="border-b border-hair/60 transition-colors last:border-0 hover:bg-foreground/[0.02]">
                      <td className="px-5 py-4 sm:px-6">
                        <p className="text-xs font-bold text-faint">{c.role}</p>
                        <p className="mt-1 text-sm font-bold">{c.name}</p>
                        {c.spec && <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">{c.spec}</p>}
                      </td>
                      <td className="hidden px-5 py-4 text-sm text-muted-foreground sm:table-cell sm:px-6">
                        {c.spec ?? "—"}
                      </td>
                      <td className="px-5 py-4 font-tech text-sm tabular-nums text-muted-foreground sm:px-6">×{c.qty}</td>
                      <td className="px-5 py-4 sm:px-6">
                        {typeof c.price === "number" && c.price > 0 ? (
                          <span className="font-tech text-sm font-bold">{formatPrice(c.price)}</span>
                        ) : (
                          <span className="text-xs text-faint">مضمّن</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {hasPricedComponents && (
                    <tr className="border-t border-hair bg-raised/50">
                      <td colSpan={3} className="px-5 py-4 text-sm font-bold sm:px-6">
                        مجموع المكونات المعروضة
                      </td>
                      <td className="px-5 py-4 font-tech text-base font-bold text-primary sm:px-6">
                        {formatPrice(componentsSum)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Reveal>
        </section>

        {/* ---------- Related builds ---------- */}
        {others.length > 0 && (
          <section className="pb-24">
            <SectionHeading kicker="بدائل" title="تجميعات" accentWord="مشابهة" />
            <StaggerReveal className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
              {others.map((b) => (
                <BuildCard key={b.id} build={b} />
              ))}
            </StaggerReveal>
            <div className="mt-8 text-center">
              <button
                onClick={() => navigate({ name: "builds" })}
                className="group inline-flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-foreground"
              >
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                كل التجميعات
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
