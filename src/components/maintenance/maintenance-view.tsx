"use client";

/**
 * ============================================================
 * MAINTENANCE VIEW — the standalone service experience · Light
 * ============================================================
 * No accounts. Three honest steps: describe the problem →
 * preview the generated Arabic WhatsApp message → open the
 * official chat. The request is ALSO recorded in the mock DB
 * (visible in the demo admin panel — clearly labeled).
 * We never claim the request is "officially registered".
 * ============================================================
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Wrench,
  MessageCircle,
  Smartphone,
  Laptop,
  Monitor,
  HelpCircle,
  ChevronLeft,
  FileCheck2,
  PencilLine,
} from "lucide-react";
import { ViewHeader } from "@/components/layout/view-header";
import { Reveal } from "@/components/motion/reveal";
import { repositories } from "@/lib/repositories";
import { maintenanceWhatsAppUrl, buildMaintenanceMessage } from "@/lib/whatsapp";
import { DEVICE_TYPE_META, PROBLEM_CATEGORY_META } from "@/lib/format";
import { IMG } from "@/lib/data/images";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ------------------------------ Schema ------------------------------ */

const maintenanceSchema = z.object({
  customerName: z.string().trim().min(3, "اكتب اسمك بالكامل (٣ أحرف على الأقل)"),
  customerPhone: z
    .string()
    .trim()
    .regex(/^01[0-9]{9}$/, "اكتب رقم موبايل مصري صحيح (١١ رقم يبدأ بـ 01)"),
  deviceType: z.enum(["laptop", "desktop", "phone", "other"], {
    message: "اختر نوع الجهاز",
  }),
  deviceBrand: z.string().trim().max(40).optional().or(z.literal("")),
  deviceModel: z.string().trim().max(60).optional().or(z.literal("")),
  problemCategory: z.enum(["hardware", "software", "performance", "os", "display", "other"], {
    message: "اختر تصنيف المشكلة",
  }),
  problemDescription: z
    .string()
    .trim()
    .min(20, "صِف المشكلة بتفصيل أكبر (٢٠ حرف على الأقل) — كل تفصيلة بتوفر وقت الفحص"),
  additionalNotes: z.string().trim().max(500).optional().or(z.literal("")),
});

type MaintenanceForm = z.infer<typeof maintenanceSchema>;

const DEVICE_ICONS = { laptop: Laptop, desktop: Monitor, phone: Smartphone, other: HelpCircle } as const;

/* ------------------------------ View ------------------------------ */

export default function MaintenanceView() {
  const [preview, setPreview] = useState<MaintenanceForm | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<MaintenanceForm>({
    resolver: zodResolver(maintenanceSchema),
    mode: "onChange",
    defaultValues: {
      customerName: "",
      customerPhone: "",
      deviceType: "laptop",
      deviceBrand: "",
      deviceModel: "",
      problemCategory: "hardware",
      problemDescription: "",
      additionalNotes: "",
    },
  });

  const deviceType = watch("deviceType");
  const DeviceIcon = DEVICE_ICONS[deviceType] ?? HelpCircle;

  const onSubmit = (data: MaintenanceForm) => {
    setPreview(data);
    setSent(false);
  };

  const handleSend = async () => {
    if (!preview) return;
    setSending(true);
    try {
      // Record in the demo mock DB (appears in the admin panel)
      await repositories.maintenance.create({
        customerName: preview.customerName,
        customerPhone: preview.customerPhone,
        deviceType: preview.deviceType,
        deviceBrand: preview.deviceBrand || undefined,
        deviceModel: preview.deviceModel || undefined,
        problemCategory: preview.problemCategory,
        problemDescription: preview.problemDescription,
        additionalNotes: preview.additionalNotes || undefined,
      });
      // Open the official WhatsApp chat with the prepared message
      window.open(maintenanceWhatsAppUrl(preview), "_blank", "noopener,noreferrer");
      setSent(true);
      toast.success("تم فتح محادثة واتساب", {
        description: "أكمل الإرسال من واتساب — وطلبك ظهر في لوحة التحكم التجريبية.",
      });
    } catch {
      toast.error("حصل خطأ غير متوقع", { description: "جرّب تاني أو كلمنا مباشرة على واتساب." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative">
      {/* Atmosphere */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[460px] overflow-hidden">
        { }
        <img src={IMG.maintenanceScene} alt="" className="h-full w-full object-cover img-grade opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <ViewHeader
          kicker="خدمة الصيانة"
          title="وصّف لنا"
          accentWord="المشكلة"
          description="من غير حساب ولا تعقيد — املأ التفاصيل وابعت طلب الصيانة على واتساب في رسالة مرتبة وجاهزة."
          accent="#1a5ca6"
        />

        <div className="grid grid-cols-1 gap-8 pb-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
          {/* ------------------------- Form ------------------------- */}
          <Reveal dir="up">
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="rounded-[1.75rem] border border-hair bg-elevated p-6 shadow-card sm:p-8"
              aria-label="نموذج طلب الصيانة"
            >
              {/* Customer */}
              <fieldset className="mb-8">
                <legend className="mb-4 flex items-center gap-2 font-display text-base font-bold">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-xs font-tech font-bold text-primary">1</span>
                  بياناتك
                </legend>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="الاسم" required error={errors.customerName?.message}>
                    <input
                      {...register("customerName")}
                      type="text"
                      placeholder="مثال: أحمد محمود"
                      className={inputCls(!!errors.customerName)}
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="رقم الموبايل (واتساب)" required error={errors.customerPhone?.message}>
                    <input
                      {...register("customerPhone")}
                      type="tel"
                      inputMode="numeric"
                      dir="ltr"
                      placeholder="01xxxxxxxxx"
                      className={cn(inputCls(!!errors.customerPhone), "text-left font-tech")}
                      autoComplete="tel"
                    />
                  </Field>
                </div>
              </fieldset>

              {/* Device */}
              <fieldset className="mb-8">
                <legend className="mb-4 flex items-center gap-2 font-display text-base font-bold">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-xs font-tech font-bold text-primary">2</span>
                  بيانات الجهاز
                </legend>

                {/* Device type — visual selector */}
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-muted-foreground">
                    نوع الجهاز <span className="text-danger">*</span>
                  </p>
                  {errors.deviceType && <p className="text-xs text-danger">{errors.deviceType.message}</p>}
                </div>
                <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="نوع الجهاز">
                  {(Object.keys(DEVICE_TYPE_META) as Array<keyof typeof DEVICE_TYPE_META>).map((dt) => {
                    const Icon = DEVICE_ICONS[dt];
                    const active = deviceType === dt;
                    return (
                      <label
                        key={dt}
                        className={cn(
                          "group flex cursor-pointer flex-col items-center gap-2.5 rounded-2xl border p-4 transition-all",
                          active
                            ? "border-primary/60 bg-primary/[0.08] shadow-[0_6px_18px_-8px_rgba(26,92,166,0.45)]"
                            : "border-hair bg-surface hover:border-foreground/20"
                        )}
                      >
                        <input {...register("deviceType")} type="radio" value={dt} className="sr-only" />
                        <Icon className={cn("h-6 w-6 transition-colors", active ? "text-primary" : "text-faint group-hover:text-muted-foreground")} aria-hidden />
                        <span className={cn("text-xs font-bold", active ? "text-primary" : "text-muted-foreground")}>
                          {DEVICE_TYPE_META[dt]}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="الماركة (اختياري)" error={errors.deviceBrand?.message}>
                    <input
                      {...register("deviceBrand")}
                      type="text"
                      placeholder="مثال: Dell / Lenovo / Samsung"
                      className={inputCls(!!errors.deviceBrand)}
                    />
                  </Field>
                  <Field label="الموديل (اختياري)" error={errors.deviceModel?.message}>
                    <input
                      {...register("deviceModel")}
                      type="text"
                      placeholder="مثال: Inspiron 5570"
                      className={inputCls(!!errors.deviceModel)}
                    />
                  </Field>
                </div>
              </fieldset>

              {/* Problem */}
              <fieldset className="mb-8">
                <legend className="mb-4 flex items-center gap-2 font-display text-base font-bold">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-xs font-tech font-bold text-primary">3</span>
                  تفاصيل المشكلة
                </legend>

                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-muted-foreground">
                    تصنيف المشكلة <span className="text-danger">*</span>
                  </p>
                  {errors.problemCategory && <p className="text-xs text-danger">{errors.problemCategory.message}</p>}
                </div>
                <div className="mb-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {(Object.keys(PROBLEM_CATEGORY_META) as Array<keyof typeof PROBLEM_CATEGORY_META>).map((pc) => {
                    const active = watch("problemCategory") === pc;
                    return (
                      <label
                        key={pc}
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-3 text-right text-xs transition-all",
                          active
                            ? "border-primary/60 bg-primary/[0.08] text-primary"
                            : "border-hair bg-surface text-muted-foreground hover:border-foreground/20"
                        )}
                      >
                        <input {...register("problemCategory")} type="radio" value={pc} className="sr-only" />
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full transition-colors",
                            active ? "bg-primary" : "bg-faint"
                          )}
                          aria-hidden
                        />
                        {PROBLEM_CATEGORY_META[pc]}
                      </label>
                    );
                  })}
                </div>

                <Field label="وصف المشكلة" required error={errors.problemDescription?.message}>
                  <textarea
                    {...register("problemDescription")}
                    rows={4}
                    placeholder="اكتب اللي بيحصل بالتفصيل: متى بدأت؟ هل ظهرت بعد حدث معين؟ هل بتكرر؟…"
                    className={cn(inputCls(!!errors.problemDescription), "min-h-28 resize-y")}
                  />
                  <p className="mt-1.5 text-[0.68rem] text-faint">
                    كل تفصيلة بتساعد الفحص تتم أسرع وأدق.
                  </p>
                </Field>

                <Field label="ملاحظات إضافية (اختياري)" error={errors.additionalNotes?.message}>
                  <textarea
                    {...register("additionalNotes")}
                    rows={2}
                    placeholder="أي حاجة تانية تحب تضيفها — كلمة سر الجهاز، نسخ احتياطي، ميعاد يناسبك…"
                    className={cn(inputCls(!!errors.additionalNotes), "min-h-20 resize-y")}
                  />
                </Field>
              </fieldset>

              <button
                type="submit"
                disabled={!isValid}
                className={cn(
                  "flex w-full items-center justify-center gap-2.5 rounded-2xl px-6 py-4 font-bold transition-all",
                  isValid
                    ? "glow-accent-sm bg-primary text-primary-foreground hover:scale-[1.01] active:scale-[0.98]"
                    : "cursor-not-allowed bg-elevated text-faint"
                )}
              >
                <FileCheck2 className="h-5 w-5" />
                معاينة رسالة الصيانة
              </button>
              <p className="mt-3 text-center text-[0.7rem] text-faint">
                هتشوف الرسالة كاملة قبل الإرسال — ولا يُرسل أي شيء من غير موافقتك.
              </p>
            </form>
          </Reveal>

          {/* ------------------------- Side panel ------------------------- */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Reveal dir="start" delay={0.1}>
              <div className="rounded-[1.75rem] border border-hair bg-elevated p-6 shadow-card sm:p-7">
                <h3 className="mb-5 flex items-center gap-2 font-display text-base font-bold">
                  <Wrench className="h-5 w-5 text-primary" />
                  إزاي بنشتغل؟
                </h3>
                <ol className="space-y-5">
                  {[
                    { t: "وصف + إرسال", d: "النموذج بيجهز رسالة واتساب منظمة بكل التفاصيل." },
                    { t: "فحص وتشخيص", d: "فريقنا يراجع الوصف ويتواصل معاك للاتفاق على الفحص." },
                    { t: "إصلاح وتسليم", d: "بنبلغك بكل خطوة و التكلفة قبل أي إصلاح." },
                  ].map((s, i) => (
                    <li key={s.t} className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/[0.07] font-tech text-sm font-bold text-primary">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold">{s.t}</p>
                        <p className="mt-1 text-xs leading-6 text-muted-foreground">{s.d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>

            <Reveal dir="start" delay={0.2}>
              <div className="rounded-[1.75rem] border border-primary/25 bg-primary/[0.05] p-6 sm:p-7">
                <h3 className="mb-2 font-display text-base font-bold">مستعجل؟</h3>
                <p className="mb-5 text-xs leading-6 text-muted-foreground">
                  كلمنا على طول على واتساب ووصّف المشكلة صوت أو كتابة.
                </p>
                <a
                  href={maintenanceWhatsAppUrl({
                    customerName: "",
                    customerPhone: "",
                    deviceType: "laptop",
                    problemCategory: "other",
                    problemDescription: "عايز أستفسر عن الصيانة",
                  }).replace("الاسم: \n", "الاسم: —\n")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#1fae53] px-5 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-95"
                >
                  <MessageCircle className="h-4.5 w-4.5" />
                  تواصل مباشر
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* ------------------------- Preview modal ------------------------- */}
      {preview && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="معاينة رسالة الصيانة"
        >
          <button className="absolute inset-0 bg-[#24221d]/45 backdrop-blur-sm" onClick={() => setPreview(null)} aria-label="إغلاق" />
          <div className="relative max-h-[88svh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] border border-hair bg-surface p-6 sm:p-8">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                <MessageCircle className="h-5 w-5 text-[#1fae53]" />
                رسالتك جاهزة
              </h3>
              <button
                onClick={() => setPreview(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-hair text-muted-foreground transition-colors hover:bg-foreground/[0.05]"
                aria-label="إغلاق المعاينة"
              >
                ✕
              </button>
            </div>

            {/* WhatsApp-style bubble */}
            <div className="rounded-2xl border border-hair bg-[#0b141a] p-4">
              <div className="rounded-xl rounded-tl-sm bg-[#1f2c34] p-4 text-[0.82rem] leading-7 text-[#e9edef] whitespace-pre-line" dir="rtl">
                {buildMaintenanceMessage(preview)}
              </div>
              <p className="mt-2 text-left text-[0.65rem] text-white/30" dir="ltr">
                Hyper Tech · WhatsApp preview
              </p>
            </div>

            {sent ? (
              <div className="mt-6 rounded-2xl border border-mint/30 bg-mint/10 p-4 text-sm leading-7">
                <p className="font-bold text-mint">تم فتح واتساب ✓</p>
                <p className="mt-1 text-muted-foreground">
                  أكمل الإرسال من هناك. ملحوظة صريحة: فتح المحادثة ليس تأكيدًا لاستلام الطلب —
                  هيتأكد لما يرد عليك فريق المتجر.
                </p>
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1fae53] px-5 py-3.5 font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60"
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
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-hair px-5 py-3.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-foreground/[0.04]"
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

/* ------------------------------ helpers ------------------------------ */

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
        {label}
        {required && <span className="text-danger">*</span>}
      </span>
      {children}
      {error && (
        <span className="mt-2 flex items-center gap-1.5 text-xs text-danger" role="alert">
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          {error}
        </span>
      )}
    </label>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    "w-full rounded-xl border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-faint transition-all",
    "focus:border-primary/60 focus:bg-elevated focus:outline-none focus:ring-2 focus:ring-primary/25",
    hasError ? "border-danger/60" : "border-hair"
  );
}
