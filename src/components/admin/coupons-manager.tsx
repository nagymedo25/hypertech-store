"use client";

/**
 * ============================================================
 * HYPER TECH — Admin Promo & Discount Codes Manager
 * ============================================================
 * Clean, organized, responsive discount code management:
 * - Table view on desktop & clean cards on mobile
 * - Quick copy, active status toggle, edit & delete
 * - Solid, high-contrast create/edit modal
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
  Percent,
  Coins,
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

interface CouponFormData {
  code: string;
  discountType: DiscountType;
  discountValue: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  usageLimit: string;
  expiresAt: string;
  isActive: boolean;
}

const EMPTY_FORM: CouponFormData = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  usageLimit: "",
  expiresAt: "",
  isActive: true,
};

export function CouponsManager() {
  const [coupons, setCoupons] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "active" | "inactive">("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<DiscountCode | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const list = await repositories.coupons.list();
        if (alive) setCoupons(list);
      } catch {
        if (alive) toast.error("تعذر تحميل كوبونات الخصم");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filteredCoupons = useMemo(() => {
    let list = coupons;
    if (filterType === "active") list = list.filter((c) => c.isActive);
    else if (filterType === "inactive") list = list.filter((c) => !c.isActive);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) => c.code.toLowerCase().includes(q));
    }
    return list;
  }, [coupons, filterType, search]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setAttempted(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (c: DiscountCode) => {
    setEditingId(c.id);
    let expFormatted = "";
    if (c.expiresAt) {
      try {
        expFormatted = new Date(c.expiresAt).toISOString().split("T")[0];
      } catch {}
    }
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount) : "",
      maxDiscountAmount: c.maxDiscountAmount ? String(c.maxDiscountAmount) : "",
      usageLimit: c.usageLimit ? String(c.usageLimit) : "",
      expiresAt: expFormatted,
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
    setCoupons((prev) =>
      prev.map((item) => (item.id === c.id ? { ...item, isActive: nextState } : item))
    );
    try {
      await repositories.coupons.update(c.id, { isActive: nextState });
      toast.success(
        nextState ? `تم تفعيل الكوبون "${c.code}"` : `تم إيقاف الكوبون "${c.code}"`
      );
    } catch {
      setCoupons((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, isActive: c.isActive } : item))
      );
      toast.error("فشل تحديث حالة الكوبون");
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
    } catch {
      toast.error("فشل حذف الكوبون");
    } finally {
      setDeleteDialogOpen(false);
      setCouponToDelete(null);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Tag className="h-6 w-6 text-primary" />
              كوبونات الخصم
            </h1>
            <span className="rounded-full bg-primary/10 border border-primary/25 px-2.5 py-0.5 text-xs font-bold text-primary font-tech">
              {coupons.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            إنشاء وإدارة أكواد الخصم وشروط التطبيق والصلاحية ونسب التخفيض للمتجر.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md rounded-xl h-11 px-5 self-start sm:self-auto"
        >
          <Plus className="ml-1.5 h-4 w-4" />
          إضافة كوبون جديد
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بكود الخصم…"
            className="pr-10 rounded-xl border-hair bg-elevated text-xs h-10 font-tech"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-hair bg-elevated p-1 text-xs">
          {[
            { id: "all", label: "الكل" },
            { id: "active", label: "المفعلة" },
            { id: "inactive", label: "المتوقفة" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 font-bold transition-all",
                filterType === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>جاري تحميل الكوبونات…</span>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={search ? "لا توجد نتائج تطابق بحثك" : "لا توجد كوبونات خصم حالياً"}
          hint="أضف أول كود خصم لتشجيع العملاء ومكافأتهم عند إتمام الطلب."
          action={
            <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 font-bold">
              <Plus className="h-4 w-4" />
              إضافة أول كوبون
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden sm:block w-full overflow-x-auto rounded-2xl border border-hair bg-elevated shadow-card">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-hair bg-surface text-muted-foreground text-xs font-bold">
                  <th className="py-3.5 px-4">كود الخصم</th>
                  <th className="py-3.5 px-4">نوع وقيمة الخصم</th>
                  <th className="py-3.5 px-4">شروط الطلب</th>
                  <th className="py-3.5 px-4">مرات الاستخدام</th>
                  <th className="py-3.5 px-4">تاريخ الانتهاء</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hair">
                {filteredCoupons.map((coupon) => {
                  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                  const isExhausted =
                    coupon.usageLimit !== null &&
                    coupon.usageLimit !== undefined &&
                    coupon.usedCount >= coupon.usageLimit;

                  return (
                    <tr
                      key={coupon.id}
                      className={cn(
                        "transition-colors hover:bg-surface/50",
                        !coupon.isActive && "opacity-60 bg-surface/20"
                      )}
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg border border-hair bg-surface px-2.5 py-1 font-mono font-bold text-sm tracking-wider text-primary">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(coupon.code)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
                            title="نسخ الكود"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="h-4 w-4 text-mint" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Value */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold border",
                            coupon.discountType === "percentage"
                              ? "bg-mint/15 text-mint border-mint/30"
                              : "bg-primary/15 text-primary border-primary/30"
                          )}
                        >
                          {coupon.discountType === "percentage" ? (
                            <>
                              <Percent className="h-3.5 w-3.5" />
                              خصم {coupon.discountValue}%
                            </>
                          ) : (
                            <>
                              <Coins className="h-3.5 w-3.5" />
                              خصم {formatPrice(coupon.discountValue)}
                            </>
                          )}
                        </span>
                      </td>

                      {/* Thresholds */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-muted-foreground">
                        {coupon.minOrderAmount ? (
                          <div>
                            أدنى:{" "}
                            <span className="font-tech font-bold text-foreground">
                              {formatPrice(coupon.minOrderAmount)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-faint">بلا حد أدنى</span>
                        )}
                        {coupon.discountType === "percentage" && coupon.maxDiscountAmount ? (
                          <div className="text-[11px] text-faint">
                            أقصى خصم: {formatPrice(coupon.maxDiscountAmount)}
                          </div>
                        ) : null}
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs font-tech font-bold text-foreground">
                        {coupon.usedCount}{" "}
                        {coupon.usageLimit ? (
                          <span className="text-muted-foreground font-normal">/ {coupon.usageLimit}</span>
                        ) : (
                          <span className="text-faint text-[11px] font-sans font-normal">(غير محدود)</span>
                        )}
                      </td>

                      {/* Expiration */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        {coupon.expiresAt ? (
                          <span
                            className={cn(
                              "font-tech",
                              isExpired ? "text-danger font-bold" : "text-muted-foreground"
                            )}
                          >
                            {new Date(coupon.expiresAt).toLocaleDateString("en-GB")}
                            {isExpired && " (منتهي)"}
                          </span>
                        ) : (
                          <span className="text-faint">دائم</span>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={coupon.isActive}
                            onCheckedChange={() => handleToggleActive(coupon)}
                            disabled={Boolean(isExpired || isExhausted)}
                          />
                          <span className="text-xs font-medium text-muted-foreground">
                            {isExpired
                              ? "منتهي"
                              : isExhausted
                              ? "مستنفد"
                              : coupon.isActive
                              ? "مفعّل"
                              : "متوقف"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-xs font-bold"
                            onClick={() => handleOpenEdit(coupon)}
                          >
                            <Pencil className="h-3.5 w-3.5 ml-1" />
                            تعديل
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2.5 text-xs font-bold text-danger hover:bg-danger/10 hover:text-danger"
                            onClick={() => {
                              setCouponToDelete(coupon);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 ml-1" />
                            حذف
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
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
                    "rounded-2xl border border-hair bg-elevated p-4 shadow-card space-y-3",
                    !coupon.isActive && "opacity-60"
                  )}
                >
                  <div className="flex items-center justify-between border-b border-hair pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg border border-hair bg-surface px-2.5 py-1 font-mono font-bold text-sm tracking-wider text-primary">
                        {coupon.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(coupon.code)}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-surface"
                      >
                        {copiedCode === coupon.code ? (
                          <Check className="h-4 w-4 text-mint" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <Switch
                      checked={coupon.isActive}
                      onCheckedChange={() => handleToggleActive(coupon)}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold border",
                        coupon.discountType === "percentage"
                          ? "bg-mint/15 text-mint border-mint/30"
                          : "bg-primary/15 text-primary border-primary/30"
                      )}
                    >
                      {coupon.discountType === "percentage"
                        ? `خصم ${coupon.discountValue}%`
                        : `خصم ${formatPrice(coupon.discountValue)}`}
                    </span>

                    <span className="font-tech text-xs text-muted-foreground">
                      استُخدم {coupon.usedCount}{" "}
                      {coupon.usageLimit ? `/ ${coupon.usageLimit}` : "مرة"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-hair text-xs">
                    <span className="text-muted-foreground font-tech">
                      {coupon.expiresAt
                        ? `ينتهي: ${new Date(coupon.expiresAt).toLocaleDateString("en-GB")}`
                        : "كود دائم"}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs font-bold"
                        onClick={() => handleOpenEdit(coupon)}
                      >
                        <Pencil className="h-3.5 w-3.5 ml-1" />
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs font-bold text-danger hover:bg-danger/10"
                        onClick={() => {
                          setCouponToDelete(coupon);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= Create / Edit Dialog ================= */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0 bg-elevated border border-hair text-right shadow-2xl rounded-2xl">
          <DialogHeader className="border-b border-hair bg-surface px-6 py-4.5 text-right">
            <DialogTitle className="text-lg font-bold text-foreground">
              {editingId ? "تعديل كود الخصم" : "إنشاء كود خصم جديد"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              حدد رمز الكود ونوع الخصم وشروط التطبيق والصلاحية.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {/* Promo Code Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                كود الخصم (Promo Code) *
              </Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="مثال: HYPER20 أو SAVE100"
                className="bg-surface border-hair text-foreground font-mono font-bold tracking-wider text-left uppercase rounded-xl h-11 px-3.5 focus:border-primary"
                required
              />
            </div>

            {/* Discount Type Toggle */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">نوع الخصم *</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={cn(
                    "flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-bold transition-all",
                    form.discountType === "percentage"
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-hair bg-surface text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setForm({ ...form, discountType: "percentage" })}
                >
                  <Percent className="h-4 w-4" />
                  نسبة مئوية %
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-bold transition-all",
                    form.discountType === "fixed_amount"
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-hair bg-surface text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setForm({ ...form, discountType: "fixed_amount" })}
                >
                  <Coins className="h-4 w-4" />
                  مبلغ ثابت (ج.م)
                </button>
              </div>
            </div>

            {/* Discount Value */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                قيمة الخصم ({form.discountType === "percentage" ? "نسبة %" : "جنيه مصري"}) *
              </Label>
              <Input
                type="number"
                min="1"
                max={form.discountType === "percentage" ? "100" : undefined}
                step={form.discountType === "percentage" ? "1" : "50"}
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                placeholder={form.discountType === "percentage" ? "15" : "200"}
                dir="ltr"
                className="bg-surface border-hair text-foreground font-tech font-bold text-left rounded-xl h-11 px-3.5 focus:border-primary"
                required
              />
            </div>

            {/* Conditions: Min Order & Max Discount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  الحد الأدنى للطلب (ج.م)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                  placeholder="اختياري — 1000"
                  dir="ltr"
                  className="bg-surface border-hair text-foreground font-tech text-left font-bold rounded-xl h-11 px-3.5 focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  أقصى حد للخصم (ج.م)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="50"
                  disabled={form.discountType !== "percentage"}
                  value={form.maxDiscountAmount}
                  onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                  placeholder={form.discountType === "percentage" ? "اختياري — 500" : "—"}
                  dir="ltr"
                  className="bg-surface border-hair text-foreground font-tech text-left font-bold rounded-xl h-11 px-3.5 focus:border-primary disabled:opacity-40"
                />
              </div>
            </div>

            {/* Usage Limit & Expiration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  أقصى عدد استخدامات
                </Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="فارغ = غير محدود"
                  dir="ltr"
                  className="bg-surface border-hair text-foreground font-tech text-left font-bold rounded-xl h-11 px-3.5 focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">تاريخ الانتهاء</Label>
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  dir="ltr"
                  className="bg-surface border-hair text-foreground font-tech text-left rounded-xl h-11 px-3.5 focus:border-primary"
                />
              </div>
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between rounded-xl border border-hair bg-surface p-3.5">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-foreground">تفعيل الكوبون فوراً</Label>
                <p className="text-xs text-muted-foreground">
                  يمكن للعملاء استخدامه فوراً عند الشراء.
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
            </div>

            {/* Modal Footer */}
            <DialogFooter className="gap-2 pt-2 border-t border-hair sm:gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl h-11 px-5 font-bold"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-11 px-6 shadow-md"
              >
                {submitting && <Loader2 className="ml-1.5 h-4 w-4 animate-spin" />}
                {editingId ? "حفظ التعديلات" : "إنشاء الكوبون"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= Delete Confirmation Modal ================= */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-elevated border border-hair text-right shadow-2xl rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-bold">
              حذف كود الخصم؟
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              هل أنت متأكد من حذف الكوبون{" "}
              <strong className="text-foreground font-bold">{couponToDelete?.code}</strong>؟ لن يتمكن
              العملاء من استخدامه مجدداً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="rounded-xl font-bold">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-danger text-white hover:bg-danger/90 rounded-xl font-bold"
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default CouponsManager;
