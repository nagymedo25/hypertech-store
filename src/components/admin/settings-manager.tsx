"use client";

/**
 * ============================================================
 * HYPER TECH — Admin Settings Manager
 * ============================================================
 * Store identity + contact settings over the settings
 * repository (Neon). Store data management (backups + safe
 * reset) lives in its own dedicated center below these forms.
 * ============================================================
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DatabaseBackup,
  Cpu,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Save,
  Store,
} from "lucide-react";
import { useMockDB } from "@/lib/store/db-store";
import { repositories } from "@/lib/repositories";
import { useRouterStore } from "@/lib/router";
import { AdminHint, FieldError, FormSectionTitle } from "./admin-shell";
import { ImageUpload } from "./image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { StoreSettings } from "@/types";

/* -------------------------------- Validation ------------------------------ */

interface SettingsErrors {
  storeName?: string;
  whatsappNumber?: string;
}

function validateForm(f: StoreSettings): SettingsErrors {
  const errors: SettingsErrors = {};
  if (!f.storeName.trim()) errors.storeName = "اسم المتجر مطلوب";
  const digitsOnly = /^\d*$/;
  if (f.whatsappNumber.trim() && !digitsOnly.test(f.whatsappNumber.trim())) {
    errors.whatsappNumber = "أرقام فقط بدون + أو مسافات — مثال: 201553153156";
  }
  return errors;
}

/* -------------------------------- Component ------------------------------- */

export default function SettingsManager() {
  const settings = useMockDB((s) => s.settings);
  const navigate = useRouterStore((s) => s.navigate);

  const [form, setForm] = useState<StoreSettings>({ ...settings });
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);
  const [showBuildsPending, setShowBuildsPending] = useState(false);

  /* Re-sync local form whenever the store settings change
     (after save, or after a full resetToSeed from the danger zone). */
  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  const errors = validateForm(form);
  const invalid = Object.keys(errors).length > 0;

  const setField = <K extends keyof StoreSettings>(key: K, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  /* --------------------------------- Save ---------------------------------- */

  const save = async () => {
    if (invalid) {
      setAttempted(true);
      return;
    }
    setPending(true);
    try {
      await repositories.settings.update({
        storeName: form.storeName.trim(),
        tagline: form.tagline.trim(),
        whatsappNumber: form.whatsappNumber.trim(),
        whatsappDisplay: form.whatsappDisplay.trim(),
        facebookUrl: form.facebookUrl.trim(),
        tiktokUrl: form.tiktokUrl.trim(),
        address: form.address.trim(),
        businessDescription: form.businessDescription.trim(),
        logoUrl: form.logoUrl?.trim() || undefined,
      });
      setAttempted(false);
      toast.success("تم حفظ الإعدادات في قاعدة البيانات");
    } catch {
      toast.error("تعذر حفظ الإعدادات — تحقق من الاتصال وحاول تاني");
    } finally {
      setPending(false);
    }
  };

  /* Homepage builds section — applied immediately (not part of the
     deferred save form). Hides the PC-builds tile from the homepage
     category sections + category bar; the builds page stays live. */
  const toggleShowBuilds = async (next: boolean) => {
    if (showBuildsPending) return;
    setShowBuildsPending(true);
    try {
      await repositories.settings.update({ showBuildsCategory: next });
      toast.success(
        next
          ? "قسم تجميعات PC ظاهر في الصفحة الرئيسية"
          : "قسم تجميعات PC مخفي من الصفحة الرئيسية",
      );
    } catch {
      toast.error("تعذر تحديث الإعداد");
    } finally {
      setShowBuildsPending(false);
    }
  };

  /* --------------------------------- Render -------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold">إعدادات المتجر</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          بيانات الهوية والتواصل — بتظهر في الهيدر والفوتر ورسايل واتساب
        </p>
      </div>

      {/* Settings form */}
      <div className="overflow-hidden rounded-2xl border border-hair bg-surface/60">
        <div className="space-y-6 p-5 sm:p-6">
            {/* Identity */}
            <FormSectionTitle icon={Store}>الهوية</FormSectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="s-name">اسم المتجر *</Label>
                <Input
                  id="s-name"
                  value={form.storeName}
                  onChange={(e) => setField("storeName", e.target.value)}
                  placeholder="هايبر تك"
                />
                <FieldError>{attempted ? errors.storeName : undefined}</FieldError>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-tagline">الشعار النصي</Label>
                <Input
                  id="s-tagline"
                  value={form.tagline}
                  onChange={(e) => setField("tagline", e.target.value)}
                  placeholder="شغّل مستواك التالي"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="s-desc">وصف النشاط</Label>
                <Textarea
                  id="s-desc"
                  rows={4}
                  value={form.businessDescription}
                  onChange={(e) => setField("businessDescription", e.target.value)}
                  placeholder="وصف مختصر عن نشاط المتجر…"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>شعار المتجر (اللوجو)</Label>
                <p className="text-xs text-muted-foreground">
                  اسحب صورة اللوجو هنا أو اختر ملف، وسيتم تحديثه في كل أرجاء الموقع (الهيدر، الفوتر، ولوحة التحكم).
                </p>
                <ImageUpload
                  value={form.logoUrl ? [form.logoUrl] : []}
                  onChange={(urls) => setField("logoUrl", urls[0] ?? "")}
                  folder="hypertech/store"
                  max={1}
                  aspect="cover"
                />
              </div>
            </div>

            {/* Contact */}
            <FormSectionTitle icon={MessageCircle}>التواصل</FormSectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="s-wa">رقم واتساب (E.164 بدون +)</Label>
                <Input
                  id="s-wa"
                  dir="ltr"
                  className="font-tech"
                  value={form.whatsappNumber}
                  onChange={(e) => setField("whatsappNumber", e.target.value)}
                  placeholder="201553153156"
                />
                <FieldError>{attempted ? errors.whatsappNumber : undefined}</FieldError>
                <p className="text-[0.68rem] text-faint">
                  الرقم اللي بتوصله رسايل الطلبات — بصيغة دولية بدون + أو مسافات.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-wa-display">عرض الواتساب</Label>
                <Input
                  id="s-wa-display"
                  dir="ltr"
                  className="font-tech"
                  value={form.whatsappDisplay}
                  onChange={(e) => setField("whatsappDisplay", e.target.value)}
                  placeholder="015 5315 3156"
                />
                <p className="text-[0.68rem] text-faint">الشكل الجميل اللي يظهر للعملاء.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-fb">رابط فيسبوك</Label>
                <Input
                  id="s-fb"
                  dir="ltr"
                  className="font-tech text-xs"
                  value={form.facebookUrl}
                  onChange={(e) => setField("facebookUrl", e.target.value)}
                  placeholder="https://www.facebook.com/…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-tt">رابط تيك توك</Label>
                <Input
                  id="s-tt"
                  dir="ltr"
                  className="font-tech text-xs"
                  value={form.tiktokUrl}
                  onChange={(e) => setField("tiktokUrl", e.target.value)}
                  placeholder="https://www.tiktok.com/@…"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="s-address">العنوان</Label>
                <Input
                  id="s-address"
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  placeholder="المنصورة، الدقهلية، مصر"
                />
              </div>
            </div>
        </div>

        {/* Save bar */}
        <div className="flex items-center justify-end gap-2 border-t border-hair bg-elevated/30 px-5 py-4 sm:px-6">
          <Button onClick={save} disabled={pending || (attempted && invalid)} className="min-h-10 glow-accent-sm">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            حفظ الإعدادات
          </Button>
        </div>
      </div>

      {/* Storefront sections — immediate-apply toggles */}
      <div className="overflow-hidden rounded-2xl border border-hair bg-surface/60">
        <div className="p-5 sm:p-6">
          <FormSectionTitle icon={Cpu}>واجهة المتجر</FormSectionTitle>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-hair bg-elevated/40 p-3.5">
            <div className="min-w-0">
              <Label htmlFor="s-show-builds" className="text-sm font-medium">
                قسم تجميعات PC في الصفحة الرئيسية
              </Label>
              <p className="mt-0.5 text-[0.68rem] leading-relaxed text-faint">
                لما تقفلها، كارت تجميعات PC مش هيظهر في أقسام الصفحة الرئيسية ولا في شريط
                الفئات — صفحة التجميعات نفسها هتفضل شغالة.
              </p>
            </div>
            <Switch
              id="s-show-builds"
              checked={settings.showBuildsCategory !== false}
              disabled={showBuildsPending}
              onCheckedChange={toggleShowBuilds}
              aria-label="قسم تجميعات PC في الصفحة الرئيسية"
            />
          </div>
          <p className="mt-2 text-[0.65rem] text-faint">
            التعديل هنا بيتطبق على المتجر فورًا — مش محتاج ضغط «حفظ الإعدادات».
          </p>
        </div>
      </div>

      {/* Store data management & backup center — dedicated section */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-primary/[0.035] p-5 sm:p-6">
        <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
          <DatabaseBackup className="h-5 w-5 text-primary" aria-hidden />
          مركز إدارة بيانات المتجر
        </h3>
        <p className="mt-1.5 text-sm leading-7 text-muted-foreground">
          النسخ الاحتياطي الكامل بتقرير PDF احترافي، سجل النسخ، والمسح الآمن للتشغيل بعد التحقق —
          كله في مركز مخصص منفصل عن إعدادات المتجر.
        </p>
        <Button
          onClick={() => navigate({ name: "admin", section: "data" })}
          className="mt-4 min-h-10 bg-primary text-primary-foreground glow-accent-sm"
        >
          <DatabaseBackup className="h-4 w-4" aria-hidden />
          فتح مركز إدارة البيانات
        </Button>
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 orb-glow opacity-70"
        />
      </div>
    </div>
  );
}
