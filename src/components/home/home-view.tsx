"use client";

/**
 * ============================================================
 * HOME VIEW — the premium storefront (Luxury Light).
 * ============================================================
 * A calm, conversion-focused customer journey:
 *   Hero (The Showcase)
 *   → Categories  (guide the customer to the right department)
 *   → Best Sellers (curated, admin-configurable selection)
 *   → Brands      (HP · Dell · ASUS + the real catalog brands)
 *   → Trust       (verified reasons + maintenance CTA)
 * Every "fact" shown is derived from verified business data —
 * no invented warranties or testimonials.
 * ============================================================
 */

import { useMemo } from "react";
import { ArrowLeft, RefreshCw, Cpu, MessageCircle, Users, Wrench, BadgeCheck } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { BrandsSection } from "@/components/home/brands-section";
import { SectionHeading } from "@/components/store/section-heading";
import { ProductCard } from "@/components/store/product-card";
import { CategoryCard } from "@/components/store/category-card";
import { Reveal, StaggerReveal } from "@/components/motion/reveal";
import { useMockDB } from "@/lib/store/db-store";
import { useRouterStore } from "@/lib/router";

export default function HomeView({ booted }: { booted: boolean }) {
  return (
    <div className="bg-noise">
      <Hero booted={booted} />
      <CategoriesSection />
      <BestSellersSection />
      <BrandsSection />
      <TrustSection />
    </div>
  );
}

/* ========================= Categories ========================= */

function CategoriesSection() {
  const categories = useMockDB((s) => s.categories);
  const settings = useMockDB((s) => s.settings);
  const navigate = useRouterStore((s) => s.navigate);

  const visible = useMemo(
    () =>
      [...categories]
        .sort((a, b) => a.order - b.order)
        .filter((c) => c.active !== false)
        .filter((c) => c.slug !== "builds" || settings.showBuildsCategory !== false),
    [categories, settings.showBuildsCategory]
  );

  return (
    <section id="categories" className="relative py-20 sm:py-28" aria-labelledby="categories-title">
      {/* overflow-x-clip: the horizontal (dir start/end) Reveal entrances
          below the fold sit at ±48px until their ScrollTrigger fires —
          without this clip the leftward-shifted cards grow the document
          width on RTL narrow screens */}
      <div className="mx-auto max-w-7xl overflow-x-clip px-4 sm:px-6">
        <SectionHeading
          titleId="categories-title"
          kicker="أقسام المتجر"
          title="تسوّق حسب"
          accentWord="الفئة"
          description="ثمانية أقسام متخصصة — اختار القسم اللي يناسبك وادخل على عالمه مباشرة."
        >
          <button
            onClick={() => navigate({ name: "store" })}
            className="group mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-foreground"
          >
            كل المنتجات
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </button>
        </SectionHeading>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {visible.map((cat, i) => (
            <Reveal key={cat.id} dir={i % 2 === 0 ? "start" : "end"} delay={Math.min(i * 0.05, 0.25)}>
              <CategoryCard category={cat} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================= Best sellers ========================= */

function BestSellersSection() {
  const products = useMockDB((s) => s.products);
  const navigate = useRouterStore((s) => s.navigate);
  const featured = products.filter((p) => p.featured).slice(0, 8);

  if (featured.length === 0) return null;

  return (
    <section className="relative py-20 sm:py-28" aria-labelledby="bestsellers-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          titleId="bestsellers-title"
          kicker="مختارات هايبر تك"
          title="الأكثر"
          accentWord="مبيعًا"
          description="تشكيلة مختارة بعناية — المنتجات اللي عملاؤنا بيسألوا عليها فعلًا، متجددة أول بأول."
        >
          <button
            onClick={() => navigate({ name: "store" })}
            className="group mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-foreground"
          >
            شوف الكتالوج كامل
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </button>
        </SectionHeading>

        <StaggerReveal className="grid grid-cols-1 gap-5 min-[520px]:grid-cols-2 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}

/* ========================= Trust + services (VERIFIED facts) ========================= */

const WHY_ITEMS = [
  {
    icon: RefreshCw,
    title: "بيع… وشراء… واستبدال",
    body: "مش بس بنبيع: تقدر تستبدل جهازك القديم بجديد وتدفع الفرق، أو تبيعه لو مش محتاجه — خدمة موثقة في نشاط المتجر.",
    fact: "من وصف صفحة المتجر الرسمية",
  },
  {
    icon: Cpu,
    title: "تخصص حقيقي في التقنية",
    body: "لابتوب، أجزاء كمبيوتر، وهواتف — مجال بنعرفه بتفصيله، من اختيار القطعة للمواصفات المناسبة لاستخدامك.",
    fact: "من وصف صفحة المتجر الرسمية",
  },
  {
    icon: MessageCircle,
    title: "تواصل مباشر بلا حسابات",
    body: "مفيش تسجيل ولا بيانات تدخلها — كلمنا واتساب مباشرة واتفق معك على كل التفاصيل قبل أي شراء.",
    fact: "قناة التواصل الرسمية",
  },
  {
    icon: Users,
    title: "مجتمع بيثق فينا",
    body: "أكتر من 1,700 متابع على صفحتنا بيتابعوا عروضنا ومنتجاتنا أول بأول — وأحنا بنرد على الجميع.",
    fact: "إحصائية فيسبوك وقت البحث",
  },
];

function TrustSection() {
  const navigate = useRouterStore((s) => s.navigate);

  return (
    <section className="relative py-20 sm:py-28" aria-labelledby="why-title">
      {/* overflow-x-clip — same reason as the categories grid: pending
          horizontal Reveal cards (dir start/end) must not widen the doc */}
      <div className="mx-auto max-w-7xl overflow-x-clip px-4 sm:px-6">
        <SectionHeading
          titleId="why-title"
          kicker="ليه هايبر تك؟"
          title="أربعة أسباب"
          accentWord="موثّقة"
          description="كل ميزة هنا مأخوذة من معلومات حقيقية عن نشاط المتجر — مفيش وعود عامة."
        />

        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
          {WHY_ITEMS.map((item, i) => (
            <Reveal key={item.title} dir={i % 2 === 0 ? "start" : "end"}>
              <article className="group relative h-full overflow-hidden rounded-3xl border border-hair bg-elevated p-6 shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-card-lg sm:p-8">
                <span
                  className="pointer-events-none absolute -top-5 left-4 font-tech text-7xl font-bold text-foreground/[0.05] transition-colors duration-500 group-hover:text-primary/10"
                  aria-hidden
                >
                  0{i + 1}
                </span>
                <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[0.07] text-primary transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <item.icon className="h-5.5 w-5.5" />
                </span>
                <h3 className="font-display text-lg font-bold sm:text-xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.body}</p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-[0.68rem] font-semibold text-faint">
                  <BadgeCheck className="h-3.5 w-3.5 text-mint" />
                  {item.fact}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Maintenance CTA band */}
        <Reveal dir="up" className="mt-14">
          <div className="relative flex flex-col items-start gap-6 overflow-hidden rounded-3xl border border-primary/15 bg-primary/[0.045] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 orb-glow opacity-80"
            />
            <div className="relative flex items-center gap-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                <Wrench className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-display text-xl font-bold sm:text-2xl">جهازك فيه مشكلة؟</h3>
                <p className="mt-1.5 max-w-md text-sm leading-7 text-muted-foreground">
                  صف لنا المشكلة بخطوات بسيطة — من غير حساب ولا تعقيد — وابعتها واتساب على طول،
                  وفريق الصيانة هيتواصل معاك.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate({ name: "maintenance" })}
              className="glow-accent-sm group relative inline-flex shrink-0 items-center gap-2.5 rounded-2xl bg-primary px-7 py-4 font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95"
            >
              ابدأ طلب الصيانة
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
