"use client";

/**
 * ============================================================
 * HYPER TECH — Dynamic Site Content Manager (CMS)
 * ============================================================
 * Allows admin to edit live copy across the storefront:
 * - Hero (kicker, main headline, description, CTAs)
 * - Best Sellers (kicker, title, accent, description)
 * - Categories (kicker, title, accent, description)
 * - Trust & Services (4 trust cards, maintenance banner)
 * - Footer (about copy, address, copyright)
 * ============================================================
 */

import { useEffect, useState } from "react";
import {
  FileText,
  Save,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Layers,
  ShieldCheck,
  LayoutTemplate,
  Loader2,
  CheckCircle2,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { useMockDB } from "@/lib/store/db-store";
import { repositories } from "@/lib/repositories";
import { BUSINESS } from "@/lib/config";
import { cn } from "@/lib/utils";

export const DEFAULT_CMS_CONTENT = {
  hero: {
    kicker: "",
    headlineLine1: "شغّل",
    headlineLine2: "مستواك",
    headlineAccent: "التالي",
    description:
      "لابتوب، تجميعات PC، وأجزاء واكسسوارات مختارة بعناية — مع بيع وشراء واستبدال، وخدمة صيانة بنفس المكان. كل اللي تحتاجه لتقنيتك، تحت سقف واحد.",
    ctaPrimary: "ابدأ التسوّق",
    ctaSecondary: "شوف تجميعاتنا",
  },
  bestsellers: {
    kicker: "مختارات هايبر تك",
    title: "الأكثر",
    accentWord: "مبيعًا",
    description: "تشكيلة مختارة بعناية — المنتجات اللي عملاؤنا بيسألوا عليها فعلًا، متجددة أول بأول.",
  },
  categories: {
    kicker: "أقسام المتجر",
    title: "تسوّق حسب",
    accentWord: "الفئة",
    description: "ثمانية أقسام متخصصة — اختار القسم اللي يناسبك وادخل على عالمه مباشرة.",
  },
  trust: {
    kicker: "ليه هايبر تك؟",
    title: "أربعة أسباب",
    accentWord: "موثّقة",
    description: "كل ميزة هنا مأخوذة من معلومات حقيقية عن نشاط المتجر — مفيش وعود عامة.",
    card1Title: "بيع… وشراء… واستبدال",
    card1Body: "مش بس بنبيع: تقدر تستبدل جهازك القديم بجديد وتدفع الفرق، أو تبيعه لو مش محتاجه — خدمة موثقة في نشاط المتجر.",
    card1Fact: "من وصف صفحة المتجر الرسمية",
    card2Title: "تخصص حقيقي في التقنية",
    card2Body: "لابتوب، أجزاء كمبيوتر، وهواتف — مجال بنعرفه بتفصيله، من اختيار القطعة للمواصفات المناسبة لاستخدامك.",
    card2Fact: "من وصف صفحة المتجر الرسمية",
    card3Title: "تواصل مباشر بلا حسابات",
    card3Body: "مفيش تسجيل ولا بيانات تدخلها — كلمنا واتساب مباشرة واتفق معك على كل التفاصيل قبل أي شراء.",
    card3Fact: "قناة التواصل الرسمية",
    card4Title: "مجتمع بيثق فينا",
    card4Body: "أكتر من 1,700 متابع على صفحتنا بيتابعوا عروضنا ومنتجاتنا أول بأول — وأحنا بنرد على الجميع.",
    card4Fact: "إحصائية فيسبوك وقت البحث",
    maintenanceTitle: "جهازك فيه مشكلة؟",
    maintenanceText: "صف لنا المشكلة بخطوات بسيطة — من غير حساب ولا تعقيد — وابعتها واتساب على طول، وفريق الصيانة هيتواصل معاك.",
    maintenanceCta: "ابدأ طلب الصيانة",
  },
  footer: {
    about: BUSINESS.description,
    address: BUSINESS.address,
    copyright: `© ${new Date().getFullYear()} ${BUSINESS.nameArabic} — ${BUSINESS.nameLatin}. جميع الحقوق محفوظة.`,
  },
};

type ActiveTab = "hero" | "bestsellers" | "categories" | "trust" | "footer";

export default function ContentManager() {
  const storeSiteContent = useMockDB((s) => s.siteContent);
  const [activeTab, setActiveTab] = useState<ActiveTab>("hero");
  const [form, setForm] = useState(DEFAULT_CMS_CONTENT);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (storeSiteContent?.data) {
      setForm((prev) => ({
        hero: { ...prev.hero, ...(storeSiteContent.data.hero || {}) },
        bestsellers: { ...prev.bestsellers, ...(storeSiteContent.data.bestsellers || {}) },
        categories: { ...prev.categories, ...(storeSiteContent.data.categories || {}) },
        trust: { ...prev.trust, ...(storeSiteContent.data.trust || {}) },
        footer: { ...prev.footer, ...(storeSiteContent.data.footer || {}) },
      }));
    }
  }, [storeSiteContent]);

  const handleFieldChange = (section: keyof typeof DEFAULT_CMS_CONTENT, key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await repositories.content.update(form);
      toast.success("تم حفظ محتوى الموقع بنجاح", {
        description: "تم تحديث الواجهة المباشرة للمتجر فورًا.",
      });
    } catch (err: any) {
      toast.error("فشل حفظ التعديلات", {
        description: err?.message || "حدث خطأ أثناء الاتصال بالخادم.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSection = (section: ActiveTab) => {
    setForm((prev) => ({
      ...prev,
      [section]: DEFAULT_CMS_CONTENT[section],
    }));
    toast.info("تمت استعادة القيم الافتراضية لهذا القسم — اضغط حفظ للتأكيد");
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold tracking-tight">إدارة محتوى المتجر</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-mint/30 bg-mint/10 px-2.5 py-0.5 text-xs font-semibold text-mint">
              <CheckCircle2 className="h-3 w-3" />
              مباشر Real-Time
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            تعديل نصوص الصفحة الرئيسية والواجهة والفوتر مباشرة دون تعديل الكود
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => handleResetSection(activeTab)}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl border border-hair bg-elevated px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground hover:bg-raised"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            استعادة الافتراضي
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="glow-accent-sm inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري الحفظ…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                حفظ التغييرات
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex overflow-x-auto pb-2 scrollbar-none border-b border-hair gap-2">
        {[
          { id: "hero", label: "الواجهة (Hero)", icon: Sparkles },
          { id: "bestsellers", label: "الأكثر مبيعاً", icon: ShoppingBag },
          { id: "categories", label: "أقسام المتجر", icon: Layers },
          { id: "trust", label: "الثقة والخدمات", icon: ShieldCheck },
          { id: "footer", label: "تذييل الموقع (Footer)", icon: LayoutTemplate },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-elevated hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="rounded-[1.75rem] border border-hair bg-elevated p-6 shadow-card sm:p-8">
        {/* 1. HERO TAB */}
        {activeTab === "hero" && (
          <div className="space-y-6">
            <div className="border-b border-hair pb-4">
              <h3 className="font-display text-lg font-bold">نصوص الواجهة الرئيسية (Hero Section)</h3>
              <p className="text-xs text-muted-foreground mt-1">
                تظهر في أعلى الصفحة الرئيسية كأول ما يراه العميل عند دخول المتجر.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  الشارة العلوية (Kicker / Badge)
                </label>
                <input
                  type="text"
                  placeholder="اتركه فارغاً للاعتماد على اسم الماركة الذكي للمنتج المعروض أو الافتراضي"
                  value={form.hero.kicker}
                  onChange={(e) => handleFieldChange("hero", "kicker", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
                <span className="text-[0.7rem] text-faint mt-1 block">
                  إذا تُرك فارغاً، سيتم اختيار الماركة تلقائياً من المنتج المميز المعروض.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  السطر الأول من العنوان الرئيسي
                </label>
                <input
                  type="text"
                  value={form.hero.headlineLine1}
                  onChange={(e) => handleFieldChange("hero", "headlineLine1", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  السطر الثاني (النص العادي)
                </label>
                <input
                  type="text"
                  value={form.hero.headlineLine2}
                  onChange={(e) => handleFieldChange("hero", "headlineLine2", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  الكلمة المميزة المضيئة (Accent Word)
                </label>
                <input
                  type="text"
                  value={form.hero.headlineAccent}
                  onChange={(e) => handleFieldChange("hero", "headlineAccent", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  الوصف التعريفي للواجهة
                </label>
                <textarea
                  rows={3}
                  value={form.hero.description}
                  onChange={(e) => handleFieldChange("hero", "description", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  نص زر الشراء الأساسي (CTA 1)
                </label>
                <input
                  type="text"
                  value={form.hero.ctaPrimary}
                  onChange={(e) => handleFieldChange("hero", "ctaPrimary", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  نص زر التجميعات الثانوي (CTA 2)
                </label>
                <input
                  type="text"
                  value={form.hero.ctaSecondary}
                  onChange={(e) => handleFieldChange("hero", "ctaSecondary", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. BEST SELLERS TAB */}
        {activeTab === "bestsellers" && (
          <div className="space-y-6">
            <div className="border-b border-hair pb-4">
              <h3 className="font-display text-lg font-bold">قسم الأكثر مبيعاً (Best Sellers)</h3>
              <p className="text-xs text-muted-foreground mt-1">
                القسم الذي يعرض تشكيلة المنتجات المميزة والمختارة في الصفحة الرئيسية.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  الشارة العلوية (Kicker)
                </label>
                <input
                  type="text"
                  value={form.bestsellers.kicker}
                  onChange={(e) => handleFieldChange("bestsellers", "kicker", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  عنوان القسم
                </label>
                <input
                  type="text"
                  value={form.bestsellers.title}
                  onChange={(e) => handleFieldChange("bestsellers", "title", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  الكلمة المميزة في العنوان (Accent Word)
                </label>
                <input
                  type="text"
                  value={form.bestsellers.accentWord}
                  onChange={(e) => handleFieldChange("bestsellers", "accentWord", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  وصف القسم
                </label>
                <textarea
                  rows={2}
                  value={form.bestsellers.description}
                  onChange={(e) => handleFieldChange("bestsellers", "description", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. CATEGORIES TAB */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <div className="border-b border-hair pb-4">
              <h3 className="font-display text-lg font-bold">بوابة أقسام المتجر (Categories Gateway)</h3>
              <p className="text-xs text-muted-foreground mt-1">
                الترويسة والوصف لقسم استعراض فئات وأقسام المتجر المختلفة.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  الشارة العلوية (Kicker)
                </label>
                <input
                  type="text"
                  value={form.categories.kicker}
                  onChange={(e) => handleFieldChange("categories", "kicker", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  عنوان القسم
                </label>
                <input
                  type="text"
                  value={form.categories.title}
                  onChange={(e) => handleFieldChange("categories", "title", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  الكلمة المميزة في العنوان (Accent Word)
                </label>
                <input
                  type="text"
                  value={form.categories.accentWord}
                  onChange={(e) => handleFieldChange("categories", "accentWord", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  وصف القسم
                </label>
                <textarea
                  rows={2}
                  value={form.categories.description}
                  onChange={(e) => handleFieldChange("categories", "description", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. TRUST & SERVICES TAB */}
        {activeTab === "trust" && (
          <div className="space-y-6">
            <div className="border-b border-hair pb-4">
              <h3 className="font-display text-lg font-bold">الثقة والخدمات وبانر الصيانة (Trust & Services)</h3>
              <p className="text-xs text-muted-foreground mt-1">
                الأسباب الأربعة الموثقة لاختيار هايبر تك بالإضافة إلى بانر خدمة الصيانة.
              </p>
            </div>

            {/* Section Head */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">الشارة (Kicker)</label>
                <input
                  type="text"
                  value={form.trust.kicker}
                  onChange={(e) => handleFieldChange("trust", "kicker", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">العنوان</label>
                <input
                  type="text"
                  value={form.trust.title}
                  onChange={(e) => handleFieldChange("trust", "title", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">الكلمة المميزة</label>
                <input
                  type="text"
                  value={form.trust.accentWord}
                  onChange={(e) => handleFieldChange("trust", "accentWord", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">وصف القسم</label>
                <input
                  type="text"
                  value={form.trust.description}
                  onChange={(e) => handleFieldChange("trust", "description", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* 4 Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-4">
              {/* Card 1 */}
              <div className="rounded-2xl border border-hair bg-raised p-4 space-y-3">
                <div className="text-xs font-bold text-primary">بطاقة الثقة الأولى (01)</div>
                <input
                  type="text"
                  placeholder="عنوان البطاقة"
                  value={form.trust.card1Title}
                  onChange={(e) => handleFieldChange("trust", "card1Title", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-elevated px-3 py-2 text-xs font-bold focus:border-primary focus:outline-none"
                />
                <textarea
                  rows={2}
                  placeholder="نص البطاقة"
                  value={form.trust.card1Body}
                  onChange={(e) => handleFieldChange("trust", "card1Body", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-elevated px-3 py-2 text-xs focus:border-primary focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="مصدر المعلومة / الحقيقة"
                  value={form.trust.card1Fact}
                  onChange={(e) => handleFieldChange("trust", "card1Fact", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-elevated px-3 py-2 text-[0.75rem] text-faint focus:border-primary focus:outline-none"
                />
              </div>

              {/* Card 2 */}
              <div className="rounded-2xl border border-hair bg-raised p-4 space-y-3">
                <div className="text-xs font-bold text-primary">بطاقة الثقة الثانية (02)</div>
                <input
                  type="text"
                  placeholder="عنوان البطاقة"
                  value={form.trust.card2Title}
                  onChange={(e) => handleFieldChange("trust", "card2Title", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-elevated px-3 py-2 text-xs font-bold focus:border-primary focus:outline-none"
                />
                <textarea
                  rows={2}
                  placeholder="نص البطاقة"
                  value={form.trust.card2Body}
                  onChange={(e) => handleFieldChange("trust", "card2Body", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-elevated px-3 py-2 text-xs focus:border-primary focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="مصدر المعلومة / الحقيقة"
                  value={form.trust.card2Fact}
                  onChange={(e) => handleFieldChange("trust", "card2Fact", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-elevated px-3 py-2 text-[0.75rem] text-faint focus:border-primary focus:outline-none"
                />
              </div>

              {/* Card 3 */}
              <div className="rounded-2xl border border-hair bg-raised p-4 space-y-3">
                <div className="text-xs font-bold text-primary">بطاقة الثقة الثالثة (03)</div>
                <input
                  type="text"
                  placeholder="عنوان البطاقة"
                  value={form.trust.card3Title}
                  onChange={(e) => handleFieldChange("trust", "card3Title", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-elevated px-3 py-2 text-xs font-bold focus:border-primary focus:outline-none"
                />
                <textarea
                  rows={2}
                  placeholder="نص البطاقة"
                  value={form.trust.card3Body}
                  onChange={(e) => handleFieldChange("trust", "card3Body", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-elevated px-3 py-2 text-xs focus:border-primary focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="مصدر المعلومة / الحقيقة"
                  value={form.trust.card3Fact}
                  onChange={(e) => handleFieldChange("trust", "card3Fact", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-elevated px-3 py-2 text-[0.75rem] text-faint focus:border-primary focus:outline-none"
                />
              </div>

              {/* Card 4 */}
              <div className="rounded-2xl border border-hair bg-raised p-4 space-y-3">
                <div className="text-xs font-bold text-primary">بطاقة الثقة الرابعة (04)</div>
                <input
                  type="text"
                  placeholder="عنوان البطاقة"
                  value={form.trust.card4Title}
                  onChange={(e) => handleFieldChange("trust", "card4Title", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-elevated px-3 py-2 text-xs font-bold focus:border-primary focus:outline-none"
                />
                <textarea
                  rows={2}
                  placeholder="نص البطاقة"
                  value={form.trust.card4Body}
                  onChange={(e) => handleFieldChange("trust", "card4Body", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-elevated px-3 py-2 text-xs focus:border-primary focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="مصدر المعلومة / الحقيقة"
                  value={form.trust.card4Fact}
                  onChange={(e) => handleFieldChange("trust", "card4Fact", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-elevated px-3 py-2 text-[0.75rem] text-faint focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Maintenance banner */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3 pt-4">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <Wrench className="h-4 w-4" />
                بانر طلب الصيانة السريع
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    عنوان بانر الصيانة
                  </label>
                  <input
                    type="text"
                    value={form.trust.maintenanceTitle}
                    onChange={(e) => handleFieldChange("trust", "maintenanceTitle", e.target.value)}
                    className="w-full rounded-xl border border-hair bg-elevated px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    نص زر طلب الصيانة (CTA)
                  </label>
                  <input
                    type="text"
                    value={form.trust.maintenanceCta}
                    onChange={(e) => handleFieldChange("trust", "maintenanceCta", e.target.value)}
                    className="w-full rounded-xl border border-hair bg-elevated px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    نص وصف الصيانة
                  </label>
                  <textarea
                    rows={2}
                    value={form.trust.maintenanceText}
                    onChange={(e) => handleFieldChange("trust", "maintenanceText", e.target.value)}
                    className="w-full rounded-xl border border-hair bg-elevated px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. FOOTER TAB */}
        {activeTab === "footer" && (
          <div className="space-y-6">
            <div className="border-b border-hair pb-4">
              <h3 className="font-display text-lg font-bold">تذييل الموقع (Footer)</h3>
              <p className="text-xs text-muted-foreground mt-1">
                تعديل نبذة المتجر، العنوان الظاهر، وجملة حقوق النشر في الفوتر.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  نبذة تعريفية بالمتجر (About Copy)
                </label>
                <textarea
                  rows={3}
                  value={form.footer.about}
                  onChange={(e) => handleFieldChange("footer", "about", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  عنوان الفرع الرئيسي المكتوب
                </label>
                <input
                  type="text"
                  value={form.footer.address}
                  onChange={(e) => handleFieldChange("footer", "address", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  نص حقوق الملكية والنشر (Copyright)
                </label>
                <input
                  type="text"
                  value={form.footer.copyright}
                  onChange={(e) => handleFieldChange("footer", "copyright", e.target.value)}
                  className="w-full rounded-xl border border-hair bg-raised px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
