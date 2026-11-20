"use client";

/**
 * ============================================================
 * HYPER TECH — Admin Hardware Upgrade Pricing Manager
 * ============================================================
 * Clean, high-contrast dashboard to centrally define & manage
 * upgrade price rates for RAM and Storage (SSD) component tiers.
 * ============================================================
 */

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Cpu,
  HardDrive,
  Loader2,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { useMockDB } from "@/lib/store/db-store";
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
import { cn } from "@/lib/utils";
import type { HardwareComponentType, HardwareUpgradeRate } from "@/types";

interface TierFormData {
  componentType: HardwareComponentType;
  label: string;
  capacityGb: string;
  priceDelta: string;
  active: boolean;
}

const EMPTY_FORM: TierFormData = {
  componentType: "ram",
  label: "",
  capacityGb: "",
  priceDelta: "0",
  active: true,
};

export function HardwarePricingManager() {
  const hardwareUpgradeRates = useMockDB((s) => s.hardwareUpgradeRates);

  const [activeTab, setActiveTab] = useState<HardwareComponentType>("ram");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TierFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<HardwareUpgradeRate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const ramRates = useMemo(
    () =>
      hardwareUpgradeRates
        .filter((r) => r.componentType === "ram")
        .sort((a, b) => a.order - b.order || (a.capacityGb ?? 0) - (b.capacityGb ?? 0)),
    [hardwareUpgradeRates]
  );

  const storageRates = useMemo(
    () =>
      hardwareUpgradeRates
        .filter((r) => r.componentType === "storage")
        .sort((a, b) => a.order - b.order || (a.capacityGb ?? 0) - (b.capacityGb ?? 0)),
    [hardwareUpgradeRates]
  );

  const openCreateDialog = (type: HardwareComponentType) => {
    setEditingId(null);
    setFormData({
      ...EMPTY_FORM,
      componentType: type,
    });
    setAttempted(false);
    setDialogOpen(true);
  };

  const openEditDialog = (rate: HardwareUpgradeRate) => {
    setEditingId(rate.id);
    setFormData({
      componentType: rate.componentType,
      label: rate.label,
      capacityGb: rate.capacityGb ? String(rate.capacityGb) : "",
      priceDelta: String(rate.priceDelta),
      active: rate.active,
    });
    setAttempted(false);
    setDialogOpen(true);
  };

  const labelError = !formData.label.trim() ? "اسم الفئة مطلوب" : undefined;
  const deltaNum = Number(formData.priceDelta);
  const priceDeltaError =
    isNaN(deltaNum) || deltaNum < 0 ? "فرق السعر يجب أن يكون رقماً موجباً أو صفراً" : undefined;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);

    if (labelError || priceDeltaError) return;

    setSubmitting(true);
    try {
      const payload = {
        componentType: formData.componentType,
        label: formData.label.trim(),
        capacityGb: formData.capacityGb ? parseInt(formData.capacityGb, 10) : null,
        priceDelta: deltaNum,
        active: formData.active,
      };

      if (editingId) {
        await repositories.hardwarePricing.update(editingId, payload);
        toast.success(`تم تحديث فئة ${payload.label} بنجاح`);
      } else {
        const currentList = formData.componentType === "ram" ? ramRates : storageRates;
        await repositories.hardwarePricing.create({
          ...payload,
          order: currentList.length,
        });
        toast.success(`تمت إضافة فئة ${payload.label} بنجاح`);
      }

      setDialogOpen(false);
    } catch {
      toast.error("تعذر حفظ فئة الترقية — تحقق من الاتصال");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (rate: HardwareUpgradeRate) => {
    const next = !rate.active;
    try {
      await repositories.hardwarePricing.update(rate.id, { active: next });
      toast.success(next ? `تم تفعيل فئة ${rate.label}` : `تم إيقاف فئة ${rate.label}`);
    } catch {
      toast.error("تعذر تغيير حالة الفئة");
    }
  };

  const handleMove = async (
    rate: HardwareUpgradeRate,
    direction: "up" | "down",
    list: HardwareUpgradeRate[]
  ) => {
    const idx = list.findIndex((r) => r.id === rate.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;

    const other = list[swapIdx];
    try {
      await repositories.hardwarePricing.update(rate.id, { order: other.order });
      await repositories.hardwarePricing.update(other.id, { order: rate.order });
      toast.success("تم تحديث ترتيب العرض");
    } catch {
      toast.error("تعذر تغيير الترتيب");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await repositories.hardwarePricing.remove(deleteTarget.id);
      toast.success(`تم حذف فئة ${deleteTarget.label}`);
      setDeleteTarget(null);
    } catch {
      toast.error("تعذر حذف الفئة");
    } finally {
      setDeleting(false);
    }
  };

  const renderTierList = (list: HardwareUpgradeRate[], type: HardwareComponentType) => {
    if (list.length === 0) {
      return (
        <EmptyState
          icon={type === "ram" ? Cpu : HardDrive}
          title={type === "ram" ? "لا توجد فئات رامات حالياً" : "لا توجد فئات تخزين حالياً"}
          hint="أضف فئات ترقية ليتمكن العملاء من تخصيص أجهزتهم مباشرة من صفحة المنتج."
          action={
            <Button
              onClick={() => openCreateDialog(type)}
              size="sm"
              className="gap-1.5 font-bold"
            >
              <Plus className="h-4 w-4" />
              إضافة فئة {type === "ram" ? "رام" : "تخزين"} جديدة
            </Button>
          }
        />
      );
    }

    return (
      <div className="space-y-4">
        {/* Desktop / Tablet Table */}
        <div className="hidden sm:block w-full overflow-x-auto rounded-2xl border border-hair bg-elevated shadow-card">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-hair bg-surface text-muted-foreground text-xs font-bold">
                <th className="py-3.5 px-4">الترتيب</th>
                <th className="py-3.5 px-4">الفئة والمسمى</th>
                <th className="py-3.5 px-4">السعة الرقمية</th>
                <th className="py-3.5 px-4">فرق السعر</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {list.map((rate, idx) => (
                <tr
                  key={rate.id}
                  className={cn(
                    "transition-colors hover:bg-surface/50",
                    !rate.active && "opacity-60 bg-surface/20"
                  )}
                >
                  {/* Order */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-20"
                        disabled={idx === 0}
                        onClick={() => handleMove(rate, "up", list)}
                        title="تحريك لأعلى"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-20"
                        disabled={idx === list.length - 1}
                        onClick={() => handleMove(rate, "down", list)}
                        title="تحريك لأسفل"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <span className="font-tech text-xs text-muted-foreground mr-1">#{rate.order}</span>
                    </div>
                  </td>

                  {/* Label */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-hair bg-surface text-primary">
                        {type === "ram" ? <Cpu className="h-4 w-4" /> : <HardDrive className="h-4 w-4" />}
                      </div>
                      <span className="font-bold text-foreground">{rate.label}</span>
                      {rate.priceDelta === 0 && (
                        <Badge variant="outline" className="text-[10px] py-0 border-hair text-muted-foreground">
                          الأساسي (Base)
                        </Badge>
                      )}
                    </div>
                  </td>

                  {/* Capacity */}
                  <td className="py-3 px-4 whitespace-nowrap font-tech text-sm text-foreground">
                    {rate.capacityGb ? `${rate.capacityGb} GB` : "—"}
                  </td>

                  {/* Price Delta */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={cn(
                        "font-tech font-bold text-sm",
                        rate.priceDelta === 0 ? "text-muted-foreground" : "text-primary"
                      )}
                    >
                      {rate.priceDelta > 0 ? `+${rate.priceDelta.toLocaleString()} ج.م` : "0 ج.م"}
                    </span>
                  </td>

                  {/* Active Switch */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rate.active}
                        onCheckedChange={() => handleToggleActive(rate)}
                        aria-label="تفعيل أو تعطيل الفئة"
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        {rate.active ? "مفعّل" : "متوقف"}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 whitespace-nowrap text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5 text-xs font-bold"
                        onClick={() => openEditDialog(rate)}
                      >
                        <Pencil className="h-3.5 w-3.5 ml-1" />
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2.5 text-xs font-bold text-danger hover:bg-danger/10 hover:text-danger"
                        onClick={() => setDeleteTarget(rate)}
                      >
                        <Trash2 className="h-3.5 w-3.5 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards (Responsive & Clean) */}
        <div className="grid grid-cols-1 gap-3 sm:hidden">
          {list.map((rate, idx) => (
            <div
              key={rate.id}
              className={cn(
                "rounded-2xl border border-hair bg-elevated p-4 shadow-card transition-all",
                !rate.active && "opacity-60"
              )}
            >
              <div className="flex items-center justify-between gap-2 border-b border-hair pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-hair bg-surface text-primary">
                    {type === "ram" ? <Cpu className="h-4 w-4" /> : <HardDrive className="h-4 w-4" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{rate.label}</h3>
                    {rate.capacityGb && (
                      <span className="text-[11px] text-muted-foreground font-tech">
                        {rate.capacityGb} GB
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={rate.active}
                    onCheckedChange={() => handleToggleActive(rate)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-3 text-sm">
                <span className="text-xs text-muted-foreground font-medium">فرق السعر:</span>
                <span
                  className={cn(
                    "font-tech font-bold text-base",
                    rate.priceDelta === 0 ? "text-muted-foreground" : "text-primary"
                  )}
                >
                  {rate.priceDelta > 0 ? `+${rate.priceDelta.toLocaleString()} ج.م` : "0 ج.م"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-hair">
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground"
                    disabled={idx === 0}
                    onClick={() => handleMove(rate, "up", list)}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground"
                    disabled={idx === list.length - 1}
                    onClick={() => handleMove(rate, "down", list)}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold"
                    onClick={() => openEditDialog(rate)}
                  >
                    <Pencil className="h-3.5 w-3.5 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs font-bold text-danger hover:bg-danger/10"
                    onClick={() => setDeleteTarget(rate)}
                  >
                    <Trash2 className="h-3.5 w-3.5 ml-1" />
                    حذف
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <SlidersHorizontal className="h-6 w-6 text-primary" />
            أسعار ترقية القطع (RAM & Storage)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            تحديد وإدارة فئات الرامات ووحدات التخزين، وفروق الأسعار الحية للابتوبات المتجر.
          </p>
        </div>

        <Button
          onClick={() => openCreateDialog(activeTab)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md self-start sm:self-auto rounded-xl h-11 px-5"
        >
          <Plus className="ml-1.5 h-4 w-4" />
          إضافة فئة {activeTab === "ram" ? "رام" : "تخزين"} جديدة
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-hair pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("ram")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all",
            activeTab === "ram"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-surface"
          )}
        >
          <Cpu className="h-4 w-4" />
          ترقيات الرام (RAM)
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
            {ramRates.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("storage")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all",
            activeTab === "storage"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-surface"
          )}
        >
          <HardDrive className="h-4 w-4" />
          ترقيات التخزين (SSD)
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
            {storageRates.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {activeTab === "ram" ? renderTierList(ramRates, "ram") : renderTierList(storageRates, "storage")}

      {/* ================= Add / Edit Dialog (Solid & Crystal Clear) ================= */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0 bg-elevated border border-hair text-right shadow-2xl rounded-2xl">
          <DialogHeader className="border-b border-hair bg-surface px-6 py-4.5 text-right">
            <DialogTitle className="text-lg font-bold text-foreground">
              {editingId ? "تعديل فئة الترقية" : "إضافة فئة ترقية جديدة"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              حدد المسمى والسعة وفارق السعر الإضافي بالجنيه المصري.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 p-6">
            {/* Component type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">نوع المكون *</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={cn(
                    "flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-all",
                    formData.componentType === "ram"
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-hair bg-surface text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setFormData((f) => ({ ...f, componentType: "ram" }))}
                >
                  <Cpu className="h-4 w-4" />
                  رام (RAM)
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-all",
                    formData.componentType === "storage"
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-hair bg-surface text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setFormData((f) => ({ ...f, componentType: "storage" }))}
                >
                  <HardDrive className="h-4 w-4" />
                  تخزين (SSD)
                </button>
              </div>
            </div>

            {/* Label */}
            <div className="space-y-1.5">
              <Label htmlFor="h-label" className="text-xs font-bold text-foreground">
                اسم الفئة والمسمى المعروض للعميل *
              </Label>
              <Input
                id="h-label"
                value={formData.label}
                onChange={(e) => setFormData((f) => ({ ...f, label: e.target.value }))}
                placeholder={
                  formData.componentType === "ram" ? "مثال: 16GB DDR4 أو 32GB" : "مثال: 512GB NVMe SSD"
                }
                className="bg-surface border-hair text-foreground font-semibold rounded-xl h-11 px-3.5 focus:border-primary"
              />
              <FieldError>{attempted ? labelError : undefined}</FieldError>
            </div>

            {/* Numeric Capacity & Price Delta */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="h-capacity" className="text-xs font-bold text-foreground">
                  السعة (GB)
                </Label>
                <Input
                  id="h-capacity"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.capacityGb}
                  onChange={(e) => setFormData((f) => ({ ...f, capacityGb: e.target.value }))}
                  placeholder={formData.componentType === "ram" ? "16" : "512"}
                  dir="ltr"
                  className="bg-surface border-hair text-foreground font-tech text-left font-bold rounded-xl h-11 px-3.5 focus:border-primary"
                />
                <span className="text-[10px] text-muted-foreground">للترتيب التلقائي</span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="h-price" className="text-xs font-bold text-foreground">
                  فرق السعر (ج.م) *
                </Label>
                <Input
                  id="h-price"
                  type="number"
                  min="0"
                  step="50"
                  value={formData.priceDelta}
                  onChange={(e) => setFormData((f) => ({ ...f, priceDelta: e.target.value }))}
                  placeholder="800"
                  dir="ltr"
                  className="bg-surface border-hair text-primary font-tech text-left font-bold rounded-xl h-11 px-3.5 focus:border-primary"
                />
                <FieldError>{attempted ? priceDeltaError : undefined}</FieldError>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-hair bg-surface p-3.5">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-foreground">تفعيل هذه الفئة</Label>
                <p className="text-xs text-muted-foreground">
                  تظهر مباشرة في خيارات الترقية بالمتجر.
                </p>
              </div>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData((f) => ({ ...f, active: checked }))}
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
                {editingId ? "حفظ التعديلات" : "إضافة الفئة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= Delete Confirmation Modal ================= */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="bg-elevated border border-hair text-right shadow-2xl rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-bold">
              حذف فئة الترقية؟
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              هل أنت متأكد من حذف فئة الترقية{" "}
              <strong className="text-foreground font-bold">{deleteTarget?.label}</strong>؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel disabled={deleting} className="rounded-xl font-bold">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-danger text-white hover:bg-danger/90 rounded-xl font-bold"
            >
              {deleting && <Loader2 className="ml-1.5 h-4 w-4 animate-spin" />}
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default HardwarePricingManager;
