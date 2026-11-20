"use client";

/**
 * ============================================================
 * HYPER TECH — Admin Settings Manager
 * ============================================================
 * 1. Store identity + contact settings over the settings
 *    repository (Neon).
 * 2. Account & Security (الحساب والأمان):
 *    - Update admin email with password verification.
 *    - Update admin password with confirmation & verification.
 *    - Safe session refresh without lockout.
 * 3. Store data management (backups + safe reset).
 * ============================================================
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DatabaseBackup,
  Cpu,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  Save,
  ShieldCheck,
  Store,
  UserCheck,
} from "lucide-react";
import { useMockDB } from "@/lib/store/db-store";
import { repositories } from "@/lib/repositories";
import { useRouterStore } from "@/lib/router";
import { cn } from "@/lib/utils";
import { AdminHint, FieldError, FormSectionTitle } from "./admin-shell";
import { ImageUpload } from "./image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { StoreSettings } from "@/types";

/* -------------------------------- Types ----------------------------------- */

type SettingsTab = "store" | "security";

interface SettingsErrors {
  storeName?: string;
  whatsappNumber?: string;
}

interface AdminAccountData {
  id: string;
  username: string;
  email?: string | null;
  role: string;
  createdAt: string;
  lastLoginAt?: string | null;
}

/* -------------------------------- Validation ------------------------------ */

function validateStoreForm(f: StoreSettings): SettingsErrors {
  const errors: SettingsErrors = {};
  if (!f.storeName.trim()) errors.storeName = "اسم المتجر مطلوب";
  const digitsOnly = /^\d*$/;
  if (f.whatsappNumber.trim() && !digitsOnly.test(f.whatsappNumber.trim())) {
    errors.whatsappNumber = "أرقام فقط بدون + أو مسافات — مثال: 201553153156";
  }
  return errors;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmailForm(f: { currentPassword: string; newEmail: string }) {
  const errors: { currentPassword?: string; newEmail?: string } = {};
  if (!f.currentPassword) {
    errors.currentPassword = "كلمة المرور الحالية مطلوبة لتأكيد التغيير";
  }
  if (!f.newEmail.trim()) {
    errors.newEmail = "البريد الإلكتروني الجديد مطلوب";
  } else if (!EMAIL_REGEX.test(f.newEmail.trim())) {
    errors.newEmail = "صيغة البريد غير صحيحة — مثال: admin@hypertech.com";
  }
  return errors;
}

function validatePasswordForm(f: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const errors: { currentPassword?: string; newPassword?: string; confirmPassword?: string } = {};
  if (!f.currentPassword) {
    errors.currentPassword = "كلمة المرور الحالية مطلوبة";
  }
  if (!f.newPassword) {
    errors.newPassword = "كلمة المرور الجديدة مطلوبة";
  } else if (f.newPassword.length < 8) {
    errors.newPassword = "كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف";
  }
  if (!f.confirmPassword) {
    errors.confirmPassword = "يرجى تأكيد كلمة المرور الجديدة";
  } else if (f.newPassword !== f.confirmPassword) {
    errors.confirmPassword = "كلمة المرور وتأكيدها غير متطابقين";
  }
  return errors;
}

/* -------------------------------- Component ------------------------------- */

export default function SettingsManager() {
  const settings = useMockDB((s) => s.settings);
  const navigate = useRouterStore((s) => s.navigate);

  const [activeTab, setActiveTab] = useState<SettingsTab>("store");

  /* --- Store Settings State --- */
  const [form, setForm] = useState<StoreSettings>({ ...settings });
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);
  const [showBuildsPending, setShowBuildsPending] = useState(false);

  /* --- Account & Security State --- */
  const [account, setAccount] = useState<AdminAccountData | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);

  // Email form
  const [emailForm, setEmailForm] = useState({ currentPassword: "", newEmail: "" });
  const [emailAttempted, setEmailAttempted] = useState(false);
  const [emailPending, setEmailPending] = useState(false);
  const [showEmailCurrentPass, setShowEmailCurrentPass] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordAttempted, setPasswordAttempted] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);
  const [showPassCurrent, setShowPassCurrent] = useState(false);
  const [showPassNew, setShowPassNew] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);

  /* Re-sync local form whenever store settings change */
  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  /* Fetch admin account details */
  const loadAccount = async () => {
    setLoadingAccount(true);
    try {
      const res = await fetch("/api/admin/account");
      if (res.ok) {
        const data = await res.json();
        if (data.account) {
          setAccount(data.account);
          if (!emailForm.newEmail) {
            setEmailForm((prev) => ({
              ...prev,
              newEmail: data.account.email || data.account.username || "",
            }));
          }
        }
      }
    } catch {
      // Non-critical background fetch
    } finally {
      setLoadingAccount(false);
    }
  };

  useEffect(() => {
    loadAccount();
  }, []);

  const storeErrors = validateStoreForm(form);
  const storeInvalid = Object.keys(storeErrors).length > 0;

  const emailErrors = validateEmailForm(emailForm);
  const passwordErrors = validatePasswordForm(passwordForm);

  const setStoreField = <K extends keyof StoreSettings>(key: K, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  /* -------------------------- Store Settings Actions ---------------------- */

  const saveStoreSettings = async () => {
    if (storeInvalid) {
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

  const toggleShowBuilds = async (next: boolean) => {
    if (showBuildsPending) return;
    setShowBuildsPending(true);
    try {
      await repositories.settings.update({ showBuildsCategory: next });
      toast.success(
        next
          ? "قسم تجميعات PC ظاهر في الصفحة الرئيسية"
          : "قسم تجميعات PC مخفي من الصفحة الرئيسية"
      );
    } catch {
      toast.error("تعذر تحديث الإعداد");
    } finally {
      setShowBuildsPending(false);
    }
  };

  /* -------------------------- Account & Security Actions ------------------- */

  const handleUpdateEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const errs = validateEmailForm(emailForm);
    if (Object.keys(errs).length > 0) {
      setEmailAttempted(true);
      return;
    }
    setEmailPending(true);
    try {
      const res = await fetch("/api/admin/account/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: emailForm.currentPassword,
          newEmail: emailForm.newEmail.trim().toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "تعذر تحديث البريد الإلكتروني");
        return;
      }

      toast.success(data.message || "تم تحديث البريد الإلكتروني بنجاح");
      setEmailForm((prev) => ({ ...prev, currentPassword: "" }));
      setEmailAttempted(false);
      await loadAccount();
    } catch {
      toast.error("تعذر الاتصال بالخادم — حاول مرة أخرى");
    } finally {
      setEmailPending(false);
    }
  };

  const handleUpdatePassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const errs = validatePasswordForm(passwordForm);
    if (Object.keys(errs).length > 0) {
      setPasswordAttempted(true);
      return;
    }
    setPasswordPending(true);
    try {
      const res = await fetch("/api/admin/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "تعذر تغيير كلمة المرور");
        return;
      }

      toast.success(data.message || "تم تغيير كلمة المرور بنجاح — الجلسة مستمرة ومحمية");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordAttempted(false);
    } catch {
      toast.error("تعذر الاتصال بالخادم — حاول مرة أخرى");
    } finally {
      setPasswordPending(false);
    }
  };

  /* --------------------------------- Render -------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold">
          {activeTab === "store" ? "إعدادات المتجر" : "الحساب والأمان"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {activeTab === "store"
            ? "بيانات الهوية والتواصل — بتظهر في الهيدر والفوتر ورسايل واتساب"
            : "إدارة بيانات دخول المسؤول وتحديث البريد الإلكتروني وكلمة المرور بأمان"}
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-hair">
        <button
          type="button"
          onClick={() => setActiveTab("store")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors",
            activeTab === "store"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Store className="h-4 w-4" />
          إعدادات المتجر
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors",
            activeTab === "security"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <ShieldCheck className="h-4 w-4" />
          الحساب والأمان
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: STORE SETTINGS                                                */}
      {/* ==================================================================== */}
      {activeTab === "store" && (
        <div className="space-y-6">
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
                    onChange={(e) => setStoreField("storeName", e.target.value)}
                    placeholder="هايبر تك"
                  />
                  <FieldError>{attempted ? storeErrors.storeName : undefined}</FieldError>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-tagline">الشعار النصي</Label>
                  <Input
                    id="s-tagline"
                    value={form.tagline}
                    onChange={(e) => setStoreField("tagline", e.target.value)}
                    placeholder="شغّل مستواك التالي"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="s-desc">وصف النشاط</Label>
                  <Textarea
                    id="s-desc"
                    rows={4}
                    value={form.businessDescription}
                    onChange={(e) => setStoreField("businessDescription", e.target.value)}
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
                    onChange={(urls) => setStoreField("logoUrl", urls[0] ?? "")}
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
                    onChange={(e) => setStoreField("whatsappNumber", e.target.value)}
                    placeholder="201553153156"
                  />
                  <FieldError>{attempted ? storeErrors.whatsappNumber : undefined}</FieldError>
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
                    onChange={(e) => setStoreField("whatsappDisplay", e.target.value)}
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
                    onChange={(e) => setStoreField("facebookUrl", e.target.value)}
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
                    onChange={(e) => setStoreField("tiktokUrl", e.target.value)}
                    placeholder="https://www.tiktok.com/@…"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="s-address">العنوان</Label>
                  <Input
                    id="s-address"
                    value={form.address}
                    onChange={(e) => setStoreField("address", e.target.value)}
                    placeholder="المنصورة، الدقهلية، مصر"
                  />
                </div>
              </div>
            </div>

            {/* Save bar */}
            <div className="flex items-center justify-end gap-2 border-t border-hair bg-elevated/30 px-5 py-4 sm:px-6">
              <Button
                onClick={saveStoreSettings}
                disabled={pending || (attempted && storeInvalid)}
                className="min-h-10 glow-accent-sm"
              >
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
      )}

      {/* ==================================================================== */}
      {/* TAB 2: ACCOUNT & SECURITY                                            */}
      {/* ==================================================================== */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Account Profile Summary */}
          <div className="rounded-2xl border border-hair bg-surface/60 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                  <UserCheck className="h-6 w-6" aria-hidden />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    حساب المسؤول الرئيسي
                  </h3>
                  <p className="font-tech text-sm text-muted-foreground">
                    {loadingAccount
                      ? "جاري التحميل..."
                      : account?.email || account?.username || "admin@hypertech.com"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                  جلسة آمنة ونشطة
                </span>
                <span className="inline-flex items-center rounded-full border border-hair bg-elevated/60 px-3 py-1 font-tech text-xs text-muted-foreground">
                  الدور: {account?.role || "admin"}
                </span>
              </div>
            </div>
          </div>

          {/* Form 1: Update Email */}
          <form
            onSubmit={handleUpdateEmail}
            className="overflow-hidden rounded-2xl border border-hair bg-surface/60"
          >
            <div className="space-y-5 p-5 sm:p-6">
              <FormSectionTitle icon={Mail}>تحديث البريد الإلكتروني</FormSectionTitle>
              <p className="text-xs leading-relaxed text-muted-foreground">
                يُستخدم البريد الإلكتروني لتسجيل الدخول إلى لوحة التحكم واستعادة الحساب واستلام
                الإشعارات الإدارية الحساسة. يتطلب التعديل إدخال كلمة المرور الحالية لتأكيد الهوية.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="email-cur-pass">كلمة المرور الحالية *</Label>
                  <div className="relative">
                    <Input
                      id="email-cur-pass"
                      type={showEmailCurrentPass ? "text" : "password"}
                      dir="ltr"
                      className="font-tech pl-10"
                      value={emailForm.currentPassword}
                      onChange={(e) =>
                        setEmailForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                      }
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmailCurrentPass(!showEmailCurrentPass)}
                      className="absolute inset-y-0 left-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      aria-label={showEmailCurrentPass ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showEmailCurrentPass ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <FieldError>
                    {emailAttempted ? emailErrors.currentPassword : undefined}
                  </FieldError>
                </div>

                {/* New Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email-new">البريد الإلكتروني الجديد *</Label>
                  <Input
                    id="email-new"
                    type="email"
                    dir="ltr"
                    className="font-tech"
                    value={emailForm.newEmail}
                    onChange={(e) =>
                      setEmailForm((prev) => ({ ...prev, newEmail: e.target.value }))
                    }
                    placeholder="admin@hypertech.com"
                    autoComplete="email"
                  />
                  <FieldError>{emailAttempted ? emailErrors.newEmail : undefined}</FieldError>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-hair bg-elevated/30 px-5 py-4 sm:px-6">
              <span className="text-[0.68rem] text-muted-foreground">
                لن يتم تسجيل خروجك — يتم تجديد جلسة الدخول تلقائيًا فور التحديث.
              </span>
              <Button
                type="submit"
                disabled={emailPending}
                className="min-h-10 glow-accent-sm"
              >
                {emailPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Mail className="h-4 w-4" aria-hidden />
                )}
                تحديث البريد الإلكتروني
              </Button>
            </div>
          </form>

          {/* Form 2: Update Password */}
          <form
            onSubmit={handleUpdatePassword}
            className="overflow-hidden rounded-2xl border border-hair bg-surface/60"
          >
            <div className="space-y-5 p-5 sm:p-6">
              <FormSectionTitle icon={KeyRound}>تغيير كلمة المرور</FormSectionTitle>
              <p className="text-xs leading-relaxed text-muted-foreground">
                اختر كلمة مرور قوية مكونة من 8 أحرف على الأقل تحتوي على أرقام وحروف. يتم تشفير كلمة
                المرور فورًا بتقنية <span className="font-tech text-foreground">scrypt</span> مع salt
                عشوائي لحمايتها القصوى.
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="pass-cur">كلمة المرور الحالية *</Label>
                  <div className="relative">
                    <Input
                      id="pass-cur"
                      type={showPassCurrent ? "text" : "password"}
                      dir="ltr"
                      className="font-tech pl-10"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                      }
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassCurrent(!showPassCurrent)}
                      className="absolute inset-y-0 left-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      aria-label={showPassCurrent ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showPassCurrent ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <FieldError>
                    {passwordAttempted ? passwordErrors.currentPassword : undefined}
                  </FieldError>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="pass-new">كلمة المرور الجديدة *</Label>
                  <div className="relative">
                    <Input
                      id="pass-new"
                      type={showPassNew ? "text" : "password"}
                      dir="ltr"
                      className="font-tech pl-10"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                      }
                      placeholder="8 أحرف كحد أدنى"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassNew(!showPassNew)}
                      className="absolute inset-y-0 left-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      aria-label={showPassNew ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showPassNew ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <FieldError>
                    {passwordAttempted ? passwordErrors.newPassword : undefined}
                  </FieldError>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="pass-confirm">تأكيد كلمة المرور الجديدة *</Label>
                  <div className="relative">
                    <Input
                      id="pass-confirm"
                      type={showPassConfirm ? "text" : "password"}
                      dir="ltr"
                      className="font-tech pl-10"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder="أعد إدخال الجديدة"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassConfirm(!showPassConfirm)}
                      className="absolute inset-y-0 left-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      aria-label={showPassConfirm ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showPassConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <FieldError>
                    {passwordAttempted ? passwordErrors.confirmPassword : undefined}
                  </FieldError>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-hair bg-elevated/30 px-5 py-4 sm:px-6">
              <span className="text-[0.68rem] text-muted-foreground">
                يتم تحديث التوكن المشفر تلقائيًا للحفاظ على جلستك الحالية دون أي انقطاع.
              </span>
              <Button
                type="submit"
                disabled={passwordPending}
                className="min-h-10 glow-accent-sm"
              >
                {passwordPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <KeyRound className="h-4 w-4" aria-hidden />
                )}
                تحديث كلمة المرور
              </Button>
            </div>
          </form>

          {/* Security Features & Protection Info */}
          <div className="rounded-2xl border border-hair bg-surface/40 p-5 sm:p-6">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Lock className="h-4 w-4 text-primary" aria-hidden />
              ميزات أمان النظام
            </h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-hair bg-elevated/40 p-3">
                <span className="text-xs font-semibold text-foreground">تشفير scrypt فائق الأمان</span>
                <p className="mt-1 text-[0.68rem] leading-relaxed text-muted-foreground">
                  تشفير كلمات المرور عبر خوارزمية scrypt المشددة مع Salt فريد وعشوائي لكل حساب.
                </p>
              </div>
              <div className="rounded-xl border border-hair bg-elevated/40 p-3">
                <span className="text-xs font-semibold text-foreground">حماية ضد التخمين</span>
                <p className="mt-1 text-[0.68rem] leading-relaxed text-muted-foreground">
                  تحديد معدل المحاولات (Rate Limiting) يحظر محاولات الاختراق تلقائيًا بعد 5 محاولات فاشلة.
                </p>
              </div>
              <div className="rounded-xl border border-hair bg-elevated/40 p-3">
                <span className="text-xs font-semibold text-foreground">جلسات مشفرة بمفتاح HMAC</span>
                <p className="mt-1 text-[0.68rem] leading-relaxed text-muted-foreground">
                  كوكيز الجلسة محمية بـ HttpOnly و SameSite=Lax وموقعة رقميًا لمنع التلاعب تمامًا.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
