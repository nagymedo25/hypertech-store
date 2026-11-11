"use client";

/**
 * CartDrawer — animated side cart (vaul drawer, RTL-aware).
 * Items animate in/out with GSAP FLIP-like transitions,
 * quantity steppers have tactile feedback, totals roll.
 * Honest copy: "إتمام الطلب عبر واتساب" — no fake payment.
 */

import { useEffect, useMemo, useRef } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, MessageCircle } from "lucide-react";
import { gsap } from "gsap";
import { useCartStore } from "@/lib/store/cart-store";
import { useUIStore } from "@/lib/store/ui-store";
import { useMockDB } from "@/lib/store/db-store";
import { useRouterStore } from "@/lib/router";
import { formatPrice } from "@/lib/format";
import { AnimatedNumber } from "@/components/motion/micro-interactions";
import { EASE, DUR } from "@/lib/motion";
import { productWhatsAppUrl } from "@/lib/whatsapp";

export function CartDrawer() {
  const open = useUIStore((s) => s.cartOpen);
  const setOpen = useUIStore((s) => s.setCartOpen);
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const markCartViewed = useCartStore((s) => s.markCartViewed);
  const products = useMockDB((s) => s.products);
  const navigate = useRouterStore((s) => s.navigate);

  useEffect(() => {
    if (open) markCartViewed();
  }, [open, markCartViewed]);

  const rows = useMemo(
    () =>
      items
        .map((i) => ({ ...i, product: products.find((p) => p.id === i.productId) }))
        .filter((r): r is typeof r & { product: NonNullable<typeof r.product> } => !!r.product),
    [items, products]
  );

  const subtotal = rows.reduce((acc, r) => acc + r.product.price * r.qty, 0);

  /* Animate rows on mount of the list */
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || !listRef.current) return;
    const kids = listRef.current.querySelectorAll("[data-cart-row]");
    gsap.fromTo(
      kids,
      { x: -32, opacity: 0 },
      { x: 0, opacity: 1, duration: DUR.base, stagger: 0.05, ease: EASE.out }
    );
  }, [open, rows.length]);

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerContent
        dir="rtl"
        className="!right-0 !left-auto !top-0 !bottom-0 !h-full !max-h-full !w-[92vw] !max-w-md !translate-x-0 !rounded-none !border-l !border-hair bg-surface"
      >
        <DrawerHeader className="border-b border-hair pb-4">
          <DrawerTitle className="flex items-center gap-2.5 font-display text-lg">
            <ShoppingBag className="h-5 w-5 text-primary" />
            سلة المشتريات
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 font-tech text-xs font-bold text-primary">
              {rows.length}
            </span>
          </DrawerTitle>
        </DrawerHeader>

        {rows.length === 0 ? (
          <EmptyCart onClose={() => setOpen(false)} />
        ) : (
          <>
            <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4" role="list" aria-label="منتجات السلة">
              {rows.map((r) => (
                <div
                  key={r.productId}
                  data-cart-row
                  role="listitem"
                  className="group relative flex gap-3.5 border-b border-hair py-4 last:border-0"
                >
                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate({ name: "product", slug: r.product.slug });
                    }}
                    className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 aspect-square overflow-hidden rounded-xl border border-hair bg-[#0d0f13] p-1.5 flex items-center justify-center"
                    aria-label={`عرض ${r.product.name}`}
                  >
                    <img
                      src={r.product.images[0]}
                      alt={r.product.name}
                      className="h-full w-full object-contain img-grade transition-transform duration-500 group-hover:scale-105"
                    />
                  </button>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <button
                      onClick={() => {
                        setOpen(false);
                        navigate({ name: "product", slug: r.product.slug });
                      }}
                      className="truncate text-right text-sm font-bold leading-6 transition-colors hover:text-primary"
                    >
                      {r.product.name}
                    </button>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {r.product.brand}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      {/* Quantity stepper */}
                      <div className="flex items-center rounded-full border border-hair bg-elevated">
                        <QtyButton onClick={() => setQty(r.productId, r.qty - 1)} label="تقليل الكمية">
                          <Minus className="h-3.5 w-3.5" />
                        </QtyButton>
                        <span className="w-8 text-center font-tech text-sm font-bold tabular-nums">
                          {r.qty}
                        </span>
                        <QtyButton onClick={() => setQty(r.productId, r.qty + 1)} label="زيادة الكمية">
                          <Plus className="h-3.5 w-3.5" />
                        </QtyButton>
                      </div>

                      <span className="font-tech text-sm font-bold text-foreground">
                        <AnimatedNumber value={r.product.price * r.qty} format={(n) => formatPrice(n)} className="tabular-nums" />
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => remove(r.productId)}
                    className="absolute left-0 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-faint opacity-0 transition-all hover:bg-danger/10 hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                    aria-label={`إزالة ${r.product.name} من السلة`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t border-hair bg-elevated/60 px-5 py-5">
              <div className="mb-1.5 flex items-center justify-between text-sm text-muted-foreground">
                <span>عدد المنتجات</span>
                <span className="font-tech tabular-nums">{rows.reduce((a, r) => a + r.qty, 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-display text-base font-bold">الإجمالي</span>
                <span className="font-tech text-xl font-bold text-primary">
                  <AnimatedNumber value={subtotal} format={(n) => formatPrice(n)} />
                </span>
              </div>

              <button
                onClick={() => {
                  setOpen(false);
                  navigate({ name: "checkout" });
                }}
                className="glow-accent-sm mt-4 flex min-h-[3.25rem] w-full items-center justify-center gap-2.5 rounded-2xl bg-primary px-5 py-4 text-base font-bold text-primary-foreground shadow-md transition-transform hover:scale-[1.01] active:scale-[0.98]"
              >
                <MessageCircle className="h-5 w-5" />
                إتمام الطلب عبر واتساب
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  navigate({ name: "store" });
                }}
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl border border-hair px-5 py-3 text-sm text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
              >
                متابعة التسوق
                <ArrowLeft className="h-4 w-4" />
              </button>
              <p className="mt-3 text-center text-[0.7rem] leading-5 text-faint">
                لا تتم أي عملية دفع من خلال الموقع — يتم الاتفاق والتسليم مباشرة مع المتجر.
              </p>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

function QtyButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-all hover:text-primary active:scale-90"
      aria-label={label}
    >
      {children}
    </button>
  );
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  const navigate = useRouterStore((s) => s.navigate);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 py-16 text-center">
      <div className="relative">
        <div className="absolute inset-0 orb-glow" aria-hidden />
        <ShoppingBag className="h-16 w-16 text-faint" strokeWidth={1.2} aria-hidden />
      </div>
      <div>
        <h3 className="font-display text-xl font-bold">سلتك فاضية</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          لسه مفيش منتجات في السلة — ابدأ رحلتك واختار جهازك أو اكسسوارك المفضل.
        </p>
      </div>
      <button
        onClick={() => {
          onClose();
          navigate({ name: "store" });
        }}
        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95"
      >
        تصفّح المتجر
        <ArrowLeft className="h-4 w-4" />
      </button>
    </div>
  );
}
