"use client";

/**
 * BuildCard — the PC-build presentation tile (Luxury Light).
 * White gallery card + charcoal display window for the build
 * photo, muted type-accent badge, component preview and a
 * tactile details CTA. Mirrors ProductCard's visual language.
 */

import { Cpu, ArrowLeft, Gauge } from "lucide-react";
import type { PCBuild } from "@/types";
import { useRouterStore } from "@/lib/router";
import { formatPrice, BUILD_TYPE_META } from "@/lib/format";
import { AvailabilityBadge } from "@/components/store/catalog-atoms";
import { cn } from "@/lib/utils";

/** Muted, desaturated type accents — readable on ivory/white. */
const TYPE_COLORS: Record<string, string> = {
  gaming: "#2E6E5E",
  workstation: "#A8703C",
  budget: "#3F6C93",
  creator: "#8A5A78",
};

export function BuildCard({ build, className }: { build: PCBuild; className?: string }) {
  const navigate = useRouterStore((s) => s.navigate);
  const typeColor = TYPE_COLORS[build.type] ?? "#1a5ca6";

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-hair bg-elevated shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-card-lg",
        className
      )}
    >
      {/* Media */}
      <button
        onClick={() => navigate({ name: "build", slug: build.slug })}
        className="relative block aspect-[16/10] w-full overflow-hidden bg-[#0d0f13]"
        aria-label={`عرض ${build.title}`}
      >
        { }
        <img
          src={build.images[0]}
          alt={build.title}
          loading="lazy"
          className="h-full w-full object-cover img-grade transition-transform duration-[900ms] group-hover:scale-[1.07]"
        />
        <span className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0d0f13]/70 to-transparent" aria-hidden />
        <span className="absolute right-3 top-3 flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.68rem] font-bold backdrop-blur-sm"
            style={{ borderColor: `${typeColor}55`, color: typeColor, background: "rgba(252,251,248,0.92)" }}
          >
            <Gauge className="h-3 w-3" aria-hidden />
            {BUILD_TYPE_META[build.type]}
          </span>
        </span>
        <span className="absolute left-3 top-3">
          <AvailabilityBadge status={build.availability} />
        </span>
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <button onClick={() => navigate({ name: "build", slug: build.slug })} className="text-right">
          <h3 className="font-display text-lg font-bold leading-8 transition-colors group-hover:text-primary">
            {build.title}
          </h3>
        </button>
        <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">
          {build.description}
        </p>

        {/* Components preview */}
        <ul className="mt-4 space-y-1.5">
          {build.components.slice(0, 4).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 text-[0.72rem]">
              <span className="shrink-0 text-faint">{c.role}</span>
              {/* min-w-0 lets the truncate actually engage — without it the
                  flex child refuses to shrink and long names get hard-clipped */}
              <span className="min-w-0 truncate font-medium text-muted-foreground">{c.name}</span>
            </li>
          ))}
          {build.components.length > 4 && (
            <li className="text-[0.72rem] text-primary">
              +{build.components.length - 4} مكونات أخرى…
            </li>
          )}
        </ul>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-hair pt-4 mt-5">
          <span className="font-tech text-lg font-bold text-foreground tabular-nums" dir="rtl">
            {formatPrice(build.totalPrice)}
          </span>
          <button
            onClick={() => navigate({ name: "build", slug: build.slug })}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary transition-all hover:bg-primary/20 hover:glow-accent-sm"
          >
            <Cpu className="h-4 w-4" />
            تفاصيل التجميعة
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
