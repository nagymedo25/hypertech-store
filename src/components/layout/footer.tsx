"use client";

/**
 * Footer — compact premium closing (Luxury Light).
 * • Short closing statement + primary CTA
 * • Dynamic categories (from the store — nothing hardcoded)
 * • Verified contact channels (WhatsApp / Facebook / TikTok)
 * • Policy drafts open in accessible dialogs
 * • Quiet ghost wordmark as a decorative layer
 */

import { useState } from "react";
import { ArrowLeft, MapPin, MessageCircle, ShieldCheck, FileText, BadgeCheck } from "lucide-react";
import { BUSINESS } from "@/lib/config";
import { useRouterStore } from "@/lib/router";
import { useMockDB } from "@/lib/store/db-store";
import { Reveal } from "@/components/motion/reveal";
import { Magnetic } from "@/components/motion/micro-interactions";
import { whatsappUrl } from "@/lib/config";
import { WhatsAppIcon, TikTokIcon, FacebookIcon } from "@/components/layout/brand-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function Footer() {
  const navigate = useRouterStore((s) => s.navigate);
  const categories = useMockDB((s) => s.categories);
  const settings = useMockDB((s) => s.settings);
  const [policy, setPolicy] = useState<null | "privacy" | "exchange" | "terms">(null);

  const visibleCategories = [...categories]
    .sort((a, b) => a.order - b.order)
    .filter((c) => c.active !== false)
    .filter((c) => c.slug !== "builds" || settings.showBuildsCategory !== false);

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-hair bg-surface" id="site-footer">
      {/* Ghost wordmark */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-9 left-0 select-none whitespace-nowrap font-tech text-[16vw] font-bold leading-none tracking-tighter text-foreground/[0.025]"
        style={{ transform: "skewX(-8deg)" }}
      >
        HYPER TECH
      </div>
      <div aria-hidden className="pointer-events-none absolute -top-28 right-[-6rem] h-64 w-64 orb-glow opacity-60" />

      {/* Safe-area aware bottom padding — the closing bar never
          rides under the iOS home indicator */}
      <div className="relative mx-auto max-w-7xl px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-14 sm:px-6 sm:pt-16">
        {/* ---- Closing statement ---- */}
        <Reveal dir="up" className="mb-12">
          <div className="flex flex-col items-start gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                <span className="inline-block h-px w-8 bg-primary" />
                البداية من هنا
              </p>
              <h2 className="font-display text-3xl font-bold leading-[1.15] sm:text-4xl lg:text-5xl">
                جاهز <span className="text-electric">ترفع مستواك</span>؟
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground sm:leading-8">
                فريق هايبر تك جاهز يساعدك تختار جهازك أو تجمعتك المناسبة،
                ويجاوب على أي سؤال تقني — كلمنا واتساب أو زورنا في المنصورة.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Magnetic strength={0.25}>
                <a
                  href={whatsappUrl("السلام عليكم، عايز أستفسر عن منتجاتكم 👋")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glow-accent-sm inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 font-bold text-primary-foreground transition-transform hover:scale-[1.03] active:scale-[0.97]"
                >
                  <MessageCircle className="h-5 w-5" />
                  كلّمنا واتساب
                </a>
              </Magnetic>
              <button
                onClick={() => navigate({ name: "store" })}
                className="group inline-flex items-center gap-2 rounded-2xl border border-foreground/12 bg-elevated px-6 py-3.5 font-bold transition-colors hover:border-primary/40 hover:bg-primary/[0.06]"
              >
                تصفّح المتجر
                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              </button>
            </div>
          </div>
        </Reveal>

        <div className="hairline-x mb-10" />

        {/* ---- Columns ---- */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.storeName || "هايبر تك"}
                  className="h-11 max-h-11 w-auto max-w-[150px] object-contain"
                />
              ) : (
                <>
                  <span className="relative flex h-11 w-11 items-center justify-center">
                    <svg viewBox="0 0 44 44" className="absolute inset-0 h-full w-full text-primary" aria-hidden>
                      <ellipse cx="22" cy="22" rx="19" ry="7.5" fill="none" stroke="currentColor" strokeWidth="1.8" transform="rotate(-16 22 22)" />
                    </svg>
                    <span className="font-tech text-2xl font-bold text-silver" style={{ transform: "skewX(-8deg)" }}>H</span>
                  </span>
                  <div className="leading-none">
                    <p className="font-tech text-xl font-bold" style={{ transform: "skewX(-8deg)" }}>
                      <span className="text-silver">HYPER</span> <span className="text-electric">TECH</span>
                    </p>
                    <p className="mt-1.5 font-display text-sm font-light text-muted-foreground">{settings.tagline || BUSINESS.taglineArabic}</p>
                  </div>
                </>
              )}
            </div>
            <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
              {settings.businessDescription || BUSINESS.description}
            </p>
            <div className="mt-5 flex items-center gap-2.5" aria-label="قنوات التواصل">
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-hair bg-elevated text-[#1fae53] transition-all hover:-translate-y-0.5 hover:border-[#1fae53]/40 hover:bg-[#1fae53]/10"
                aria-label="واتساب هايبر تك"
              >
                <WhatsAppIcon className="h-5 w-5" />
              </a>
              <a
                href={settings.facebookUrl || BUSINESS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-hair bg-elevated text-[#1877F2] transition-all hover:-translate-y-0.5 hover:border-[#1877F2]/40 hover:bg-[#1877F2]/10"
                aria-label="صفحة فيسبوك"
              >
                <FacebookIcon className="h-5 w-5" />
              </a>
              <a
                href={settings.tiktokUrl || BUSINESS.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-hair bg-elevated text-foreground/80 transition-all hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-foreground/[0.06]"
                aria-label="حساب تيك توك"
              >
                <TikTokIcon className="h-5 w-5" />
              </a>
              <span className="mr-1 hidden items-center gap-1.5 rounded-full border border-hair bg-elevated px-3 py-1.5 text-xs text-muted-foreground sm:inline-flex">
                <BadgeCheck className="h-3.5 w-3.5 text-mint" />
                {BUSINESS.socialProof.facebookFollowers.toLocaleString("en-US")}+ متابع
              </span>
            </div>
          </div>

          {/* Quick links */}
          <nav aria-label="روابط سريعة">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-faint">روابط سريعة</h3>
            <ul className="space-y-3 text-sm">
              {[
                { label: "الرئيسية", action: () => navigate({ name: "home" }) },
                { label: "المتجر", action: () => navigate({ name: "store" }) },
                { label: "تجميعات PC", action: () => navigate({ name: "builds" }) },
                { label: "خدمة الصيانة", action: () => navigate({ name: "maintenance" }) },
                { label: "سلة المشتريات", action: () => navigate({ name: "cart" }) },
              ].map((l) => (
                <li key={l.label}>
                  <button onClick={l.action} className="inline-block py-1 text-muted-foreground transition-colors hover:text-primary">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Dynamic categories */}
          <nav aria-label="فئات المتجر">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-faint">الفئات</h3>
            <ul className="space-y-3 text-sm">
              {visibleCategories.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => navigate({ name: "store", categorySlug: c.slug })}
                    className="group inline-flex items-center gap-2 py-1 text-muted-foreground transition-colors hover:text-primary"
                  >
                    <span className="h-1.5 w-1.5 rounded-full transition-transform group-hover:scale-150" style={{ backgroundColor: c.accent }} />
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-faint">تواصل معنا</h3>
            <ul className="space-y-3.5 text-sm">
              <li>
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 text-muted-foreground transition-colors hover:text-primary"
                >
                  <MessageCircle className="h-4 w-4 text-[#1fae53]" />
                  <span dir="ltr" className="font-tech tracking-wide">{BUSINESS.whatsappDisplay}</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{BUSINESS.address}</span>
              </li>
              <li className="flex items-center gap-2.5 text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-mint" />
                <span>بيع • شراء • استبدال</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ---- Bottom bar ---- */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-hair pt-6 text-xs text-faint sm:flex-row">
          <p>© {new Date().getFullYear()} {BUSINESS.nameArabic} — {BUSINESS.nameLatin}. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-4">
            <PolicyLink onClick={() => setPolicy("privacy")} label="سياسة الخصوصية" />
            <span className="text-foreground/15">•</span>
            <PolicyLink onClick={() => setPolicy("exchange")} label="الاستبدال والاسترجاع" />
            <span className="text-foreground/15">•</span>
            <PolicyLink onClick={() => setPolicy("terms")} label="الشروط والأحكام" />
          </div>
        </div>
      </div>

      <PolicyDialog which={policy} onClose={() => setPolicy(null)} />
    </footer>
  );
}

function PolicyLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 transition-colors hover:text-primary">
      <FileText className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/* --------------------------- Policy drafts ---------------------------- */

const POLICY_CONTENT: Record<string, { title: string; body: string[] }> = {
  privacy: {
    title: "سياسة الخصوصية",
    body: [
      "نحترم خصوصيتك: المتجر لا يطلب إنشاء حساب ولا يجمع بيانات شخصية إلا ما تشاركه بنفسك عند التواصل عبر واتساب (الاسم ورقم الهاتف) لإنجاز طلبك.",
      "لا تُحفظ هذه البيانات على الموقع في هذه المرحلة — تُرسل مباشرة في محادثة واتساب فقط.",
      "عند إطلاق المرحلة الثانية من المنصة سيتم توثيق سياسة الخصوصية الكاملة وفق أفضل الممارسات.",
    ],
  },
  exchange: {
    title: "الاستبدال والاسترجاع",
    body: [
      "هايبر تك من أكبر مزاياها خدمة الاستبدال: تقدر تستبدل جهازك القديم بجديد وتدفع الفرق.",
      "تفاصيل الاسترجاع والاستبدال ومدتها وشرط حالة المنتج تُحدَّد وتُؤكَّد مباشرة مع فريق المتجر عبر واتساب قبل إتمام أي عملية.",
      "لم نضع مدة أو شروطًا موثقة بعد — النصوص الرسمية ستُعتمد من إدارة المتجر في المرحلة القادمة.",
    ],
  },
  terms: {
    title: "الشروط والأحكام",
    body: [
      "يعمل هذا المتجر كواجهة عرض وتواصل: الشراء والاتفاق النهائي يتمّان عبر واتساب أو زيارة المتجر.",
      "الأسعار المعروضة بالجنيه المصري وقابلة للتحديث، ويُعتمد السعر النهائي عند التواصل.",
      "إرسال الطلب عبر واتساب لا يعني تأكيده — يتم التأكيد بردّ فريق المتجر.",
    ],
  },
};

function PolicyDialog({ which, onClose }: { which: string | null; onClose: () => void }) {
  const content = which ? POLICY_CONTENT[which] : null;
  return (
    <Dialog open={!!content} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg border-hair bg-elevated" dir="rtl">
        {content && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl">{content.title}</DialogTitle>
              <DialogDescription className="text-xs text-faint">
                نسخة أولية — تُعتمد النصوص الرسمية من إدارة المتجر
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm leading-7 text-muted-foreground">
              {content.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
