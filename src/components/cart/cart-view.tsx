"use client";

/**
 * CART VIEW — full-page cart experience.
 * Items with animated steppers, live totals, honest empty state.
 * Checkout continues on the dedicated view (customer details).
 */

import { useMemo, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, MessageCircle } from "lucide-react";
import { ViewHeader } from "@/components/layout/view-header";
import { AnimatedNumber } from "@/components/motion/micro-interactions";
import { Reveal } from "@/components/motion/reveal";
import { useCartStore } from "@/lib/store/cart-store";
import { useMockDB } from "@/lib/store/db-store";
import { useRouterStore } from "@/lib/router";
import { formatPrice, formatPriceCompact } from "@/lib/format";
import { EASE, DUR } from "@/lib/motion";
import { toast } from "sonner";

export default function CartView() {
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const markCartViewed = useCartStore((s) => s.markCartViewed);
  const products = useMockDB((s) => s.products);
  const navigate = useRouterStore((s) => s.navigate);
  const listRef = useRef<HTMLDivElement>(null);

  /* وسم السلة بأنها مقروءة بمجرد الدخول للصفحة */
  useEffect(() => {
    markCartViewed();
  }, [markCartViewed]);

  const rows = useMemo(
    () =>
      items
        .map((i) => ({ ...i, product: products.find((p) => p.id === i.productId) }))
        .filter((r): r is typeof r & { product: NonNullable<typeof r.product> } => !!r.product),
    [items, products]
  );

  const subtotal = rows.reduce((acc, r) => acc + r.product.price * r.qty, 0);
  const count = rows.reduce((acc, r) => acc + r.qty, 0);

  /* Rows entrance */
  useEffect(() => {
    if (!listRef.current || rows.length === 0) return;
    const kids = listRef.current.querySelectorAll("[data-cart-page-row]");
    gsap.fromTo(kids, { x: -28, opacity: 0 }, { x: 0, opacity: 1, duration: DUR.base, stagger: 0.06, ease: EASE.out });
  }, [rows.length]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <ViewHeader
        kicker="خطوة قبل الأخيرة"
        title="سلة"
        accentWord="المشتريات"
        description={
          rows.length > 0
            ? `عندك ${count} منتج في السلة — راجع الكميات وكمّل بياناتك للإرسال عبر واتساب.`
            : undefined
        }
      />

      {rows.length === 0 ? (
        <Reveal dir="up" className="pb-28">
          <div className="mx-auto flex max-w-md flex-col items-center gap-5 rounded-[1.75rem] border border-hair bg-elevated px-8 py-16 text-center shadow-card">
            <div className="relative">
              <div className="absolute inset-0 orb-glow" aria-hidden />
              <ShoppingBag className="h-16 w-16 text-faint" strokeWidth={1.2} aria-hidden />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">السلة فاضية</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                لسه مفيش منتجات — ابدأ من المتجر أو شوف التجميعات الجاهزة،
                وترجع تلاقيها هنا مستنياك.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => navigate({ name: "store" })}
                className="glow-accent-sm inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95"
              >
                تصفّح المتجر
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate({ name: "builds" })}
                className="rounded-2xl border border-hair px-6 py-3.5 text-sm font-bold text-muted-foreground transition-colors hover:border-foreground/25 hover:bg-foreground/[0.04] hover:text-foreground"
              >
                تجميعات جاهزة
              </button>
            </div>
          </div>
        </Reveal>
      ) : (
        <div className="grid grid-cols-1 gap-8 pb-24 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
          {/* Items */}
          <div ref={listRef} className="space-y-4" role="list" aria-label="منتجات السلة">
            {rows.map((r) => (
              <article
                key={r.productId}
                data-cart-page-row
                role="listitem"
                className="group flex flex-col gap-4 rounded-3xl border border-hair bg-elevated p-4 shadow-card transition-colors hover:border-foreground/15 min-[480px]:flex-row min-[480px]:items-center sm:gap-6 sm:p-5"
              >
                <div className="flex items-center gap-3.5 min-[480px]:contents">
                  <button
                    onClick={() => navigate({ name: "product", slug: r.product.slug })}
                    className="relative h-24 w-24 shrink-0 aspect-square overflow-hidden rounded-2xl border border-hair bg-[#0d0f13] p-1.5 flex items-center justify-center sm:h-28 sm:w-28"
                    aria-label={`عرض ${r.product.name}`}
                  >
                    <img
                      src={r.product.images[0]}
                      alt={r.product.name}
                      className="h-full w-full object-contain img-grade transition-transform duration-500 group-hover:scale-105"
                    />
                  </button>

                  <div className="min-w-0 flex-1 min-[480px]:hidden">
                    <button
                      onClick={() => navigate({ name: "product", slug: r.product.slug })}
                      className="text-right font-display text-sm font-bold leading-6 transition-colors hover:text-primary line-clamp-2"
                    >
                      {r.product.name}
                    </button>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.product.brand} • {formatPrice(r.product.price)}
                    </p>
                  </div>
                </div>

                <div className="hidden min-w-0 flex-1 min-[480px]:block">
                  <button
                    onClick={() => navigate({ name: "product", slug: r.product.slug })}
                    className="text-right font-display text-base font-bold leading-7 transition-colors hover:text-primary"
                  >
                    {r.product.name}
                  </button>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {r.product.brand} • سعر الوحدة: {formatPrice(r.product.price)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-hair/60 pt-3 min-[480px]:border-t-0 min-[480px]:pt-0 sm:flex-col sm:items-end sm:justify-center sm:gap-3">
                  {/* Stepper */}
                  <div className="flex items-center rounded-full border border-hair bg-elevated">
                    <button
                      onClick={() => setQty(r.productId, r.qty - 1)}
                      className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-all hover:text-primary active:scale-90"
                      aria-label="تقليل الكمية"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center font-tech text-base font-bold tabular-nums">{r.qty}</span>
                    <button
                      onClick={() => setQty(r.productId, r.qty + 1)}
                      className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-all hover:text-primary active:scale-90"
                      aria-label="زيادة الكمية"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <span className="font-tech text-lg font-bold text-foreground" dir="rtl">
                    <AnimatedNumber value={r.product.price * r.qty} format={(n) => formatPriceCompact(n)} />
                    <span className="mr-1.5 text-xs font-medium text-muted-foreground">ج.م</span>
                  </span>

                  <button
                    onClick={() => {
                      remove(r.productId);
                      toast.info(`تم إزالة «${r.product.name}» من السلة`);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-faint transition-all hover:bg-danger/10 hover:text-danger sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={`إزالة ${r.product.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => navigate({ name: "store" })}
                className="group inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                متابعة التسوق
              </button>
              <button
                onClick={() => {
                  clear();
                  toast.info("تم تفريغ السلة");
                }}
                className="text-xs font-semibold text-faint transition-colors hover:text-danger"
              >
                تفريغ السلة بالكامل
              </button>
            </div>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Reveal dir="start">
              <div className="rounded-[1.75rem] border border-hair bg-elevated p-6 shadow-card sm:p-7">
                <h2 className="mb-5 font-display text-lg font-bold">ملخص الطلب</h2>

                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">عدد المنتجات</dt>
                    <dd className="font-tech font-bold tabular-nums">{count}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">الإجمالي الفرعي</dt>
                    <dd className="font-tech font-bold tabular-nums">{formatPrice(subtotal)}</dd>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <dt className="text-faint">الشحن والدفع</dt>
                    <dd className="text-faint">يُتفق عليه عبر واتساب</dd>
                  </div>
                </dl>

                <div className="my-5 hairline-x" />

                <div className="flex items-center justify-between">
                  <span className="font-display text-base font-bold">الإجمالي</span>
                  <span className="font-tech text-2xl font-bold text-primary" dir="rtl">
                    <AnimatedNumber value={subtotal} format={(n) => formatPriceCompact(n)} />
                    <span className="mr-1.5 text-sm font-medium text-muted-foreground">ج.م</span>
                  </span>
                </div>

                <button
                  onClick={() => navigate({ name: "checkout" })}
                  className="glow-accent-sm mt-6 flex min-h-[3.5rem] w-full items-center justify-center gap-2.5 rounded-2xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground shadow-md transition-transform hover:scale-[1.01] active:scale-[0.98]"
                >
                  <MessageCircle className="h-5 w-5" />
                  إتمام الطلب عبر واتساب
                </button>

                <p className="mt-4 text-center text-[0.7rem] leading-5 text-faint">
                  الموقع لا يعالج المدفوعات — الطلب يُرسل كرسالة واتساب منظمة،
                  والاتفاق النهائي مع فريق المتجر.
                </p>
              </div>
            </Reveal>
          </aside>
        </div>
      )}
    </div>
  );
}
