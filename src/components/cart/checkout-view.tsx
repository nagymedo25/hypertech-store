"use client";

/**
 * ============================================================
 * CHECKOUT VIEW — WhatsApp purchase journey (final step).
 * ============================================================
 * Customer details → preview of the prepared order message →
 * open the official WhatsApp chat. The order is ALSO recorded
 * in the mock DB (demo admin). Honest states throughout:
 * opening WhatsApp ≠ submitted/confirmed order.
 * ============================================================
 */

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageCircle, ChevronLeft, User, Phone, FileCheck2, PencilLine, ShieldCheck } from "lucide-react";
import { ViewHeader } from "@/components/layout/view-header";
import { Reveal } from "@/components/motion/reveal";
import { AnimatedNumber } from "@/components/motion/micro-interactions";
import { useCartStore } from "@/lib/store/cart-store";
import { useMockDB } from "@/lib/store/db-store";
import { useRouterStore } from "@/lib/router";
import { repositories } from "@/lib/repositories";
import { buildOrderMessage, orderWhatsAppUrl } from "@/lib/whatsapp";
import { formatPrice, formatPriceCompact } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const checkoutSchema = z.object({
  name: z.string().trim().min(3, "اكتب اسمك بالكامل (٣ أحرف على الأقل)"),
  phone: z
    .string()
    .trim()
    .regex(/^01[0-9]{9}$/, "اكتب رقم موبايل مصري صحيح (١١ رقم يبدأ بـ 01)"),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutView() {
  const items = useCartStore((s) => s.items);
  const products = useMockDB((s) => s.products);
  const navigate = useRouterStore((s) => s.navigate);
  const [preview, setPreview] = useState<CheckoutForm | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const rows = useMemo(
    () =>
      items
        .map((i) => ({ ...i, product: products.find((p) => p.id === i.productId) }))
        .filter((r): r is typeof r & { product: NonNullable<typeof r.product> } => !!r.product),
    [items, products]
  );

  const subtotal = rows.reduce((acc, r) => acc + r.product.price * r.qty, 0);
  const count = rows.reduce((acc, r) => acc + r.qty, 0);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    mode: "onChange",
    defaultValues: { name: "", phone: "", notes: "" },
  });

  /* Empty cart → friendly redirect */
  if (rows.length === 0 && !sent) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <ViewHeader kicker="إتمام الطلب" title="مفيش حاجة" accentWord="للإرسال" />
        <Reveal dir="up" className="pb-28">
          <div className="mx-auto flex max-w-md flex-col items-center gap-5 rounded-[1.75rem] border border-hair bg-elevated px-8 py-14 text-center shadow-card">
            <MessageCircle className="h-12 w-12 text-faint" strokeWidth={1.4} aria-hidden />
            <p className="text-sm leading-7 text-muted-foreground">
              السلة فاضية — ضيف منتجات الأول وبعدين ارجع هنا لإتمام الطلب.
            </p>
            <button
              onClick={() => navigate({ name: "store" })}
              className="rounded-2xl bg-primary px-6 py-3.5 font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95"
            >
              ابدأ التسوق
            </button>
          </div>
        </Reveal>
      </div>
    );
  }

  const onSubmit = (data: CheckoutForm) => {
    setPreview(data);
    setSent(false);
  };

  const handleSend = async () => {
    if (!preview) return;
    setSending(true);
    try {
      /* Server-side submission: the API re-reads every product from the
         production database, re-checks availability and computes the total
         from LIVE prices — the browser cart is never trusted. */
      const order = await repositories.orders.submit({
        customerName: preview.name,
        customerPhone: preview.phone,
        notes: preview.notes || undefined,
        items: rows.map((r) => ({ productId: r.product.id, qty: r.qty })),
      });

      // Open WhatsApp with the organized order message
      window.open(
        orderWhatsAppUrl({
          items: rows,
          subtotal,
          customer: { name: preview.name, phone: preview.phone, notes: preview.notes || undefined },
        }),
        "_blank",
        "noopener,noreferrer"
      );
      setSent(true);
      toast.success("تم تسجيل طلبك في النظام", {
        description: `رقم الطلب ${order.ref} — أكمل الإرسال من واتساب وسنتواصل معك.`,
      });
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "تعذر تسجيل الطلب — حاول تاني أو كلمنا مباشرة.";
      toast.error("تعذر إتمام الطلب", { description: message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <ViewHeader
        kicker="الخطوة الأخيرة"
        title="بيانات"
        accentWord="الطلب"
        description="اسمك ورقمك حتى نقدر نرد عليك — وبعدها رسالة واتساب جاهزة بكل التفاصيل."
      />

      {/* grid-cols-1 = minmax(0,1fr): a bare implicit grid track is
          max-content sized — the order-summary's nowrap truncate row
          blew it past the viewport on phones */}
      <div className="grid grid-cols-1 gap-8 pb-24 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
        {/* Form */}
        <Reveal dir="up">
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="rounded-[1.75rem] border border-hair bg-elevated p-6 shadow-card sm:p-8"
            aria-label="بيانات العميل"
          >
            <h2 className="mb-6 font-display text-lg font-bold">بياناتك للتواصل</h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  الاسم <span className="text-danger">*</span>
                </span>
                <input
                  {...register("name")}
                  type="text"
                  placeholder="مثال: أحمد محمود"
                  autoComplete="name"
                  className={inputCls(!!errors.name)}
                />
                {errors.name && (
                  <span className="mt-2 flex items-center gap-1.5 text-xs text-danger" role="alert">
                    <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                    {errors.name.message}
                  </span>
                )}
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  رقم الموبايل (واتساب) <span className="text-danger">*</span>
                </span>
                <input
                  {...register("phone")}
                  type="tel"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder="01xxxxxxxxx"
                  autoComplete="tel"
                  className={cn(inputCls(!!errors.phone), "text-left font-tech")}
                />
                {errors.phone && (
                  <span className="mt-2 flex items-center gap-1.5 text-xs text-danger" role="alert">
                    <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                    {errors.phone.message}
                  </span>
                )}
              </label>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-xs font-bold text-muted-foreground">
                ملاحظات على الطلب (اختياري)
              </span>
              <textarea
                {...register("notes")}
                rows={3}
                placeholder="مثال: أفضل التسليم يوم الخميس، أو عندي استفسار عن التوصيل…"
                className={cn(inputCls(false), "min-h-24 resize-y")}
              />
            </label>

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-hair bg-raised p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-mint" aria-hidden />
              <p className="text-xs leading-6 text-muted-foreground">
                بياناتك تُستخدم للتواصل بخصوص طلبك هذا فقط — ولا تُرسل إلا داخل رسالة الواتساب.
                مفيش حسابات ولا تسجيل في الموقع.
              </p>
            </div>

            <button
              type="submit"
              disabled={!isValid}
              className={cn(
                "mt-7 flex min-h-[3.5rem] w-full items-center justify-center gap-2.5 rounded-2xl px-6 py-4 text-base font-bold shadow-md transition-all",
                isValid
                  ? "glow-accent-sm bg-primary text-primary-foreground hover:scale-[1.01] active:scale-[0.98]"
                  : "cursor-not-allowed border border-hair bg-raised text-faint"
              )}
            >
              <FileCheck2 className="h-5 w-5" />
              معاينة رسالة الطلب
            </button>
          </form>
        </Reveal>

        {/* Order summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Reveal dir="start">
            <div className="rounded-[1.75rem] border border-hair bg-elevated p-6 shadow-card sm:p-7">
              <h2 className="mb-5 font-display text-lg font-bold">طلبك ({count} منتج)</h2>

              <ul className="max-h-72 space-y-3.5 overflow-y-auto pl-1" aria-label="عناصر الطلب">
                {rows.map((r) => (
                  <li key={r.productId} className="flex items-center gap-3">
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-hair bg-[#0d0f13]">
                      { }
                      <img src={r.product.images[0]} alt="" className="h-full w-full object-cover img-grade" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold">{r.product.name}</span>
                      <span className="text-[0.68rem] text-faint">
                        {r.qty} × {formatPriceCompact(r.product.price)}
                      </span>
                    </span>
                    <span className="font-tech text-sm font-bold tabular-nums" dir="rtl">
                      {formatPriceCompact(r.product.price * r.qty)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="my-5 hairline-x" />

              <div className="flex items-center justify-between">
                <span className="font-display text-base font-bold">الإجمالي</span>
                <span className="font-tech text-2xl font-bold text-primary" dir="rtl">
                  <AnimatedNumber value={subtotal} format={(n) => formatPriceCompact(n)} />
                  <span className="mr-1.5 text-sm font-medium text-muted-foreground">ج.م</span>
                </span>
              </div>
              <p className="mt-3 text-[0.7rem] leading-5 text-faint">
                الشحن وطريقة الدفع يُتفق عليهما في محادثة الواتساب.
              </p>
            </div>
          </Reveal>
        </aside>
      </div>

      {/* ---------------- Order preview modal ---------------- */}
      {preview && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="معاينة رسالة الطلب"
        >
          <button className="absolute inset-0 bg-[#24221d]/45 backdrop-blur-sm" onClick={() => setPreview(null)} aria-label="إغلاق" />
          <div className="relative max-h-[88svh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] border border-hair bg-surface p-6 sm:p-8">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                <MessageCircle className="h-5 w-5 text-[#1fae53]" />
                رسالة طلبك جاهزة
              </h3>
              <button
                onClick={() => setPreview(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-hair text-muted-foreground transition-colors hover:bg-foreground/[0.05]"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl border border-hair bg-[#0b141a] p-4">
              <div className="rounded-xl rounded-tl-sm bg-[#1f2c34] p-4 text-[0.82rem] leading-7 text-[#e9edef] whitespace-pre-line" dir="rtl">
                {buildOrderMessage({
                  items: rows,
                  subtotal,
                  customer: { name: preview.name, phone: preview.phone, notes: preview.notes || undefined },
                })}
              </div>
            </div>

            {sent ? (
              <div className="mt-6 rounded-2xl border border-mint/30 bg-mint/10 p-4 text-sm leading-7">
                <p className="font-bold text-mint">تم فتح واتساب ✓</p>
                <p className="mt-1 text-muted-foreground">
                  أكمل الإرسال من هناك. وللأمانة: فتح المحادثة ليس تأكيدًا للطلب —
                  الطلب يتأكد لما يرد عليك فريق المتجر.
                </p>
                <button
                  onClick={() => navigate({ name: "home" })}
                  className="mt-3 text-xs font-bold text-primary transition-colors hover:text-foreground"
                >
                  الرجوع للرئيسية ←
                </button>
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex min-h-[3.25rem] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1fae53] px-6 py-3.5 text-base font-bold text-white shadow-md transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60"
                >
                  {sending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
                      جارٍ التجهيز…
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-5 w-5" />
                      افتح واتساب وأرسل
                    </>
                  )}
                </button>
                <button
                  onClick={() => setPreview(null)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-hair px-5 py-3.5 text-sm font-bold text-muted-foreground transition-colors hover:border-foreground/25 hover:bg-foreground/[0.04] hover:text-foreground"
                >
                  <PencilLine className="h-4 w-4" />
                  تعديل البيانات
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    "w-full rounded-xl border bg-raised px-4 py-3 text-sm text-foreground placeholder:text-faint transition-all",
    "focus:border-primary/60 focus:bg-elevated focus:outline-none focus:ring-2 focus:ring-primary/25",
    hasError ? "border-danger/60" : "border-hair"
  );
}
