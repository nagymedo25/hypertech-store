"use client";

/**
 * ============================================================
 * HYPER TECH — Admin Products Manager
 * ============================================================
 * The heart of the mock dashboard. Creation is deliberately
 * EXTREMELY simple ("أقل خطوات. أقصى وضوح"): one dialog, logical
 * groups, honest validation, live image previews and a dynamic
 * specs editor. All mutations go through the async repositories
 * so pending states are real.
 * ============================================================
 */

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  FileSpreadsheet,
  FileText,
  HardDrive,
  Image as ImageIcon,
  Loader2,
  ListTree,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useMockDB } from "@/lib/store/db-store";
import { repositories } from "@/lib/repositories";
import { AVAILABILITY_META } from "@/lib/format";
import { AvailabilityBadge, PriceTag } from "@/components/store/catalog-atoms";
import { EmptyState, FieldError, FormSectionTitle } from "./admin-shell";
import { ImageUpload } from "./image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Product, ProductAvailability, SpecItem, SpecLayout } from "@/types";

/* ------------------------------- Form model ------------------------------- */

interface SpecRow {
  key: string;
  label: string;
  value: string;
}

interface ProductForm {
  name: string;
  brand: string;
  categoryId: string;
  price: string;
  oldPrice: string;
  promotionalLabel: string;
  availability: ProductAvailability;
  stockQty: string;
  shortDescription: string;
  description: string;
  featured: boolean;
  isNew: boolean;
  /** Confirmed image urls only — the upload widget owns the flow. */
  images: string[];
  specs: SpecRow[];
  specLayout: SpecLayout;
  baseRam: string;
  baseStorage: string;
  allowRamUpgrade: boolean;
  allowStorageUpgrade: boolean;
  customHardwarePricing: Record<string, number>;
}

const rowId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const EMPTY_FORM: ProductForm = {
  name: "",
  brand: "",
  categoryId: "",
  price: "",
  oldPrice: "",
  promotionalLabel: "",
  availability: "in-stock",
  stockQty: "0",
  shortDescription: "",
  description: "",
  featured: false,
  isNew: true,
  images: [],
  specs: [],
  specLayout: "device",
  baseRam: "",
  baseStorage: "",
  allowRamUpgrade: false,
  allowStorageUpgrade: false,
  customHardwarePricing: {},
};

type ProductErrors = Partial<
  Record<"name" | "categoryId" | "price" | "oldPrice" | "stockQty", string>
>;

function validateForm(f: ProductForm): ProductErrors {
  const errors: ProductErrors = {};
  if (!f.name.trim()) errors.name = "اسم المنتج مطلوب";
  if (!f.categoryId) errors.categoryId = "اختر فئة للمنتج";
  const price = Number(f.price);
  if (f.price.trim() === "" || Number.isNaN(price) || price < 0) {
    errors.price = "أدخل سعرًا صحيحًا (صفر أو أكثر)";
  }
  if (f.oldPrice.trim()) {
    const oldPrice = Number(f.oldPrice);
    if (Number.isNaN(oldPrice) || oldPrice <= price) {
      errors.oldPrice = "لازم يكون أكبر من السعر الحالي";
    }
  }
  const qty = Number(f.stockQty || "0");
  if (Number.isNaN(qty) || qty < 0) errors.stockQty = "أدخل كمية صحيحة";
  return errors;
}

const AVAILABILITY_OPTIONS = Object.entries(AVAILABILITY_META).map(([value, meta]) => ({
  value: value as ProductAvailability,
  label: meta.label,
}));

const SPEC_LAYOUTS: { value: SpecLayout; label: string; hint: string }[] = [
  {
    value: "device",
    label: "جهاز كامل",
    hint: "لابتوب / كمبيوتر جاهز — المعالج، الرام، التخزين، الشاشة…",
  },
  {
    value: "component",
    label: "قطعة / مكون",
    hint: "كارت شاشة، رام، SSD، لوحة أم… — وضّح الموديل والتفاصيل الفنية",
  },
  {
    value: "accessory",
    label: "اكسسوار",
    hint: "كيبورد، ماوس، سماعة… — التوصيل، البطارية، اللغة والإضاءة",
  },
];

/* -------------------------------- Component ------------------------------- */

export default function ProductsManager() {
  const products = useMockDB((s) => s.products);
  const categories = useMockDB((s) => s.categories);
  const hardwareUpgradeRates = useMockDB((s) => s.hardwareUpgradeRates);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [starPendingId, setStarPendingId] = useState<string | null>(null);

  /* ---------------------- CSV / Excel Import State ---------------------- */
  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [clearExisting, setClearExisting] = useState(false);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importPending, setImportPending] = useState(false);

  const handlePreview = async () => {
    if (!csvText.trim()) {
      toast.error("يرجى إدخال أو لصق محتوى ملف الـ CSV أولاً");
      return;
    }
    setImportPending(true);
    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ csvText, preview: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل التحقق من الملف");
      setImportPreview(data.report);
      toast.success("تم تحليل الكشف بنجاح", {
        description: `تم تجهيز ${data.report.processed} منتج صالح للاستيراد.`,
      });
    } catch (err: any) {
      toast.error("خطأ في التحقق من الملف", { description: err.message });
    } finally {
      setImportPending(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!csvText.trim()) return;
    setImportPending(true);
    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ csvText, preview: false, clearExisting }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تنفيذ الاستيراد");
      toast.success("اكتمل الاستيراد بنجاح! 🚀", {
        description: `تم إدراج ${data.report.processed} منتج في قاعدة بيانات المتجر.`,
      });
      setImportOpen(false);
      setCsvText("");
      setImportPreview(null);
      window.location.reload();
    } catch (err: any) {
      toast.error("فشل تنفيذ الاستيراد", { description: err.message });
    } finally {
      setImportPending(false);
    }
  };

  const errors = validateForm(form);
  const invalid = Object.keys(errors).length > 0;

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories],
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  /* ------------------------------ Dialog open ----------------------------- */

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setAttempted(false);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      brand: p.brand,
      categoryId: p.categoryId,
      price: String(p.price),
      oldPrice: p.oldPrice != null ? String(p.oldPrice) : "",
      promotionalLabel: p.promotionalLabel ?? "",
      availability: p.availability,
      stockQty: String(p.stockQty),
      shortDescription: p.shortDescription,
      description: p.description,
      featured: p.featured,
      isNew: p.isNew,
      images: [...p.images],
      specs: p.specs.map((s) => ({ key: rowId(), label: s.label, value: s.value })),
      specLayout: p.specLayout,
      baseRam: p.baseRam ?? "",
      baseStorage: p.baseStorage ?? "",
      allowRamUpgrade: p.allowRamUpgrade ?? false,
      allowStorageUpgrade: p.allowStorageUpgrade ?? false,
      customHardwarePricing: (p.customHardwarePricing as Record<string, number>) ?? {},
    });
    setAttempted(false);
    setDialogOpen(true);
  };

  const setField = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  /* ------------------------------ Specs editor ---------------------------- */

  const addSpec = () =>
    setForm((f) => ({ ...f, specs: [...f.specs, { key: rowId(), label: "", value: "" }] }));

  const updateSpec = (key: string, field: "label" | "value", value: string) =>
    setForm((f) => ({
      ...f,
      specs: f.specs.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    }));

  const removeSpec = (key: string) =>
    setForm((f) => ({ ...f, specs: f.specs.filter((r) => r.key !== key) }));

  const setCustomPrice = (tierLabel: string, priceStr: string) => {
    setForm((f) => {
      const copy = { ...f.customHardwarePricing };
      if (priceStr.trim() === "") {
        delete copy[tierLabel];
      } else {
        const num = parseFloat(priceStr);
        if (!isNaN(num) && num >= 0) {
          copy[tierLabel] = num;
        }
      }
      return { ...f, customHardwarePricing: copy };
    });
  };

  /* --------------------------------- Submit -------------------------------- */

  const submit = async () => {
    if (invalid) {
      setAttempted(true);
      return;
    }
    setPending(true);
    try {
      const price = Number(form.price);
      const oldPrice = form.oldPrice.trim() ? Number(form.oldPrice) : undefined;
      const stockQty = Math.max(0, Math.floor(Number(form.stockQty || "0") || 0));
      const specs: SpecItem[] = form.specs
        .filter((r) => r.label.trim() && r.value.trim())
        .map((r) => ({ label: r.label.trim(), value: r.value.trim() }));

      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        categoryId: form.categoryId,
        price,
        oldPrice,
        promotionalLabel: form.promotionalLabel.trim() || undefined,
        availability: form.availability,
        stockQty,
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        images: form.images.filter(Boolean),
        featured: form.featured,
        isNew: form.isNew,
        specs,
        specLayout: form.specLayout,
        rating: editing?.rating ?? 0,
        baseRam: form.baseRam.trim() || undefined,
        baseStorage: form.baseStorage.trim() || undefined,
        allowRamUpgrade: form.allowRamUpgrade,
        allowStorageUpgrade: form.allowStorageUpgrade,
        customHardwarePricing:
          Object.keys(form.customHardwarePricing).length > 0 ? form.customHardwarePricing : undefined,
      };

      if (editing) {
        await repositories.products.update(editing.id, payload);
        toast.success("تم تحديث المنتج");
      } else {
        await repositories.products.create(payload);
        toast.success("تمت إضافة المنتج للكتالوج");
      }
      setDialogOpen(false);
    } catch {
      toast.error("حدث خطأ غير متوقع — جرّب تاني");
    } finally {
      setPending(false);
    }
  };

  /* ------------------------------- Row actions ----------------------------- */

  const toggleFeatured = async (p: Product) => {
    if (starPendingId) return;
    setStarPendingId(p.id);
    try {
      await repositories.products.update(p.id, { featured: !p.featured });
      toast.success(p.featured ? "تم إلغاء تمييز المنتج" : "تم تمييز المنتج");
    } catch {
      toast.error("تعذر تحديث المنتج");
    } finally {
      setStarPendingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await repositories.products.remove(deleteTarget.id);
      toast.success(`تم حذف «${deleteTarget.name}»`);
      setDeleteTarget(null);
    } catch {
      toast.error("تعذر حذف المنتج");
    } finally {
      setDeleting(false);
    }
  };

  /* --------------------------------- Render -------------------------------- */

  const specLayoutHint = SPEC_LAYOUTS.find((l) => l.value === form.specLayout)?.hint;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">المنتجات</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-tech">{products.length}</span> منتج في الكتالوج — التعديلات بتتت
            محفوظة في قاعدة البيانات وبتظهر في المتجر فورًا
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
            className="min-h-9 gap-2 border-hair bg-elevated hover:bg-surface text-foreground"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" aria-hidden />
            استيراد كشف Excel / CSV
          </Button>
          <Button onClick={openCreate} className="min-h-9 glow-accent-sm">
            <Plus className="h-4 w-4" aria-hidden />
            إضافة منتج
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="لا توجد منتجات في الكتالوج"
          hint="اضغط «إضافة منتج» لبدء أول منتج — أو استعِد البيانات التجريبية."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-hair bg-surface/60 lg:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[38%]">المنتج</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>التوفر</TableHead>
                  <TableHead className="text-center">مميز</TableHead>
                  <TableHead className="w-28 text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const cat = categoryMap.get(p.categoryId);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {p.images[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              loading="lazy"
                              className="img-grade h-12 w-12 shrink-0 rounded-lg border border-hair bg-[#0d0f13] object-cover"
                            />
                          ) : (
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-hair bg-elevated text-faint">
                              <Package className="h-5 w-5" aria-hidden />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{p.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {p.brand}
                              {p.isNew ? <span className="text-primary"> • جديد</span> : null}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {cat ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-hair bg-raised px-2.5 py-1 text-xs">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: cat.accent }}
                              aria-hidden
                            />
                            {cat.name}
                          </span>
                        ) : (
                          <span className="text-xs text-faint">بدون فئة</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <PriceTag price={p.price} oldPrice={p.oldPrice} size="sm" animate={false} />
                      </TableCell>
                      <TableCell>
                        <AvailabilityBadge status={p.availability} />
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          type="button"
                          onClick={() => toggleFeatured(p)}
                          disabled={starPendingId === p.id}
                          aria-label={p.featured ? "إلغاء تمييز المنتج" : "تمييز المنتج"}
                          aria-pressed={p.featured}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent transition-colors hover:border-hair hover:bg-foreground/[0.05] disabled:opacity-50"
                        >
                          {starPendingId === p.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
                          ) : (
                            <Star
                              className={cn(
                                "h-4 w-4",
                                p.featured ? "fill-amber text-amber" : "text-faint",
                              )}
                              aria-hidden
                            />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(p)}
                            aria-label={`تعديل المنتج ${p.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(p)}
                            aria-label={`حذف المنتج ${p.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-danger/80 transition-colors hover:bg-danger/10 hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {products.map((p) => {
              const cat = categoryMap.get(p.categoryId);
              return (
                <li key={p.id} className="rounded-2xl border border-hair bg-surface/60 p-4">
                  <div className="flex items-start gap-3">
                    {p.images[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        loading="lazy"
                        className="img-grade h-14 w-14 shrink-0 rounded-lg border border-hair bg-[#0d0f13] object-cover"
                      />
                    ) : (
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-hair bg-elevated text-faint">
                        <Package className="h-5 w-5" aria-hidden />
                      </span>
                    )}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.brand}
                        {p.isNew ? <span className="text-primary"> • جديد</span> : null}
                      </p>
                      {cat ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-hair bg-raised px-2.5 py-0.5 text-[0.68rem]">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: cat.accent }}
                            aria-hidden
                          />
                          {cat.name}
                        </span>
                      ) : (
                        <span className="text-[0.68rem] text-faint">بدون فئة</span>
                      )}
                      <PriceTag price={p.price} oldPrice={p.oldPrice} size="sm" animate={false} />
                      <AvailabilityBadge status={p.availability} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-hair pt-3">
                    <button
                      type="button"
                      onClick={() => toggleFeatured(p)}
                      disabled={starPendingId === p.id}
                      aria-label={p.featured ? "إلغاء تمييز المنتج" : "تمييز المنتج"}
                      aria-pressed={p.featured}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-transparent transition-colors hover:border-hair hover:bg-foreground/[0.05] disabled:opacity-50"
                    >
                      {starPendingId === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
                      ) : (
                        <Star
                          className={cn(
                            "h-4 w-4",
                            p.featured ? "fill-amber text-amber" : "text-faint",
                          )}
                          aria-hidden
                        />
                      )}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        aria-label={`تعديل المنتج ${p.name}`}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(p)}
                        aria-label={`حذف المنتج ${p.name}`}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-danger/80 transition-colors hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* ------------------------- Create / Edit dialog ------------------------ */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setAttempted(false);
        }}
      >
        <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0 bg-elevated text-foreground border border-hair shadow-2xl rounded-2xl">
          <DialogHeader className="space-y-1 border-b border-hair px-6 py-4 text-right">
            <DialogTitle>{editing ? "تعديل منتج" : "إضافة منتج جديد"}</DialogTitle>
            <DialogDescription>
              الحقول المعلَّمة بـ <span className="text-danger">*</span> مطلوبة — الباقي اختياري.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[62vh]">
            <div className="space-y-6 px-6 py-5">
              {/* Basics */}
              <FormSectionTitle icon={Package}>الأساسيات</FormSectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="p-name">اسم المنتج *</Label>
                  <Input
                    id="p-name"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="مثال: لابتوب ASUS TUF Gaming F15"
                  />
                  <FieldError>{attempted ? errors.name : undefined}</FieldError>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="p-brand">الماركة</Label>
                  <Input
                    id="p-brand"
                    value={form.brand}
                    onChange={(e) => setField("brand", e.target.value)}
                    placeholder="ASUS"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="p-category">الفئة *</Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(v) => setField("categoryId", v)}
                  >
                    <SelectTrigger id="p-category" className="w-full">
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: c.accent || "#0284c7" }}
                              aria-hidden
                            />
                            <span>{c.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{attempted ? errors.categoryId : undefined}</FieldError>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="p-price">السعر (ج.م) *</Label>
                  <Input
                    id="p-price"
                    type="number"
                    min={0}
                    dir="ltr"
                    className="font-tech"
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value)}
                    placeholder="24999"
                  />
                  <FieldError>{attempted ? errors.price : undefined}</FieldError>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="p-oldprice">السعر قبل الخصم</Label>
                  <Input
                    id="p-oldprice"
                    type="number"
                    min={0}
                    dir="ltr"
                    className="font-tech"
                    value={form.oldPrice}
                    onChange={(e) => setField("oldPrice", e.target.value)}
                    placeholder="27999"
                  />
                  <FieldError>{attempted ? errors.oldPrice : undefined}</FieldError>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="p-promo">وسم ترويجي</Label>
                  <Input
                    id="p-promo"
                    value={form.promotionalLabel}
                    onChange={(e) => setField("promotionalLabel", e.target.value)}
                    placeholder="عرض الجمعة البيضاء"
                  />
                  <p className="text-[0.68rem] text-faint">شارة صغيرة تظهر مع السعر في المتجر</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="p-availability">حالة التوفر</Label>
                  <Select
                    value={form.availability}
                    onValueChange={(v) => setField("availability", v as ProductAvailability)}
                  >
                    <SelectTrigger id="p-availability" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABILITY_OPTIONS.map((a) => (
                        <SelectItem key={a.value} value={a.value}>
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="p-stock">الكمية بالمخزن</Label>
                  <Input
                    id="p-stock"
                    type="number"
                    min={0}
                    dir="ltr"
                    className="font-tech"
                    value={form.stockQty}
                    onChange={(e) => setField("stockQty", e.target.value)}
                    placeholder="0"
                  />
                  <FieldError>{attempted ? errors.stockQty : undefined}</FieldError>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="p-short">وصف قصير</Label>
                  <Textarea
                    id="p-short"
                    rows={2}
                    value={form.shortDescription}
                    onChange={(e) => setField("shortDescription", e.target.value)}
                    placeholder="سطر واحد يظهر في كروت المنتج بالمتجر"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="p-desc">الوصف الكامل</Label>
                  <Textarea
                    id="p-desc"
                    rows={4}
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="تفاصيل المنتج و أبرز مميزاته…"
                  />
                </div>
              </div>

              {/* Flags */}
              <FormSectionTitle icon={Sparkles}>الخصائص</FormSectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-hair bg-elevated/40 p-3.5">
                  <div>
                    <Label htmlFor="p-featured" className="text-sm font-medium">
                      منتج مميز
                    </Label>
                    <p className="text-[0.68rem] text-faint">يظهر في قسم المميزة بالصفحة الرئيسية</p>
                  </div>
                  <Switch
                    id="p-featured"
                    checked={form.featured}
                    onCheckedChange={(v) => setField("featured", v)}
                    aria-label="تمييز المنتج"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-hair bg-elevated/40 p-3.5">
                  <div>
                    <Label htmlFor="p-isnew" className="text-sm font-medium">
                      وسم «جديد»
                    </Label>
                    <p className="text-[0.68rem] text-faint">شارة جديدة تظهر على كارت المنتج</p>
                  </div>
                  <Switch
                    id="p-isnew"
                    checked={form.isNew}
                    onCheckedChange={(v) => setField("isNew", v)}
                    aria-label="وسم جديد للمنتج"
                  />
                </div>
              </div>

              {/* Hardware Upgrades */}
              <FormSectionTitle icon={Cpu}>ترقيات العتاد والقطع (RAM & Storage)</FormSectionTitle>
              <div className="space-y-4 rounded-xl border border-hair bg-elevated/30 p-4">
                <p className="text-xs text-muted-foreground">
                  مخصص للابتوبات والأجهزة: يسمح للعميل باختيار سعة الرام والتخزين وتحديث السعر تلقائياً أثناء الشراء.
                </p>

                {/* Toggles */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-hair bg-surface p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="p-allow-ram" className="text-sm font-medium flex items-center gap-1.5">
                        <Cpu className="h-4 w-4 text-primary" />
                        تفعيل ترقية الرام (RAM)
                      </Label>
                      <p className="text-[10px] text-faint">إتاحة خيارات زيادة الرام بالمتجر</p>
                    </div>
                    <Switch
                      id="p-allow-ram"
                      checked={form.allowRamUpgrade}
                      onCheckedChange={(v) => setField("allowRamUpgrade", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-xl border border-hair bg-surface p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="p-allow-storage" className="text-sm font-medium flex items-center gap-1.5">
                        <HardDrive className="h-4 w-4 text-primary" />
                        تفعيل ترقية التخزين (SSD)
                      </Label>
                      <p className="text-[10px] text-faint">إتاحة خيارات زيادة الـ SSD بالمتجر</p>
                    </div>
                    <Switch
                      id="p-allow-storage"
                      checked={form.allowStorageUpgrade}
                      onCheckedChange={(v) => setField("allowStorageUpgrade", v)}
                    />
                  </div>
                </div>

                {/* Base specs */}
                {(form.allowRamUpgrade || form.allowStorageUpgrade) && (
                  <div className="space-y-4 pt-2 border-t border-hair/60">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="p-base-ram">الرام الأساسي (المضمن بالسعر)</Label>
                        <Input
                          id="p-base-ram"
                          value={form.baseRam}
                          onChange={(e) => setField("baseRam", e.target.value)}
                          placeholder="مثال: 8GB أو 16GB"
                          dir="ltr"
                          className="font-tech text-right"
                        />
                        <p className="text-[10px] text-faint">هذا الخيار يكون سعره الإضافي 0 ج.م</p>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="p-base-storage">التخزين الأساسي (المضمن بالسعر)</Label>
                        <Input
                          id="p-base-storage"
                          value={form.baseStorage}
                          onChange={(e) => setField("baseStorage", e.target.value)}
                          placeholder="مثال: 512GB SSD أو 1TB SSD"
                          dir="ltr"
                          className="font-tech text-right"
                        />
                        <p className="text-[10px] text-faint">هذا الخيار يكون سعره الإضافي 0 ج.م</p>
                      </div>
                    </div>

                    {/* Custom Pricing Overrides */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                        تخصيص أسعار الترقية لهذا المنتج (اختياري)
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        إذا تُرِك الحقل فارغاً، سيتم اعتماد السعر العام التلقائي المحدد في إعدادات أسعار الترقية.
                      </p>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {form.allowRamUpgrade && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-primary">خيارات الرام (RAM):</span>
                            {hardwareUpgradeRates
                              .filter((r) => r.componentType === "ram" && r.active)
                              .map((rate) => {
                                const currentOverride = form.customHardwarePricing[rate.label];
                                return (
                                  <div
                                    key={rate.id}
                                    className="flex items-center justify-between gap-2 rounded-lg border border-hair bg-surface px-3 py-1.5 text-xs"
                                  >
                                    <span className="font-tech font-medium">{rate.label}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-faint font-tech">
                                        العام: +{rate.priceDelta} ج.م
                                      </span>
                                      <Input
                                        type="number"
                                        min="0"
                                        placeholder={String(rate.priceDelta)}
                                        value={currentOverride !== undefined ? String(currentOverride) : ""}
                                        onChange={(e) => setCustomPrice(rate.label, e.target.value)}
                                        className="h-7 w-24 text-left font-tech text-xs"
                                        dir="ltr"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}

                        {form.allowStorageUpgrade && (
                          <div className="space-y-1.5 pt-2">
                            <span className="text-[11px] font-bold text-foreground">خيارات التخزين (SSD):</span>
                            {hardwareUpgradeRates
                              .filter((r) => r.componentType === "storage" && r.active)
                              .map((rate) => {
                                const currentOverride = form.customHardwarePricing[rate.label];
                                return (
                                  <div
                                    key={rate.id}
                                    className="flex items-center justify-between gap-2 rounded-lg border border-hair bg-surface px-3 py-1.5 text-xs"
                                  >
                                    <span className="font-tech font-medium">{rate.label}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-faint font-tech">
                                        العام: +{rate.priceDelta} ج.م
                                      </span>
                                      <Input
                                        type="number"
                                        min="0"
                                        placeholder={String(rate.priceDelta)}
                                        value={currentOverride !== undefined ? String(currentOverride) : ""}
                                        onChange={(e) => setCustomPrice(rate.label, e.target.value)}
                                        className="h-7 w-24 text-left font-tech text-xs"
                                        dir="ltr"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Images — signed direct upload to Cloudinary + URL paste */}
              <FormSectionTitle icon={ImageIcon}>الصور</FormSectionTitle>
              <div className="space-y-2">
                <ImageUpload
                  folder="hypertech/store"
                  aspect="gallery"
                  value={form.images}
                  onChange={(images) => setField("images", images)}
                  label="صور المنتج"
                  max={8}
                />
                <p className="text-[0.68rem] text-faint">
                  أول صورة هي الرئيسية في المتجر — اسحب الصور وافلتها للرفع المباشر أو الصق روابط.
                </p>
              </div>

              {/* Specs */}
              <FormSectionTitle icon={ListTree}>المواصفات</FormSectionTitle>
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <Label>مخطط المواصفات</Label>
                  <Select
                    value={form.specLayout}
                    onValueChange={(v) => setField("specLayout", v as SpecLayout)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SPEC_LAYOUTS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[0.68rem] text-faint">{specLayoutHint}</p>
                </div>

                {form.specs.length === 0 && (
                  <p className="rounded-xl border border-dashed border-hair p-3 text-center text-xs text-faint">
                    لا توجد مواصفات بعد — اضغط «إضافة مواصفة».
                  </p>
                )}
                {form.specs.map((row) => (
                  <div key={row.key} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                    <Input
                      value={row.label}
                      onChange={(e) => updateSpec(row.key, "label", e.target.value)}
                      placeholder="المعالج"
                      aria-label="اسم المواصفة"
                    />
                    <Input
                      value={row.value}
                      onChange={(e) => updateSpec(row.key, "value", e.target.value)}
                      placeholder="Intel Core i7-12700H"
                      aria-label="قيمة المواصفة"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSpec(row.key)}
                      aria-label="حذف المواصفة"
                      className="text-danger hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                ))}
                <div>
                  <Button type="button" variant="outline" size="sm" onClick={addSpec}>
                    <Plus className="h-4 w-4" aria-hidden />
                    إضافة مواصفة
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="flex items-center justify-end gap-2 border-t border-hair px-6 py-4">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={pending}>
              إلغاء
            </Button>
            <Button onClick={submit} disabled={pending || (attempted && invalid)}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Plus className="h-4 w-4" aria-hidden />
              )}
              {editing ? "حفظ التعديلات" : "إضافة المنتج"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --------------------------- Delete confirmation --------------------------- */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-elevated text-foreground border border-hair shadow-2xl rounded-2xl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle>حذف المنتج؟</AlertDialogTitle>
            <AlertDialogDescription>
              هتحذف «{deleteTarget?.name}» نهائيًا من الكتالوج التجريبي. الإجراء فوري ولا يمكن
              التراجع.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-danger text-white hover:bg-danger/90"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden />
              )}
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* --------------------------- CSV / Excel Import Dialog --------------------------- */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-elevated text-foreground border border-hair shadow-2xl rounded-2xl">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
              <span>استيراد كتالوج المنتجات من كشف Excel / CSV</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              ارفع ملف .csv أو الصق محتويات كشف الجرد مباشرة. سيقوم النظام بتحليل المواصفات العتادية وتصنيف الأجهزة واكتشاف التكرارات تلقائيًا.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* File Upload Zone */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-hair bg-surface/50 p-6 text-center">
              <UploadCloud className="h-8 w-8 text-primary mb-2" />
              <label className="cursor-pointer font-bold text-sm text-primary hover:underline">
                اختر ملف CSV من جهازك
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const text = await file.text();
                      setCsvText(text);
                      toast.success(`تم قراءة الملف «${file.name}»`);
                    }
                  }}
                />
              </label>
              <p className="text-xs text-muted-foreground mt-1">يدعم ملفات CSV الصادرة من Excel أو Google Sheets</p>
            </div>

            {/* Direct Paste Area */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground mb-1 block">
                أو الصق نص الكشف هنا:
              </Label>
              <Textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={5}
                placeholder="NO.,Model,CPU,Ram,Hard,VGA,Monitor,Price,Num..."
                className="font-mono text-xs leading-relaxed"
              />
            </div>

            {/* Replace options */}
            <div className="flex items-center justify-between rounded-xl border border-hair bg-surface/40 p-3.5">
              <div>
                <p className="text-sm font-bold">استبدال الكتالوج الحالي بالكامل</p>
                <p className="text-xs text-muted-foreground">حذف المنتجات الحالية واستبدالها بهذا الكشف الجديد (Safe Replacement)</p>
              </div>
              <Switch
                checked={clearExisting}
                onCheckedChange={setClearExisting}
              />
            </div>

            {/* Preview Action */}
            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
                disabled={importPending || !csvText.trim()}
                className="gap-2"
              >
                {importPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                معاينة وتحليل الكشف
              </Button>
            </div>

            {/* Analysis & Preview Report */}
            {importPreview && (
              <div className="rounded-xl border border-hair bg-surface p-4 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>نتائج الفحص والتحليل الذكي:</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="rounded-lg bg-elevated border border-hair p-2.5">
                    <p className="text-muted-foreground">المنتجات الصالحة</p>
                    <p className="font-tech text-base font-bold text-primary mt-1">{importPreview.processed} منتج</p>
                  </div>
                  <div className="rounded-lg bg-elevated border border-hair p-2.5">
                    <p className="text-muted-foreground">أجهزة جيمنج</p>
                    <p className="font-tech text-base font-bold text-emerald-500 mt-1">{importPreview.categoriesBreakdown?.gaming || 0}</p>
                  </div>
                  <div className="rounded-lg bg-elevated border border-hair p-2.5">
                    <p className="text-muted-foreground">أجهزة ورك ستيشن</p>
                    <p className="font-tech text-base font-bold text-sky-500 mt-1">{importPreview.categoriesBreakdown?.workstation || 0}</p>
                  </div>
                  <div className="rounded-lg bg-elevated border border-hair p-2.5">
                    <p className="text-muted-foreground">اقتصادي وبيزنس</p>
                    <p className="font-tech text-base font-bold text-amber-500 mt-1">{importPreview.categoriesBreakdown?.economic || 0}</p>
                  </div>
                  <div className="rounded-lg bg-elevated border border-hair p-2.5">
                    <p className="text-muted-foreground">تخزين ورامات</p>
                    <p className="font-tech text-base font-bold text-muted-foreground mt-1">
                      {(importPreview.categoriesBreakdown?.storage || 0) + (importPreview.categoriesBreakdown?.ram || 0)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-elevated border border-hair p-2.5">
                    <p className="text-muted-foreground">تكرارات تم دمجها</p>
                    <p className="font-tech text-base font-bold text-foreground mt-1">{importPreview.duplicatesCount || 0}</p>
                  </div>
                </div>

                {importPreview.rejectedCount > 0 && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>تم استبعاد {importPreview.rejectedCount} أسطر غير صالحة (صفوف باركود أو بيانات فارغة).</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-hair mt-4">
            <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importPending}>
              إلغاء
            </Button>
            <Button
              onClick={handleExecuteImport}
              disabled={importPending || !csvText.trim()}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {importPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              تأكيد واستيراد الآن
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
