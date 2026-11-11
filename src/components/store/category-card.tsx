"use client";

/**
 * CategoryCard — light premium "department" tile (homepage + store).
 * A gallery-style card: photographic media window with a warm
 * veil, editorial label row, accent-tinted arrow and a baseline
 * that draws in on hover. Works for product categories and the
 * PC-builds world alike.
 */

import { ArrowLeft } from "lucide-react";
import type { Category } from "@/types";
import { useRouterStore } from "@/lib/router";
import { useMockDB } from "@/lib/store/db-store";
import { cn } from "@/lib/utils";

export function CategoryCard({
  category,
  large = false,
  className,
}: {
  category: Category;
  large?: boolean;
  className?: string;
}) {
  const navigate = useRouterStore((s) => s.navigate);
  const products = useMockDB((s) => s.products);
  const builds = useMockDB((s) => s.builds);

  const isBuilds = category.slug === "builds";
  const count = isBuilds
    ? builds.length
    : products.filter((p) => p.categoryId === category.id).length;
  const countLabel = isBuilds ? "تجميعة" : "منتج";

  return (
    <button
      onClick={() => navigate({ name: "store", categorySlug: category.slug })}
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-3xl border border-hair bg-elevated text-right shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:border-foreground/20 hover:shadow-card-lg",
        className
      )}
      aria-label={`تصفح فئة ${category.name}`}
    >
      {/* Media window */}
      <span className="relative block overflow-hidden">
        { }
        <img
          src={category.image}
          alt={category.name}
          loading="lazy"
          className={cn(
            "w-full object-cover img-grade transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]",
            large ? "aspect-[16/10] sm:aspect-[16/8]" : "aspect-[4/3]"
          )}
        />
        {/* Warm cohesion veil */}
        <span
          className="absolute inset-0 bg-gradient-to-t from-[#24221d]/45 via-[#24221d]/5 to-transparent"
          aria-hidden
        />
        {/* Count chip */}
        <span
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.65rem] font-bold backdrop-blur-md"
          style={{
            borderColor: `${category.accent}55`,
            background: "rgba(251,250,247,0.82)",
            color: category.accent,
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.accent }} aria-hidden />
          {count} {countLabel}
        </span>
      </span>

      {/* Label row */}
      <span className="relative flex items-center justify-between gap-3 p-4 sm:p-5">
        <span className="min-w-0">
          <span className="block font-display text-base font-bold leading-7 text-foreground sm:text-xl">
            {category.name}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground sm:text-sm">
            {category.tagline}
          </span>
        </span>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-500 group-hover:-translate-x-1"
          style={{
            borderColor: `${category.accent}45`,
            background: `${category.accent}12`,
            color: category.accent,
          }}
          aria-hidden
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </span>
      </span>

      {/* Accent baseline — draws in on hover */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[3px] origin-right scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
        style={{ background: `linear-gradient(to left, ${category.accent}, ${category.accent}22)` }}
      />
    </button>
  );
}
