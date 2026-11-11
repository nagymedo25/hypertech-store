"use client";

/**
 * Catalog atoms: AvailabilityBadge + PriceTag + PromoBadge.
 * Shared by product cards, details, cart and admin.
 */

import { AVAILABILITY_META, discountPercent, formatPrice, formatPriceCompact } from "@/lib/format";
import { AnimatedNumber } from "@/components/motion/micro-interactions";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

const TONE_CLASSES: Record<string, string> = {
  success: "text-mint bg-mint/10 border-mint/25",
  warn: "text-amber bg-amber/10 border-amber/25",
  danger: "text-danger bg-danger/10 border-danger/25",
  info: "text-primary bg-primary/10 border-primary/25",
};

export function AvailabilityBadge({
  status,
  size = "sm",
}: {
  status: string;
  size?: "sm" | "md";
}) {
  const meta = AVAILABILITY_META[status];
  if (!meta) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        TONE_CLASSES[meta.tone],
        size === "sm" ? "px-2.5 py-1 text-[0.68rem]" : "px-3.5 py-1.5 text-xs"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          meta.tone === "success" && "animate-pulse-dot bg-mint",
          meta.tone === "warn" && "bg-amber",
          meta.tone === "danger" && "bg-danger",
          meta.tone === "info" && "bg-primary"
        )}
        aria-hidden
      />
      {meta.label}
    </span>
  );
}

export function PromoBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-l from-amber/20 to-amber/5 px-2.5 py-1 text-[0.68rem] font-bold text-amber border border-amber/25">
      <Zap className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

export function PriceTag({
  price,
  oldPrice,
  size = "md",
  animate = true,
  className,
}: {
  price: number;
  oldPrice?: number;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  className?: string;
}) {
  const off = discountPercent(price, oldPrice);
  return (
    <span className={cn("inline-flex flex-col items-start gap-0.5", className)} dir="rtl">
      {off !== null && (
        <span className="mb-0.5 rounded-md bg-danger/15 px-1.5 py-0.5 text-[0.6rem] font-bold text-danger" dir="rtl">
          خصم {off}%
        </span>
      )}
      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span
          className={cn(
            "font-tech font-bold text-foreground tabular-nums",
            size === "sm" && "text-sm",
            size === "md" && "text-base sm:text-lg",
            size === "lg" && "text-2xl sm:text-4xl"
          )}
        >
          {animate ? (
            <AnimatedNumber value={price} format={(n) => formatPriceCompact(n)} />
          ) : (
            formatPriceCompact(price)
          )}
          <span className="mr-1.5 text-[0.6em] font-medium text-muted-foreground">ج.م</span>
        </span>
        {oldPrice && (
          <s
            className={cn(
              "font-tech text-muted-foreground/60 tabular-nums",
              size === "lg" ? "text-base" : "text-[0.65rem] sm:text-xs"
            )}
            dir="ltr"
          >
            {formatPriceCompact(oldPrice)}
          </s>
        )}
      </span>
    </span>
  );
}
