"use client";

/**
 * ProductCard — the flagship catalog card (Luxury Light).
 * A white gallery card with a charcoal "display window" for the
 * product photograph (all studio shots are dark-backed — we turn
 * that into a deliberate, premium contrast), category-accent
 * hover ring, tactile add-to-cart (pending guard → 1.6s mint
 * success morph) that opens the persistent AddedPanel.
 */

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ArrowLeft, Check, Loader2, ShoppingBag } from "lucide-react";
import type { Category, Product } from "@/types";
import { useRouterStore } from "@/lib/router";
import { useCartStore } from "@/lib/store/cart-store";
import { useMockDB } from "@/lib/store/db-store";
import { AvailabilityBadge, PriceTag, PromoBadge } from "@/components/store/catalog-atoms";
import { EASE, prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/** Add-to-cart button phases: idle → pending (~180ms perceived) → added (1.6s celebration) → idle */
type AddState = "idle" | "pending" | "added";

export function ProductCard({
  product,
  category,
  className,
  compact = false,
}: {
  product: Product;
  category?: Category;
  className?: string;
  compact?: boolean;
}) {
  const navigate = useRouterStore((s) => s.navigate);
  const add = useCartStore((s) => s.add);
  const markAdded = useCartStore((s) => s.markAdded);
  const categories = useMockDB((s) => s.categories);
  const cat = category ?? categories.find((c) => c.id === product.categoryId);
  const cardRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [addState, setAddState] = useState<AddState>("idle");
  const timersRef = useRef<number[]>([]);

  /* Never leave a success timer firing after the card unmounts */
  useEffect(() => () => timersRef.current.forEach((t) => window.clearTimeout(t)), []);

  const disabled = product.availability === "out-of-stock";

  const go = () => navigate({ name: "product", slug: product.slug });

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) {
      toast.error("المنتج غير متوفر حاليًا", {
        description: "كلمنا واتساب ونتابع لك التوفر أول ما يوصل.",
      });
      return;
    }
    if (addState !== "idle") return; // double-submission guard

    setAddState("pending");
    /* ~180ms of *perceived* processing — the cart write itself is
       local and instant; this pause is pure tactility, shown honestly
       as a working spinner on the button. */
    timersRef.current.push(
      window.setTimeout(() => {
        try {
          add(product.id, 1);
          markAdded(product.id, 1);
          setAddState("added");
          /* Success pop: 1.03 → 1 (elastic settles it) */
          if (btnRef.current && !prefersReducedMotion()) {
            gsap.fromTo(
              btnRef.current,
              { scale: 1.03 },
              { scale: 1, duration: 0.45, ease: EASE.elastic }
            );
          }
        } catch {
          toast.error("حصلت مشكلة أثناء الإضافة للسلة", {
            description: "جرّب تاني لو سمحت — سلتك لم تتأثر.",
          });
          setAddState("idle");
          return;
        }
        timersRef.current.push(window.setTimeout(() => setAddState("idle"), 1600));
      }, 180)
    );
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-hair bg-elevated shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-card-lg",
        className
      )}
      style={{
        ["--cat-accent" as string]: cat?.accent ?? "#1a5ca6",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 20px 48px -20px rgba(36,31,24,0.28), 0 0 0 1px color-mix(in srgb, var(--cat-accent) 32%, transparent)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "";
      }}
    >
      {/* Media — the display window */}
      <button
        onClick={go}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-[#0d0f13]"
        aria-label={`عرض تفاصيل ${product.name}`}
      >
        { }
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover img-grade transition-transform duration-700 ease-out group-hover:scale-[1.07]"
        />
        {/* Bottom fade — keeps the window feeling like a lit display case */}
        <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0d0f13]/70 to-transparent" aria-hidden />

        {/* Badges */}
        <span className="absolute right-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {product.promotionalLabel && <PromoBadge label={product.promotionalLabel} />}
          {product.isNew && !product.promotionalLabel && (
            <span className="rounded-full border border-primary/30 bg-elevated/90 px-2.5 py-1 text-[0.68rem] font-bold text-primary backdrop-blur-sm">
              جديد
            </span>
          )}
        </span>
        <span className="absolute left-2.5 top-2.5">
          <AvailabilityBadge status={product.availability} />
        </span>

        {/* Hover arrow */}
        <span
          className="absolute bottom-2.5 left-2.5 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-elevated/95 text-foreground opacity-0 shadow-card transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
          aria-hidden
        >
          <ArrowLeft className="h-4 w-4" />
        </span>
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          {cat && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate({ name: "store", categorySlug: cat.slug });
              }}
              className="inline-flex items-center gap-1.5 text-[0.68rem] font-semibold transition-opacity hover:opacity-70"
              style={{ color: cat.accent }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cat.accent }} aria-hidden />
              {cat.name}
            </button>
          )}
          <span className="font-tech text-[0.68rem] uppercase tracking-wider text-faint" dir="ltr">
            {product.brand}
          </span>
        </div>

        <button onClick={go} className="text-right">
          <h3
            className={cn(
              "line-clamp-2 font-display font-bold leading-7 text-foreground transition-colors group-hover:text-primary",
              compact ? "text-[0.95rem]" : "text-base"
            )}
          >
            {product.name}
          </h3>
        </button>

        {!compact && (
          <p className="mt-1.5 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">
            {product.shortDescription}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <PriceTag price={product.price} oldPrice={product.oldPrice} size={compact ? "sm" : "md"} />

          <button
            ref={btnRef}
            onClick={handleAdd}
            disabled={disabled || addState !== "idle"}
            className={cn(
              "flex h-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
              addState === "added"
                ? "gap-1.5 border border-mint/40 bg-mint/10 px-4 text-mint"
                : "w-11",
              disabled
                ? "cursor-not-allowed border border-hair bg-raised text-faint"
                : addState === "pending"
                ? "cursor-wait bg-primary text-primary-foreground"
                : "bg-primary text-primary-foreground hover:glow-accent-sm hover:bg-[#2a6cb3] active:scale-95 active:shadow-[inset_0_2px_5px_rgba(11,31,56,0.35)]"
            )}
            aria-label={
              disabled
                ? "غير متوفر"
                : addState === "added"
                ? "أضيف للسلة"
                : addState === "pending"
                ? "جاري الإضافة إلى السلة"
                : `إضافة ${product.name} إلى السلة`
            }
            title={disabled ? "غير متوفر" : "أضف إلى السلة"}
          >
            {addState === "pending" ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : addState === "added" ? (
              <Check className="h-5 w-5" strokeWidth={2.75} aria-hidden />
            ) : (
              <ShoppingBag className="h-5 w-5" aria-hidden />
            )}
            {addState === "added" && (
              <span className="whitespace-nowrap text-xs font-bold">أضيف للسلة</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
