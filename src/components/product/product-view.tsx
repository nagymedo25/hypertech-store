"use client";

/**
 * ============================================================
 * HYPER TECH — Product View (صفحة تفاصيل المنتج)
 * ============================================================
 * تخطيط عمودين RTL: المعرض (جهة البداية/يمين) + عمود الشراء
 * اللاصق (جهة النهاية/يسار). معرض بصور متبدلة بـ crossfade
 * وتنقل بالكيبورد، مواصفات بثلاث تخطيطات حسب specLayout،
 * منتجات مقترحة، وشريط شراء سفلي ثابت على الموبايل.
 * ============================================================
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { Check, ChevronLeft, Cpu, HardDrive, Loader2, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import type { SpecItem } from "@/types";
import { useRouterStore } from "@/lib/router";
import { useMockDB } from "@/lib/store/db-store";
import { useCartStore } from "@/lib/store/cart-store";
import { NotFoundView } from "@/components/layout/not-found";
import { SectionHeading } from "@/components/store/section-heading";
import { ProductCard } from "@/components/store/product-card";
import { AvailabilityBadge, PriceTag, PromoBadge } from "@/components/store/catalog-atoms";
import { Reveal, StaggerReveal } from "@/components/motion/reveal";
import { AnimatedNumber } from "@/components/motion/micro-interactions";
import { productWhatsAppUrl } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/format";
import { EASE, prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ---------------------------- subcomponents --------------------------- */

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12.04 2a9.9 9.9 0 0 0-8.51 14.9L2 22l5.25-1.38A9.9 9.9 0 1 0 12.04 2Zm5.8 14.15c-.25.7-1.45 1.33-2 1.38-.55.05-1.06.25-3.6-.75-3.05-1.2-4.95-4.35-5.1-4.55-.15-.2-1.2-1.6-1.2-3.05 0-1.45.75-2.15 1.02-2.45.27-.3.6-.37.8-.37s.4 0 .57.01c.18.01.43-.07.67.51.25.6.85 2.05.92 2.2.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.61.17.3.75 1.24 1.61 2 1.1.98 2.03 1.29 2.33 1.44.3.15.47.12.64-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.28.1 1.75.83 2.05.98.3.15.5.22.57.35.08.12.08.72-.17 1.42Z" />
    </svg>
  );
}

/** device → صفوف (تسمية/قيمة) بخطوط شعرية وأناقة هادئة */
function DeviceSpecs({ specs }: { specs: SpecItem[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
      {specs.map((s) => (
        <div
          key={s.label}
          className="-mx-3 flex items-baseline justify-between gap-4 rounded-xl border-b border-hair px-3 py-3.5 transition-colors duration-300 hover:bg-foreground/[0.02]"
        >
          <dt className="shrink-0 text-xs text-muted-foreground sm:text-sm">{s.label}</dt>
          <dd className="text-left text-sm font-bold leading-6">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** component → شبكة كروت مواصفات صغيرة */
function ComponentSpecs({ specs }: { specs: SpecItem[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {specs.map((s) => (
        <li key={s.label} className="rounded-2xl border border-hair bg-elevated p-4">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-faint">{s.label}</p>
          <p className="mt-2 font-tech text-sm font-bold leading-6">{s.value}</p>
        </li>
      ))}
    </ul>
  );
}

/** accessory → صفوف بأسلوب الشارات (تسمية pill + قيمة) */
function AccessorySpecs({ specs }: { specs: SpecItem[] }) {
  return (
    <ul className="space-y-3.5">
      {specs.map((s) => (
        <li key={s.label} className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-hair bg-elevated px-3.5 py-1.5 text-xs font-bold text-muted-foreground">
            {s.label}
          </span>
          <span className="text-sm font-medium leading-7">{s.value}</span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------ the view ------------------------------ */

export default function ProductView({ slug }: { slug: string }) {
  const products = useMockDB((s) => s.products);
  const categories = useMockDB((s) => s.categories);
  const navigate = useRouterStore((s) => s.navigate);
  const addToCart = useCartStore((s) => s.add);
  const markAdded = useCartStore((s) => s.markAdded);

  const product = products.find((p) => p.slug === slug);
  const category = product ? categories.find((c) => c.id === product.categoryId) : undefined;
  const hardwareUpgradeRates = useMockDB((s) => s.hardwareUpgradeRates);

  const [qty, setQty] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedRam, setSelectedRam] = useState<string>(product?.baseRam || "");
  const [selectedStorage, setSelectedStorage] = useState<string>(product?.baseStorage || "");

  /* أطوار زر الإضافة: idle → pending (~180ms) → added (1.6s احتفال) → idle */
  const [addState, setAddState] = useState<"idle" | "pending" | "added">("idle");
  const addTimers = useRef<number[]>([]);

  /* Never leave a success timer firing after the view unmounts */
  useEffect(() => () => addTimers.current.forEach((t) => window.clearTimeout(t)), []);

  /* منتج → منتج بدون remount: صفّر حالة العرض (نفس نمط React الرسمي) */
  const [prevSlug, setPrevSlug] = useState(slug);
  if (slug !== prevSlug) {
    setPrevSlug(slug);
    setQty(1);
    setActiveIdx(0);
    setSelectedRam(product?.baseRam || "");
    setSelectedStorage(product?.baseStorage || "");
  }

  const ramOptions = useMemo(() => {
    if (!product?.allowRamUpgrade) return [];
    const activeRates = hardwareUpgradeRates
      .filter((r) => r.componentType === "ram" && r.active)
      .sort((a, b) => a.order - b.order || (a.capacityGb ?? 0) - (b.capacityGb ?? 0));

    const list = [...activeRates];
    if (product.baseRam && !list.some((r) => r.label === product.baseRam)) {
      list.unshift({
        id: "base-ram",
        componentType: "ram",
        label: product.baseRam,
        capacityGb: null,
        priceDelta: 0,
        order: -1,
        active: true,
        createdAt: "",
        updatedAt: "",
      });
    }

    const custom = (product.customHardwarePricing as Record<string, number> | null) ?? {};
    return list.map((item) => {
      const isBase = item.label === product.baseRam;
      const delta = isBase
        ? 0
        : custom[item.label] !== undefined
        ? Number(custom[item.label]) || 0
        : item.priceDelta;
      return {
        ...item,
        isBase,
        effectiveDelta: delta,
      };
    });
  }, [product?.allowRamUpgrade, product?.baseRam, product?.customHardwarePricing, hardwareUpgradeRates]);

  const storageOptions = useMemo(() => {
    if (!product?.allowStorageUpgrade) return [];
    const activeRates = hardwareUpgradeRates
      .filter((r) => r.componentType === "storage" && r.active)
      .sort((a, b) => a.order - b.order || (a.capacityGb ?? 0) - (b.capacityGb ?? 0));

    const list = [...activeRates];
    if (product.baseStorage && !list.some((r) => r.label === product.baseStorage)) {
      list.unshift({
        id: "base-storage",
        componentType: "storage",
        label: product.baseStorage,
        capacityGb: null,
        priceDelta: 0,
        order: -1,
        active: true,
        createdAt: "",
        updatedAt: "",
      });
    }

    const custom = (product.customHardwarePricing as Record<string, number> | null) ?? {};
    return list.map((item) => {
      const isBase = item.label === product.baseStorage;
      const delta = isBase
        ? 0
        : custom[item.label] !== undefined
        ? Number(custom[item.label]) || 0
        : item.priceDelta;
      return {
        ...item,
        isBase,
        effectiveDelta: delta,
      };
    });
  }, [product?.allowStorageUpgrade, product?.baseStorage, product?.customHardwarePricing, hardwareUpgradeRates]);

  const activeRam = selectedRam || product?.baseRam || ramOptions[0]?.label || "";
  const activeStorage = selectedStorage || product?.baseStorage || storageOptions[0]?.label || "";

  const selectedRamOpt = ramOptions.find((r) => r.label === activeRam);
  const selectedStorageOpt = storageOptions.find((r) => r.label === activeStorage);

  const ramDelta = product?.allowRamUpgrade && selectedRamOpt ? selectedRamOpt.effectiveDelta : 0;
  const storageDelta =
    product?.allowStorageUpgrade && selectedStorageOpt ? selectedStorageOpt.effectiveDelta : 0;

  const dynamicUnitPrice = (product?.price ?? 0) + ramDelta + storageDelta;
  const dynamicOldPrice = product?.oldPrice ? product.oldPrice + ramDelta + storageDelta : undefined;

  if (!product) {
    return <NotFoundView what="المنتج" />;
  }

  const images = product.images;
  const hasGallery = images.length > 0;
  const activeIdxSafe = hasGallery ? Math.min(activeIdx, images.length - 1) : 0;

  const outOfStock = product.availability === "out-of-stock";
  const preOrder = product.availability === "pre-order";
  /* حارس الكمية: المخزون بحد أقصى 10 — والحجز المسبق حد أقصاه 5 */
  const maxQty = preOrder ? 5 : Math.max(1, Math.min(product.stockQty, 10));

  const related = products
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4);
  const descriptionParts = product.description
    .split(/\n+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const rating = Math.round(product.rating);

  const goStore = () => {
    if (category) navigate({ name: "store", categorySlug: category.slug });
    else navigate({ name: "store" });
  };

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (outOfStock) return;
    if (addState !== "idle") return; // double-submission guard
    const btn = e.currentTarget;

    setAddState("pending");
    /* ~180ms perceived processing — الكتابة نفسها محلية ولحظية؛
       التأخير المدروس إحساس لمسي فقط (سبينر صادق على الزر) */
    addTimers.current.push(
      window.setTimeout(() => {
        try {
          addToCart(product.id, {
            qty,
            selectedRam: product.allowRamUpgrade ? activeRam : undefined,
            selectedStorage: product.allowStorageUpgrade ? activeStorage : undefined,
            ramUpgradePrice: ramDelta,
            storageUpgradePrice: storageDelta,
            unitPrice: dynamicUnitPrice,
          });
          markAdded(product.id, qty, {
            selectedRam: product.allowRamUpgrade ? activeRam : undefined,
            selectedStorage: product.allowStorageUpgrade ? activeStorage : undefined,
            unitPrice: dynamicUnitPrice,
          });
          setAddState("added");
          /* ضغطة النجاح: 1.03 → 1 */
          if (btn && !prefersReducedMotion()) {
            gsap.fromTo(btn, { scale: 1.03 }, { scale: 1, duration: 0.45, ease: EASE.elastic });
          }
        } catch {
          toast.error("حصلت مشكلة أثناء الإضافة للسلة", {
            description: "جرّب تاني لو سمحت — سلتك لم تتأثر.",
          });
          setAddState("idle");
          return;
        }
        addTimers.current.push(window.setTimeout(() => setAddState("idle"), 1600));
      }, 180)
    );
  };

  const openWhatsApp = () => {
    window.open(
      productWhatsAppUrl(product, qty, {
        selectedRam: product.allowRamUpgrade ? activeRam : undefined,
        selectedStorage: product.allowStorageUpgrade ? activeStorage : undefined,
        unitPrice: dynamicUnitPrice,
      }),
      "_blank",
      "noopener,noreferrer"
    );
  };

  const step = (dir: 1 | -1) => setQty((q) => Math.min(maxQty, Math.max(1, q + dir)));

  const onGalleryKey = (e: React.KeyboardEvent) => {
    if (images.length < 2) return;
    /* RTL: السهم الشمال = التالي */
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % images.length);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + images.length) % images.length);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-44 pt-24 sm:px-6 sm:pt-28 lg:pb-16">
      {/* ====================== مسار التنقل ====================== */}
      <nav aria-label="مسار التنقل">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
          <li>
            <button
              type="button"
              onClick={() => navigate({ name: "home" })}
              className="transition-colors hover:text-foreground"
            >
              الرئيسية
            </button>
          </li>
          <li aria-hidden className="flex items-center">
            <ChevronLeft className="h-3.5 w-3.5 text-faint" />
          </li>
          <li>
            <button type="button" onClick={goStore} className="transition-colors hover:text-foreground">
              المتجر
            </button>
          </li>
          {category && (
            <>
              <li aria-hidden className="flex items-center">
                <ChevronLeft className="h-3.5 w-3.5 text-faint" />
              </li>
              <li>
                <button
                  type="button"
                  onClick={goStore}
                  className="font-semibold transition-opacity hover:opacity-80"
                  style={{ color: category.accent }}
                >
                  {category.name}
                </button>
              </li>
            </>
          )}
          <li aria-hidden className="flex items-center">
            <ChevronLeft className="h-3.5 w-3.5 text-faint" />
          </li>
          <li className="font-bold text-foreground" aria-current="page">
            <span className="line-clamp-1 max-w-[15rem] sm:max-w-xs lg:max-w-sm">{product.name}</span>
          </li>
        </ol>
      </nav>

      {/* ============ عمودان: المعرض (البداية/يمين) + المعلومات ============ */}
      {/* grid-cols-1 (minmax(0,1fr)) keeps the implicit mobile track
          viewport-sized instead of max-content sized */}
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
        {/* ------------------------- المعرض ------------------------- */}
        <Reveal dir="scale">
          <div
            className="relative aspect-[4/3] touch-pan-y overflow-hidden rounded-3xl border border-hair bg-[#0d0f13] shadow-card"
            tabIndex={0}
            role="group"
            aria-label="معرض صور المنتج — استخدم الأسهم للتنقل بين الصور"
            onKeyDown={onGalleryKey}
          >
            {images.map((src, i) => (
              <img
                key={`${src}-${i}`}
                src={src}
                alt={i === activeIdxSafe ? product.name : ""}
                loading={i === 0 ? "eager" : "lazy"}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover img-grade transition-opacity duration-500 ease-out",
                  i === activeIdxSafe ? "opacity-100" : "opacity-0"
                )}
              />
            ))}

            {/* شارات العرض والتوفر */}
            <span className="absolute right-3 top-3 flex flex-col items-start gap-2">
              {product.promotionalLabel && <PromoBadge label={product.promotionalLabel} />}
            </span>
            <span className="absolute left-3 top-3">
              <AvailabilityBadge status={product.availability} size="md" />
            </span>

            {/* عدّاد الصور */}
            {images.length > 1 && (
              <span
                className="absolute bottom-3 left-3 rounded-full bg-elevated/90 px-2.5 py-1 font-tech text-[0.65rem] font-bold text-foreground backdrop-blur-sm shadow-card"
                dir="ltr"
              >
                {activeIdxSafe + 1}/{images.length}
              </span>
            )}
          </div>

          {/* الصور المصغّرة */}
          {images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button
                  key={`thumb-${src}-${i}`}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  aria-label={`عرض الصورة ${i + 1}`}
                  aria-current={i === activeIdxSafe}
                  className={cn(
                    "relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border bg-[#0d0f13] transition-all duration-300 active:scale-95",
                    i === activeIdxSafe
                      ? "border-primary glow-accent-sm"
                      : "border-hair opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </Reveal>

        {/* ------------------- معلومات الشراء (لاصقة) ------------------- */}
        <Reveal dir="start">
          <div className="lg:sticky lg:top-[5.5rem]">
            {/* الماركة + التقييم */}
            <div className="flex items-center justify-between gap-3">
              <span className="font-tech text-xs font-bold uppercase tracking-widest text-faint" dir="ltr">
                {product.brand}
              </span>
              {product.rating > 0 ? (
                <span className="flex items-center gap-1.5" aria-label={`التقييم ${product.rating.toFixed(1)} من 5`}>
                  <span className="flex items-center gap-0.5" aria-hidden>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className={cn("h-4 w-4", i < rating ? "fill-amber text-amber" : "text-faint")} />
                    ))}
                  </span>
                  <span className="font-tech text-sm font-bold tabular-nums" dir="ltr">
                    {product.rating.toFixed(1)}
                  </span>
                </span>
              ) : (
                <span className="text-xs text-faint">لسه مفيش تقييم</span>
              )}
            </div>

            <h1 className="mt-3 font-display text-2xl font-bold leading-[1.3] sm:text-3xl lg:text-4xl">
              {product.name}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              <PriceTag price={dynamicUnitPrice} oldPrice={dynamicOldPrice} size="lg" />
              {product.promotionalLabel && <PromoBadge label={product.promotionalLabel} />}
            </div>

            <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-[0.95rem]">
              {product.shortDescription}
            </p>

            <div aria-hidden className="hairline-x my-6" />

            <div className="space-y-4">
              {descriptionParts.map((para, i) => (
                <p key={i} className="text-sm leading-7 text-muted-foreground">
                  {para}
                </p>
              ))}
            </div>

            {/* ---------------- خيارات ترقية العتاد (RAM & Storage) ---------------- */}
            {(product.allowRamUpgrade || product.allowStorageUpgrade) && (
              <div className="mt-7 space-y-4 rounded-3xl border border-hair bg-elevated/70 p-4 shadow-card sm:p-5">
                <div className="flex items-center justify-between border-b border-hair pb-3">
                  <h3 className="flex items-center gap-2 font-display text-base font-bold text-foreground">
                    <Cpu className="h-5 w-5 text-brand-blue" />
                    تخصيص وترقية العتاد
                  </h3>
                  <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-[11px] font-bold text-brand-blue">
                    تحديث فوري للسعر
                  </span>
                </div>

                {/* RAM selector */}
                {product.allowRamUpgrade && ramOptions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 text-brand-blue" />
                        سعة الذاكرة العشوائية (RAM):
                      </span>
                      <span className="font-tech font-bold text-brand-blue">{activeRam}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {ramOptions.map((opt) => {
                        const isSelected = activeRam === opt.label;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSelectedRam(opt.label)}
                            className={cn(
                              "flex flex-col items-start justify-center rounded-xl border p-2.5 text-right transition-all duration-200",
                              isSelected
                                ? "border-brand-blue bg-brand-blue/15 shadow-[0_0_12px_rgba(26,92,166,0.25)] ring-1 ring-brand-blue"
                                : "border-hair bg-surface/60 hover:border-foreground/20 hover:bg-surface"
                            )}
                          >
                            <span className="font-tech text-xs font-bold text-foreground">{opt.label}</span>
                            <span
                              className={cn(
                                "mt-1 font-tech text-[10px]",
                                opt.effectiveDelta === 0
                                  ? "text-faint"
                                  : isSelected
                                  ? "font-bold text-brand-cyan"
                                  : "text-muted-foreground"
                              )}
                            >
                              {opt.effectiveDelta === 0 ? "الأساسي" : `+${opt.effectiveDelta.toLocaleString()} ج.م`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Storage selector */}
                {product.allowStorageUpgrade && storageOptions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-hair/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <HardDrive className="h-3.5 w-3.5 text-brand-cyan" />
                        سعة وحدة التخزين (SSD):
                      </span>
                      <span className="font-tech font-bold text-brand-cyan">{activeStorage}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {storageOptions.map((opt) => {
                        const isSelected = activeStorage === opt.label;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSelectedStorage(opt.label)}
                            className={cn(
                              "flex flex-col items-start justify-center rounded-xl border p-2.5 text-right transition-all duration-200",
                              isSelected
                                ? "border-brand-cyan bg-brand-cyan/15 shadow-[0_0_12px_rgba(0,217,255,0.2)] ring-1 ring-brand-cyan"
                                : "border-hair bg-surface/60 hover:border-foreground/20 hover:bg-surface"
                            )}
                          >
                            <span className="font-tech text-xs font-bold text-foreground">{opt.label}</span>
                            <span
                              className={cn(
                                "mt-1 font-tech text-[10px]",
                                opt.effectiveDelta === 0
                                  ? "text-faint"
                                  : isSelected
                                  ? "font-bold text-brand-cyan"
                                  : "text-muted-foreground"
                              )}
                            >
                              {opt.effectiveDelta === 0 ? "الأساسي" : `+${opt.effectiveDelta.toLocaleString()} ج.م`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ---------------------- لوحة الشراء ---------------------- */}
            <div className="mt-7 rounded-3xl border border-hair bg-elevated p-4 shadow-card sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <AvailabilityBadge status={product.availability} size="md" />
                {preOrder && (
                  <span className="text-xs text-muted-foreground">
                    أقصى كمية للحجز: <span className="font-tech font-bold text-foreground">5</span>
                  </span>
                )}
                {!outOfStock && !preOrder && (
                  <span className="text-xs text-muted-foreground">
                    المتوفر بالمخزون:{" "}
                    <span className="font-tech font-bold text-foreground">{product.stockQty}</span>
                  </span>
                )}
              </div>

              {outOfStock && (
                <p className="mt-3 text-xs leading-6 text-danger">
                  المنتج مش متوفر حاليًا — كلمنا واتساب ونتابع لك التوفر أول ما يرجع.
                </p>
              )}

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* عدّاد الكمية */}
                <div
                  className={cn(
                    "flex items-center gap-0.5 rounded-full border border-hair bg-background/60 p-1",
                    outOfStock && "opacity-50"
                  )}
                  role="group"
                  aria-label="اختيار الكمية"
                >
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    disabled={outOfStock || qty <= 1}
                    aria-label="تقليل الكمية"
                    className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-foreground/[0.05] active:scale-90 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <Minus className="h-4 w-4" aria-hidden />
                  </button>
                  <span
                    className="w-10 text-center font-tech text-lg font-bold tabular-nums"
                    aria-live="polite"
                    aria-label={`الكمية: ${qty}`}
                  >
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    disabled={outOfStock || qty >= maxQty}
                    aria-label="زيادة الكمية"
                    className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-foreground/[0.05] active:scale-90 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                {/* إضافة للسلة — نفس النمط اللمسي لـ ProductCard */}
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={outOfStock || addState !== "idle"}
                  className={cn(
                    "flex h-12 flex-1 items-center justify-center gap-2.5 rounded-2xl px-6 text-sm font-bold transition-all active:scale-95",
                    outOfStock
                      ? "cursor-not-allowed border border-hair bg-raised text-faint"
                      : addState === "added"
                      ? "border border-mint/40 bg-mint/10 text-mint"
                      : addState === "pending"
                      ? "cursor-wait bg-primary text-primary-foreground"
                      : "bg-primary text-primary-foreground hover:bg-[#2a6cb3] hover:glow-accent-sm active:shadow-[inset_0_2px_5px_rgba(11,31,56,0.35)]"
                  )}
                >
                  {addState === "pending" ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  ) : addState === "added" ? (
                    <Check className="h-5 w-5" strokeWidth={2.75} aria-hidden />
                  ) : (
                    <ShoppingBag className="h-5 w-5" aria-hidden />
                  )}
                  {outOfStock
                    ? "غير متوفر حاليًا"
                    : addState === "pending"
                    ? "جاري الإضافة..."
                    : addState === "added"
                    ? "أضيف للسلة"
                    : "أضف إلى السلة"}
                </button>
              </div>

              {/* شراء عبر واتساب — نسخ صادقة */}
              <button
                type="button"
                onClick={openWhatsApp}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-[#1fae53]/35 bg-[#1fae53]/10 px-6 text-sm font-bold text-[#1fae53] transition-all hover:bg-[#1fae53]/20 active:scale-95"
              >
                <WhatsAppGlyph className="h-5 w-5" />
                اشترِ عبر واتساب
              </button>
              <p className="mt-2.5 text-center text-[0.7rem] leading-5 text-faint">
                يفتح محادثة واتساب مع تفاصيل المنتج — من غير أي التزام.
              </p>

              {/* إجمالي سريع */}
              <div className="mt-4 flex items-center justify-between border-t border-hair pt-4">
                <span className="text-sm text-muted-foreground">إجمالي الطلب</span>
                <span className="font-tech text-lg font-bold tabular-nums text-foreground">
                  <AnimatedNumber value={dynamicUnitPrice * qty} format={formatPrice} />
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ======================= المواصفات ======================= */}
      {product.specs.length > 0 && (
        <section className="mt-16 sm:mt-24" aria-label="المواصفات">
          <SectionHeading kicker="المواصفات" title="التفاصيل التقنية" />
          <Reveal dir="up">
            {product.specLayout === "device" && <DeviceSpecs specs={product.specs} />}
            {product.specLayout === "component" && <ComponentSpecs specs={product.specs} />}
            {product.specLayout === "accessory" && <AccessorySpecs specs={product.specs} />}
          </Reveal>
        </section>
      )}

      {/* ==================== منتجات مقترحة ==================== */}
      {related.length > 0 && (
        <section className="mt-16 sm:mt-24" aria-label="منتجات مقترحة">
          <SectionHeading kicker="من نفس الفئة" title="قد يعجبك أيضًا" />
          <StaggerReveal className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} category={category} />
            ))}
          </StaggerReveal>
        </section>
      )}

      {/* ====== شريط الشراء السفلي (موبايل) — فوق زر واتساب العائم ====== */}
      <div
        className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 lg:hidden"
        role="region"
        aria-label="شراء سريع"
      >
        <div className="glass mx-3 flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
          <PriceTag price={dynamicUnitPrice} oldPrice={dynamicOldPrice} size="sm" animate={false} />
          {outOfStock ? (
            <button
              type="button"
              onClick={openWhatsApp}
              className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-[#1fae53]/40 bg-[#1fae53]/15 px-4 text-xs font-bold text-[#1fae53] transition-all active:scale-95"
            >
              <WhatsAppGlyph className="h-4 w-4" />
              واتساب
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              disabled={addState !== "idle"}
              className={cn(
                "flex h-11 shrink-0 items-center gap-2 rounded-xl px-5 text-sm font-bold transition-all active:scale-95",
                addState === "added"
                  ? "border border-mint/40 bg-mint/10 text-mint"
                  : addState === "pending"
                  ? "cursor-wait bg-primary text-primary-foreground"
                  : "bg-primary text-primary-foreground hover:bg-[#2a6cb3] hover:glow-accent-sm active:shadow-[inset_0_2px_5px_rgba(11,31,56,0.35)]"
              )}
            >
              {addState === "pending" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : addState === "added" ? (
                <Check className="h-4 w-4" strokeWidth={2.75} aria-hidden />
              ) : (
                <ShoppingBag className="h-4 w-4" aria-hidden />
              )}
              {addState === "added" ? "أضيف" : addState === "pending" ? "جاري..." : "أضف للسلة"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
