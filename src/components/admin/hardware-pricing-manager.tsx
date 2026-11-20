"use client";

/**
 * ============================================================
 * HYPER TECH — Admin Hardware Pricing Manager
 * ============================================================
 * Dedicated UI to view, add, edit, reorder, toggle active, and
 * delete RAM and Storage upgrade tiers.
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const labelError = !formData.label.trim() ? "يرجى إدخال اسم الفئة" : "";
  const priceDeltaError =
    formData.priceDelta === "" || isNaN(Number(formData.priceDelta)) || Number(formData.priceDelta) < 0
      ? "يرجى إدخال سعر فرق الترقية بشكل صحيح"
      : "";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (labelError || priceDeltaError) return;

    setSubmitting(true);
    try {
      const payload = {
        componentType: formData.componentType,
        label: formData.label.trim(),
        capacityGb: formData.capacityGb.trim() ? parseInt(formData.capacityGb.trim(), 10) : null,
        priceDelta: parseFloat(formData.priceDelta) || 0,
        active: formData.active,
        order: 0,
      };

      if (editingId) {
        await repositories.hardwarePricing.update(editingId, payload);
        toast.success("تم تحديث فئة الترقية بنجاح");
      } else {
        await repositories.hardwarePricing.create(payload);
        toast.success("تمت إضافة فئة الترقية بنجاح");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "فشل حفظ فئة الترقية");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (rate: HardwareUpgradeRate) => {
    try {
      await repositories.hardwarePricing.update(rate.id, { active: !rate.active });
      toast.success(rate.active ? "تم تعطيل فئة الترقية" : "تم تفعيل فئة الترقية");
    } catch (err: any) {
      toast.error("فشل تغيير حالة التفعيل");
    }
  };

  const handleMove = async (
    rate: HardwareUpgradeRate,
    direction: "up" | "down",
    list: HardwareUpgradeRate[]
  ) => {
    const idx = list.findIndex((r) => r.id === rate.id);
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || targetIdx < 0 || targetIdx >= list.length) return;

    const other = list[targetIdx];
    try {
      await Promise.all([
        repositories.hardwarePricing.update(rate.id, { order: other.order }),
        repositories.hardwarePricing.update(other.id, { order: rate.order }),
      ]);
      toast.success("تم تعديل الترتيب");
    } catch (err: any) {
      toast.error("فشل حفظ الترتيب الجديد");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await repositories.hardwarePricing.remove(deleteTarget.id);
      toast.success("تم حذف فئة الترقية بنجاح");
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.message || "فشل حذف فئة الترقية");
    } finally {
      setDeleting(false);
    }
  };

  const renderTierTable = (list: HardwareUpgradeRate[], type: HardwareComponentType) => {
    if (!list.length) {
      return (
        <EmptyState
          icon={type === "ram" ? Cpu : HardDrive}
          title={`لا توجد خيارات ترقية لـ ${type === "ram" ? "الرام (RAM)" : "التخزين (SSD)"}`}
          description="أضف فئات الترقية والأسعار الإضافية لتظهر للعملاء في صفحة المنتج."
          action={
            <Button
              onClick={() => openCreateDialog(type)}
              className="bg-brand-blue hover:bg-brand-blue-hover text-white font-medium"
            >
              <Plus className="ml-2 h-4 w-4" />
              إضافة فئة جديدة
            </Button>
          }
        />
      );
    }

    return (
      <div className="w-full max-w-full overflow-x-auto rounded-xl border border-hair bg-panel/70 backdrop-blur-sm shadow-sm">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b border-hair bg-surface/50 text-faint">
              <th className="py-3.5 px-4 font-semibold text-foreground">الترتيب</th>
              <th className="py-3.5 px-4 font-semibold text-foreground">الفئة / السعة</th>
              <th className="py-3.5 px-4 font-semibold text-foreground">سعة GB</th>
              <th className="py-3.5 px-4 font-semibold text-foreground">فرق السعر (EGP)</th>
              <th className="py-3.5 px-4 font-semibold text-foreground">الحالة</th>
              <th className="py-3.5 px-4 text-left font-semibold text-foreground">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hair/60">
            {list.map((rate, idx) => (
              <tr
                key={rate.id}
                className={cn(
                  "transition-colors hover:bg-surface/40",
                  !rate.active && "opacity-60 bg-surface/10"
                )}
              >
                {/* Reorder arrows */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      disabled={idx === 0}
                      onClick={() => handleMove(rate, "up", list)}
                      title="تحريك لأعلى"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      disabled={idx === list.length - 1}
                      onClick={() => handleMove(rate, "down", list)}
                      title="تحريك لأسفل"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <span className="font-tech text-xs text-faint mr-1">#{rate.order}</span>
                  </div>
                </td>

                {/* Label */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {type === "ram" ? (
                      <Cpu className="h-4 w-4 text-brand-blue shrink-0" />
                    ) : (
                      <HardDrive className="h-4 w-4 text-brand-cyan shrink-0" />
                    )}
                    <span className="font-medium text-foreground">{rate.label}</span>
                    {rate.priceDelta === 0 && (
                      <Badge variant="outline" className="text-[10px] py-0 border-hair text-faint">
                        أساسي (Base)
                      </Badge>
                    )}
                  </div>
                </td>

                {/* Capacity */}
                <td className="py-3 px-4 whitespace-nowrap font-tech text-sm text-muted-foreground">
                  {rate.capacityGb ? `${rate.capacityGb} GB` : "—"}
                </td>

                {/* Price Delta */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span
                    className={cn(
                      "font-tech font-bold text-sm",
                      rate.priceDelta === 0
                        ? "text-faint"
                        : "text-brand-cyan drop-shadow-[0_0_8px_rgba(0,217,255,0.25)]"
                    )}
                  >
                    {rate.priceDelta > 0 ? `+${rate.priceDelta.toLocaleString()} ج.م` : "0 ج.م"}
                  </span>
                </td>

                {/* Active switch */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rate.active}
                      onCheckedChange={() => handleToggleActive(rate)}
                      aria-label="تفعيل أو تعطيل الفئة"
                    />
                    <span className="text-xs text-muted-foreground">
                      {rate.active ? "نشط" : "معطل"}
                    </span>
                  </div>
                </td>

                {/* Actions */}
                <td className="py-3 px-4 whitespace-nowrap text-left">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-muted-foreground hover:text-foreground"
                      onClick={() => openEditDialog(rate)}
                    >
                      <Pencil className="h-3.5 w-3.5 ml-1" />
                      تعديل
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-destructive hover:bg-destructive/10"
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
    );
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <SlidersHorizontal className="h-6 w-6 text-brand-blue" />
            أسعار ترقية القطع (RAM & Storage)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            إدارة فئات الرامات ووحدات التخزين، وفروق الأسعار الحية للابتوبات والأجهزة القابلة للترقية.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => openCreateDialog(activeTab)}
            className="bg-brand-blue hover:bg-brand-blue-hover text-white shadow-md shadow-brand-blue/20"
          >
            <Plus className="ml-2 h-4 w-4" />
            إضافة فئة {activeTab === "ram" ? "رام" : "تخزين"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as HardwareComponentType)}
        className="w-full space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-panel border border-hair">
          <TabsTrigger
            value="ram"
            className="flex items-center gap-2 data-[state=active]:bg-brand-blue data-[state=active]:text-white font-medium"
          >
            <Cpu className="h-4 w-4" />
            ترقيات الرام (RAM)
            <Badge variant="secondary" className="mr-1 text-xs">
              {ramRates.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="storage"
            className="flex items-center gap-2 data-[state=active]:bg-brand-blue data-[state=active]:text-white font-medium"
          >
            <HardDrive className="h-4 w-4" />
            ترقيات التخزين (SSD)
            <Badge variant="secondary" className="mr-1 text-xs">
              {storageRates.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ram" className="space-y-4 focus-visible:outline-none">
          {renderTierTable(ramRates, "ram")}
        </TabsContent>

        <TabsContent value="storage" className="space-y-4 focus-visible:outline-none">
          {renderTierTable(storageRates, "storage")}
        </TabsContent>
      </Tabs>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0 bg-panel border-hair text-right">
          <DialogHeader className="border-b border-hair px-6 py-4">
            <DialogTitle className="text-foreground">
              {editingId ? "تعديل فئة الترقية" : "إضافة فئة ترقية جديدة"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              حدد اسم الفئة وسعتها وفارق السعر الإضافي بالجنيه المصري.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 p-6">
            <div className="space-y-1.5">
              <Label htmlFor="h-type">نوع المكون *</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={formData.componentType === "ram" ? "default" : "outline"}
                  className={cn(
                    "w-full justify-center gap-2",
                    formData.componentType === "ram" && "bg-brand-blue text-white"
                  )}
                  onClick={() => setFormData((f) => ({ ...f, componentType: "ram" }))}
                >
                  <Cpu className="h-4 w-4" />
                  رام (RAM)
                </Button>
                <Button
                  type="button"
                  variant={formData.componentType === "storage" ? "default" : "outline"}
                  className={cn(
                    "w-full justify-center gap-2",
                    formData.componentType === "storage" && "bg-brand-blue text-white"
                  )}
                  onClick={() => setFormData((f) => ({ ...f, componentType: "storage" }))}
                >
                  <HardDrive className="h-4 w-4" />
                  تخزين (SSD)
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="h-label">اسم الفئة أو المسمى *</Label>
              <Input
                id="h-label"
                value={formData.label}
                onChange={(e) => setFormData((f) => ({ ...f, label: e.target.value }))}
                placeholder={
                  formData.componentType === "ram" ? "مثال: 16GB DDR4 أو 32GB DDR5" : "مثال: 1TB NVMe M.2 SSD"
                }
                dir="ltr"
                className="text-right font-tech"
              />
              <FieldError>{attempted ? labelError : undefined}</FieldError>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="h-capacity">السعة الرقمية (GB)</Label>
                <Input
                  id="h-capacity"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.capacityGb}
                  onChange={(e) => setFormData((f) => ({ ...f, capacityGb: e.target.value }))}
                  placeholder={formData.componentType === "ram" ? "16" : "1000"}
                  dir="ltr"
                  className="font-tech text-left"
                />
                <p className="text-[10px] text-faint">للترتيب التلقائي (مثال: 16 أو 512 أو 1000)</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="h-price">فارق السعر الإضافي (ج.م) *</Label>
                <Input
                  id="h-price"
                  type="number"
                  min="0"
                  step="50"
                  value={formData.priceDelta}
                  onChange={(e) => setFormData((f) => ({ ...f, priceDelta: e.target.value }))}
                  placeholder="800"
                  dir="ltr"
                  className="font-tech text-left font-bold text-brand-cyan"
                />
                <FieldError>{attempted ? priceDeltaError : undefined}</FieldError>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-hair bg-surface/50 p-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">تفعيل هذه الفئة</Label>
                <p className="text-xs text-muted-foreground">
                  عند التفعيل، تظهر الفئة فوراً في خيارات الترقية للمنتجات.
                </p>
              </div>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData((f) => ({ ...f, active: checked }))}
              />
            </div>

            <DialogFooter className="gap-2 pt-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-brand-blue hover:bg-brand-blue-hover text-white"
              >
                {submitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {editingId ? "حفظ التعديلات" : "إضافة الفئة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="bg-panel border-hair text-right">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">حذف فئة الترقية؟</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              هل أنت متأكد من حذف فئة الترقية{" "}
              <strong className="text-foreground">{deleteTarget?.label}</strong>؟ لن تظهر مجدداً في
              قائمة خيارات الترقية بالمتجر.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default HardwarePricingManager;
