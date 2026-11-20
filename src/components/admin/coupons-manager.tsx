"use client";

/**
 * ============================================================
 * HYPER TECH — Admin Promo & Discount Codes Manager
 * ============================================================
 * Full CRUD for discount coupons:
 * - Code, Type (percentage / fixed_amount), Value
 * - Conditions: min order amount, max discount cap, usage limit
 * - Expiration date & status
 * - Quick active toggle, copy code, edit, delete
 * ============================================================
 */

import { useEffect, useMemo, useState } from "react";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  Calendar,
  Layers,
  Percent,
  Coins,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { repositories } from "@/lib/repositories";
import { EmptyState, FieldError } from "./admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DiscountCode, DiscountType } from "@/types";

interface CouponFormState {
  code: string;
  discountType: DiscountType;
  discountValue: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  usageLimit: string;
  expiresAt: string;
  isActive: boolean;
}

const EMPTY_FORM: CouponFormState = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  usageLimit: "",
  expiresAt: "",
  isActive: true,
};

export default function CouponsManager() {
  const [coupons, setCoupons] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "active" | "inactive">("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<DiscountCode | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await repositories.coupons.list();
      setCoupons(data);
    } catch (err: any) {
      toast.error("فشل تحميل كوبونات الخصم", {
        description: err?.message || "حدث خطأ أثناء الاتصال بالخادم.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const matchSearch =
        search.trim() === "" ||
        c.code.toLowerCase().includes(search.trim().toLowerCase());
      if (!matchSearch) return false;

      if (filterType === "active") return c.isActive;
      if (filterType === "inactive") return !c.isActive;
      return true;
    });
  }, [coupons, search, filterType]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setAttempted(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (c: DiscountCode) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount) : "",
      maxDiscountAmount: c.maxDiscountAmount ? String(c.maxDiscountAmount) : "",
      usageLimit: c.usageLimit ? String(c.usageLimit) : "",
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "",
      isActive: c.isActive,
    });
    setAttempted(false);
    setDialogOpen(true);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`تم نسخ الكود: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActive = async (c: DiscountCode) => {
    const nextState = !c.isActive;
    // optimistic update
    setCoupons((prev) =>
      prev.map((item) => (item.id === c.id ? { ...item, isActive: nextState } : item))
    );
    try {
      await repositories.coupons.update(c.id, { isActive: nextState });
      toast.success(
        nextState ? `تم تفعيل الكوبون "${c.code}"` : `تم إيقاف الكوبون "${c.code}"`
      );
    } catch (err: any) {
      // rollback
      setCoupons((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, isActive: c.isActive } : item))
      );
      toast.error("فشل تحديث حالة الكوبون", { description: err?.message });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);

    const cleanCode = form.code.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("يرجى إدخال كود الخصم");
      return;
    }

    const val = Number(form.discountValue);
    if (isNaN(val) || val <= 0) {
      toast.error("يرجى إدخال قيمة خصم صالحة أكبر من صفر");
      return;
    }

    if (form.discountType === "percentage" && val > 100) {
      toast.error("نسبة الخصم المئوية لا يمكن أن تتجاوز 100%");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: cleanCode,
        discountType: form.discountType,
        discountValue: val,
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        usageLimit: form.usageLimit ? Math.floor(Number(form.usageLimit)) : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        isActive: form.isActive,
      };

      if (editingId) {
        const updated = await repositories.coupons.update(editingId, payload);
        setCoupons((prev) =>
          prev.map((item) => (item.id === editingId ? updated : item))
        );
        toast.success(`تم تعديل الكوبون "${cleanCode}" بنجاح`);
      } else {
        const created = await repositories.coupons.create(payload);
        setCoupons((prev) => [created, ...prev]);
        toast.success(`تم إنشاء كود الخصم "${cleanCode}" بنجاح`);
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(editingId ? "فشل تعديل الكوبون" : "فشل إنشاء الكوبون", {
        description: err?.message || "حدث خطأ أثناء الاتصال بالخادم.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!couponToDelete) return;
    try {
      await repositories.coupons.remove(couponToDelete.id);
      setCoupons((prev) => prev.filter((item) => item.id !== couponToDelete.id));
      toast.success(`تم حذف الكوبون "${couponToDelete.code}"`);
    } catch (err: any) {
      toast.error("فشل حذف الكوبون", { description: err?.message });
    } finally {
      setDeleteDialogOpen(false);
      setCouponToDelete(null);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold tracking-tight">كوبونات الخصم</h2>
            <Badge variant="outline" className="border-primary/30 text-primary font-tech">
              {coupons.length}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            إنشاء وإدارة أكواد الخصم الترويجية والشروط ومرات الاستخدام
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="glow-accent-sm inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          إضافة كوبون جديد
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-faint" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بكود الخصم…"
            className="pr-9 rounded-xl border-hair bg-elevated text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-hair bg-elevated p-1 text-xs">
          {[
            { id: "all", label: "الكل" },
            { id: "active", label: "المفعلة فقط" },
            { id: "inactive", label: "المتوقفة" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={cn(
                "rounded-lg px-3 py-1.5 font-bold transition-all",
                filterType === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons List */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>جاري تحميل الكوبونات…</span>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={search ? "لا توجد نتائج تطابق بحثك" : "لا توجد كوبونات خصم حاليًا"}
          hint={
            search
              ? "جرّب البحث بكلمة أو كود آخر."
              : "اضغط على زر 'إضافة كوبون جديد' لإنشاء أول كود خصم لمتجرك."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCoupons.map((coupon) => {
            const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
            const isExhausted =
              coupon.usageLimit !== null &&
              coupon.usageLimit !== undefined &&
              coupon.usedCount >= coupon.usageLimit;

            return (
              <div
                key={coupon.id}
                className={cn(
                  "relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] border border-hair bg-elevated p-5 shadow-card transition-all hover:shadow-card-lg",
                  !coupon.isActive && "opacity-65"
                )}
              >
                {/* Header card: Code & Status */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl border border-hair bg-raised px-3 py-1.5 font-mono text-base font-extrabold tracking-wider text-primary">
                        {coupon.code}
                      </div>
                      <button
                        onClick={() => handleCopy(coupon.code)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-raised hover:text-foreground transition-colors"
                        title="نسخ الكود"
                      >
                        {copiedCode === coupon.code ? (
                          <Check className="h-4 w-4 text-mint" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={coupon.isActive}
                        onCheckedChange={() => handleToggleActive(coupon)}
                        aria-label="تفعيل أو إيقاف الكوبون"
                      />
                    </div>
                  </div>

                  {/* Value badge & Description */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge
                      className={cn(
                        "rounded-xl px-3 py-1 text-xs font-bold",
                        coupon.discountType === "percentage"
                          ? "bg-mint/15 text-mint border-mint/30"
                          : "bg-electric/15 text-electric border-electric/30"
                      )}
                    >
                      {coupon.discountType === "percentage" ? (
                        <span className="flex items-center gap-1 font-tech">
                          <Percent className="h-3 w-3" />
                          خصم {coupon.discountValue}%
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-tech">
                          <Coins className="h-3 w-3" />
                          خصم {formatPrice(coupon.discountValue)}
                        </span>
                      )}
                    </Badge>

                    {isExpired ? (
                      <Badge variant="destructive" className="text-[0.68rem]">
                        منتهي الصلاحية
                      </Badge>
                    ) : isExhausted ? (
                      <Badge variant="secondary" className="text-[0.68rem] bg-amber/20 text-amber">
                        مستنفد الاستخدام
                      </Badge>
                    ) : coupon.isActive ? (
                      <Badge variant="outline" className="border-mint/30 text-mint text-[0.68rem]">
                        مفعّل
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-[0.68rem]">
                        متوقف
                      </Badge>
                    )}
                  </div>

                  {/* Conditions details */}
                  <div className="mt-4 space-y-2 border-t border-hair pt-3 text-xs text-muted-foreground">
                    {coupon.minOrderAmount ? (
                      <div className="flex items-center justify-between">
                        <span>الحد الأدنى للطلب:</span>
                        <span className="font-tech font-bold text-foreground">
                          {formatPrice(coupon.minOrderAmount)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-faint">
                        <span>الحد الأدنى للطلب:</span>
                        <span>بلا حد أدنى</span>
                      </div>
                    )}

                    {coupon.discountType === "percentage" && coupon.maxDiscountAmount ? (
                      <div className="flex items-center justify-between">
                        <span>الحد الأقصى للخصم:</span>
                        <span className="font-tech font-bold text-foreground">
                          {formatPrice(coupon.maxDiscountAmount)}
                        </span>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between">
                      <span>مرات الاستخدام:</span>
                      <span className="font-tech font-bold text-foreground">
                        {coupon.usedCount}{" "}
                        {coupon.usageLimit ? `/ ${coupon.usageLimit}` : "(غير محدود)"}
                      </span>
                    </div>

                    {coupon.expiresAt ? (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-faint" />
                          تاريخ الانتهاء:
                        </span>
                        <span
                          className={cn(
                            "font-tech font-semibold",
                            isExpired ? "text-danger" : "text-foreground"
                          )}
                        >
                          {new Date(coupon.expiresAt).toLocaleDateString("ar-EG")}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-faint">
                        <span>الصلاحية:</span>
                        <span>مفتوحة دائماً</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Edit & Delete buttons */}
                <div className="mt-5 flex items-center justify-end gap-2 border-t border-hair pt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenEdit(coupon)}
                    className="h-8 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    تعديل
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCouponToDelete(coupon);
                      setDeleteDialogOpen(true);
                    }}
                    className="h-8 rounded-lg px-2.5 text-xs text-danger hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    حذف
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------- Create / Edit Dialog ---------------- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg border-hair bg-elevated sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              {editingId ? "تعديل كود الخصم" : "إنشاء كود خصم جديد"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              حدد رمز الكود، نوع الخصم، وشروط التطبيق والصلاحية.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                كود الخصم (Promo Code) <span className="text-danger">*</span>
              </Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="مثال: HYPER20 أو GAMING100"
                className="font-mono text-left tracking-wider uppercase font-bold"
                required
              />
              <span className="text-[0.7rem] text-faint mt-1 block">
                يتحول تلقائياً إلى حروف كبيرة باللغة الإنجليزية لسهولة كتابته من العميل.
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                  نوع الخصم
                </Label>
                <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-hair bg-raised p-1">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, discountType: "percentage" })}
                    className={cn(
                      "rounded-lg py-2 text-xs font-bold transition-all",
                      form.discountType === "percentage"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    نسبة مئوية %
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, discountType: "fixed_amount" })}
                    className={cn(
                      "rounded-lg py-2 text-xs font-bold transition-all",
                      form.discountType === "fixed_amount"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    مبلغ ثابت (ج.م)
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                  قيمة الخصم <span className="text-danger">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    max={form.discountType === "percentage" ? "100" : undefined}
                    step="any"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    placeholder={form.discountType === "percentage" ? "مثال: 10" : "مثال: 250"}
                    className="font-tech text-left pl-10"
                    required
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    {form.discountType === "percentage" ? "%" : "ج.م"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                  الحد الأدنى لقيمة الطلب (ج.م)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                  placeholder="اختياري — مثال: 1000"
                  className="font-tech text-left"
                />
              </div>

              {form.discountType === "percentage" ? (
                <div>
                  <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                    الحد الأقصى للخصم (ج.م)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={form.maxDiscountAmount}
                    onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                    placeholder="اختياري — مثال: 500"
                    className="font-tech text-left"
                  />
                </div>
              ) : (
                <div>
                  <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                    الحد الأقصى لمرات الاستخدام
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    placeholder="اختياري — مثال: 50"
                    className="font-tech text-left"
                  />
                </div>
              )}
            </div>

            {form.discountType === "percentage" && (
              <div>
                <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                  الحد الأقصى لمرات الاستخدام
                </Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="اختياري — مثال: 100"
                  className="font-tech text-left"
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">
                  تاريخ انتهاء الصلاحية
                </Label>
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="font-tech text-left"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-hair bg-raised p-3 self-end">
                <div>
                  <span className="text-xs font-bold block">تفعيل الكوبون فوراً</span>
                  <span className="text-[0.68rem] text-muted-foreground">
                    يمكن للعملاء استخدامه الآن
                  </span>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-3 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="glow-accent-sm rounded-xl bg-primary text-primary-foreground font-bold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    جاري الحفظ…
                  </>
                ) : editingId ? (
                  "تحديث الكوبون"
                ) : (
                  "إنشاء الكوبون"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------------- Delete Confirmation Dialog ---------------- */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md border-hair bg-elevated" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-lg font-bold">
              حذف كود الخصم؟
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              هل أنت متأكد من حذف كود الخصم &quot;{couponToDelete?.code}&quot;؟ لن يتمكن العملاء
              من استخدامه بعد الحذف.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-xl bg-danger text-danger-foreground hover:bg-danger/90 font-bold"
            >
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
