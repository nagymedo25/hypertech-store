"use client";

/**
 * ============================================================
 * BUILDS VIEW — the dedicated PC-builds experience · Light
 * ============================================================
 * Its own personality: intro band with atmosphere, type filter
 * chips, performance-focused BuildCards. Data-driven — types
 * derive from the actual builds present in the store.
 * ============================================================
 */

import { useEffect, useMemo, useState } from "react";
import { Cpu, SlidersHorizontal } from "lucide-react";
import { ViewHeader } from "@/components/layout/view-header";
import { BuildCard } from "@/components/builds/build-card";
import { StaggerReveal } from "@/components/motion/reveal";
import { useMockDB } from "@/lib/store/db-store";
import { useRouterStore } from "@/lib/router";
import { BUILD_TYPE_META } from "@/lib/format";
import { IMG } from "@/lib/data/images";
import { cn } from "@/lib/utils";

const TYPE_ORDER = ["gaming", "workstation", "creator", "budget"] as const;

export default function BuildsView() {
  const builds = useMockDB((s) => s.builds);
  const navigate = useRouterStore((s) => s.navigate);
  const [type, setType] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  /* Brief skeleton on entry (simulated async feel) */
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 380);
    return () => clearTimeout(t);
  }, []);

  const availableTypes = useMemo(() => {
    const present = new Set(builds.map((b) => b.type));
    return TYPE_ORDER.filter((t) => present.has(t));
  }, [builds]);

  const filtered = useMemo(
    () => (type === "all" ? builds : builds.filter((b) => b.type === type)),
    [builds, type]
  );

  return (
    <div className="relative">
      {/* Atmosphere band */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[420px] overflow-hidden">
        { }
        <img src={IMG.catBuilds} alt="" className="h-full w-full object-cover img-grade opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/85 to-background" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <ViewHeader
          kicker="تجميعات PC"
          title="مصمّمة تُشبع"
          accentWord="أدائك"
          description="تجميعات هايبر تك مدروسة بعناية: توازن حقيقي بين المعالج والكارت والذاكرة — بلا اختيارات عشوائية ولا مصاريف زائدة. اختار مستواك، واحنا جاهزين نعدّل معاك."
          accent="#2E6E5E"
        >
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/10 px-4 py-1.5 text-xs font-bold text-mint">
              <Cpu className="h-3.5 w-3.5" />
              {builds.length} تجميعة جاهزة
            </span>
            <span className="rounded-full border border-hair bg-foreground/[0.03] px-4 py-1.5 text-xs text-muted-foreground">
              إمكانية التعديل على المكونات حسب ميزانيتك
            </span>
          </div>
        </ViewHeader>

        {/* Type filter */}
        <div className="sticky top-16 z-30 -mx-4 mb-8 bg-background/70 px-4 py-3 backdrop-blur-xl sm:top-[4.5rem] sm:-mx-6 sm:px-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-faint" aria-hidden />
            <FilterChip active={type === "all"} onClick={() => setType("all")}>
              الكل
            </FilterChip>
            {availableTypes.map((t) => (
              <FilterChip key={t} active={type === t} onClick={() => setType(t)}>
                {BUILD_TYPE_META[t]}
              </FilterChip>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 pb-24 sm:gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shimmer h-96 rounded-3xl border border-hair" aria-hidden />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <Cpu className="h-12 w-12 text-faint" strokeWidth={1.2} aria-hidden />
            <p className="font-display text-xl font-bold">مفيش تجميعات في الفئة دي حاليًا</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              جرّب فلتر تاني، أو كلمنا واتساب — نبني لك تجميعة مخصصة على مقاس ميزانيتك.
            </p>
            <button
              onClick={() => setType("all")}
              className="rounded-2xl border border-primary/35 bg-primary/[0.06] px-5 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/[0.12]"
            >
              عرض كل التجميعات
            </button>
          </div>
        ) : (
          <StaggerReveal className="grid grid-cols-1 gap-4 pb-24 sm:gap-6 md:grid-cols-2">
            {filtered.map((b) => (
              <BuildCard key={b.id} build={b} />
            ))}
          </StaggerReveal>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-all active:scale-95",
        active
          ? "border-mint/50 bg-mint/15 text-mint shadow-[0_6px_18px_-8px_rgba(46,125,91,0.4)]"
          : "border-hair bg-elevated/70 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
