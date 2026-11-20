"use client";

/**
 * ============================================================
 * HYPER TECH — Admin Builds Manager
 * ============================================================
 * PC build CRUD with a dynamic components editor, performance
 * sliders and a «احسب من المكونات» helper that fills the total
 * price from component lines — fewer manual steps for a
 * non-technical admin.
 * ============================================================
 */

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Calculator,
  Cpu,
  Gauge,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useMockDB } from "@/lib/store/db-store";
import { repositories } from "@/lib/repositories";
import { AVAILABILITY_META, BUILD_TYPE_META, formatPriceCompact } from "@/lib/format";
import { AvailabilityBadge } from "@/components/store/catalog-atoms";
import { EmptyState, FieldError, FormSectionTitle } from "./admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { BuildType, PCBuild, ProductAvailability } from "@/types";

/* ------------------------------- Form model ------------------------------- */

interface ComponentRow {
  key: string;
  role: string;
  name: string;
  spec: string;
  qty: string;
  price: string;
}

interface PerfRow {
  key: string;
  label: string;
  score: number;
}

interface BuildForm {
  title: string;
  type: BuildType;
  description: string;
  imagesText: string;
  availability: ProductAvailability;
  featured: boolean;
  totalPrice: string;
  components: ComponentRow[];
  perf: PerfRow[];
}

const rowId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const SUGGESTED_ROLES = ["المعالج", "كارت الشاشة", "الرام", "التخزين"];

const EMPTY_FORM: BuildForm = {
  title: "",
  type: "gaming",
  description: "",
  imagesText: "",
  availability: "in-stock",
  featured: false,
  totalPrice: "",
  components: SUGGESTED_ROLES.map((role) => ({
    key: rowId(),
    role,
    name: "",
    spec: "",
    qty: "1",
    price: "",
  })),
  perf: [
    { key: rowId(), label: "", score: 70 },
    { key: rowId(), label: "", score: 70 },
    { key: rowId(), label: "", score: 70 },
  ],
};

const AVAILABILITY_OPTIONS = Object.entries(AVAILABILITY_META).map(([value, meta]) => ({
  value: value as ProductAvailability,
  label: meta.label,
}));

const TYPE_OPTIONS = (Object.keys(BUILD_TYPE_META) as BuildType[]).map((value) => ({
  value,
  label: BUILD_TYPE_META[value],
}));

type BuildErrors = Partial<Record<"title" | "totalPrice" | "components", string>>;

function validateForm(f: BuildForm): BuildErrors {
  const errors: BuildErrors = {};
  if (!f.title.trim()) errors.title = "عنوان التجميعة مطلوب";
  const total = Number(f.totalPrice);
  if (f.totalPrice.trim() === "" || Number.isNaN(total) || total < 0) {
    errors.totalPrice = "أدخل السعر الإجمالي — أو استخدم زر «احسب من المكونات»";
  }
  if (f.components.every((c) => !c.name.trim())) {
    errors.components = "التجميعة محتاجة مكون واحد على الأقل (اكتب اسم المكون)";
  }
  return errors;
}

/* -------------------------------- Component ------------------------------- */

export default function BuildsManager() {
  const builds = useMockDB((s) => s.builds);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PCBuild | null>(null);
  const [form, setForm] = useState<BuildForm>(EMPTY_FORM);
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<PCBuild | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [starPendingId, setStarPendingId] = useState<string | null>(null);

  const errors = validateForm(form);
  const invalid = Object.keys(errors).length > 0;

  const parsedImages = useMemo(
    () =>
      form.imagesText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    [form.imagesText],
  );

  /* ------------------------------ Dialog open ----------------------------- */

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      components: SUGGESTED_ROLES.map((role) => ({
        key: rowId(),
        role,
        name: "",
        spec: "",
        qty: "1",
        price: "",
      })),
      perf: [
        { key: rowId(), label: "", score: 70 },
        { key: rowId(), label: "", score: 70 },
        { key: rowId(), label: "", score: 70 },
      ],
    });
    setAttempted(false);
    setDialogOpen(true);
  };

  const openEdit = (b: PCBuild) => {
    setEditing(b);
    setForm({
      title: b.title,
      type: b.type,
      description: b.description,
      imagesText: b.images.join("\n"),
      availability: b.availability,
      featured: b.featured,
      totalPrice: String(b.totalPrice),
      components: b.components.map((c) => ({
        key: rowId(),
        role: c.role,
        name: c.name,
        spec: c.spec ?? "",
        qty: String(c.qty),
        price: c.price != null ? String(c.price) : "",
      })),
      perf:
        b.performance.length > 0
          ? b.performance.map((p) => ({ key: rowId(), label: p.label, score: p.score }))
          : [
              { key: rowId(), label: "", score: 70 },
              { key: rowId(), label: "", score: 70 },
              { key: rowId(), label: "", score: 70 },
            ],
    });
    setAttempted(false);
    setDialogOpen(true);
  };

  const setField = <K extends keyof BuildForm>(key: K, value: BuildForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  /* --------------------------- Components editor -------------------------- */

  const addComponent = () =>
    setForm((f) => ({
      ...f,
      components: [
        ...f.components,
        { key: rowId(), role: "", name: "", spec: "", qty: "1", price: "" },
      ],
    }));

  const updateComponent = (key: string, field: keyof ComponentRow, value: string) =>
    setForm((f) => ({
      ...f,
      components: f.components.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    }));

  const removeComponent = (key: string) =>
    setForm((f) => ({ ...f, components: f.components.filter((r) => r.key !== key) }));

  const computeFromComponents = () => {
    const total = form.components.reduce(
      (sum, r) => sum + (Math.max(1, Math.floor(Number(r.qty) || 1)) || 1) * (Number(r.price) || 0),
      0,
    );
    if (total <= 0) {
      toast.error("أسعار المكونات فاضية — اكتب سعر كل مكون الأول");
      return;
    }
    setField("totalPrice", String(total));
    toast.success("تم ملء السعر الإجمالي من مجموع المكونات");
  };

  /* ---------------------------- Performance editor ------------------------- */

  const updatePerf = (key: string, patch: Partial<PerfRow>) =>
    setForm((f) => ({ ...f, perf: f.perf.map((r) => (r.key === key ? { ...r, ...patch } : r)) }));

  const removePerf = (key: string) =>
    setForm((f) => ({ ...f, perf: f.perf.filter((r) => r.key !== key) }));

  const addPerf = () =>
    setForm((f) => ({ ...f, perf: [...f.perf, { key: rowId(), label: "", score: 70 }] }));

  /* --------------------------------- Submit -------------------------------- */

  const submit = async () => {
    if (invalid) {
      setAttempted(true);
      return;
    }
    setPending(true);
    try {
      const components = form.components
        .filter((r) => r.name.trim())
        .map((r) => ({
          id: rowId(),
          role: r.role.trim() || "مكون",
          name: r.name.trim(),
          spec: r.spec.trim() || undefined,
          qty: Math.max(1, Math.floor(Number(r.qty) || 1)),
          price: r.price.trim() ? Number(r.price) : undefined,
        }));
      const performance = form.perf
        .filter((p) => p.label.trim())
        .map((p) => ({ label: p.label.trim(), score: Math.min(100, Math.max(0, p.score)) }));

      const payload = {
        title: form.title.trim(),
        type: form.type,
        description: form.description.trim(),
        images: parsedImages,
        components,
        totalPrice: Math.max(0, Math.floor(Number(form.totalPrice) || 0)),
        availability: form.availability,
        performance,
        featured: form.featured,
      };

      if (editing) {
        await repositories.builds.update(editing.id, payload);
        toast.success("تم تحديث التجميعة");
      } else {
        await repositories.builds.create(payload);
        toast.success("تمت إضافة التجميعة");
      }
      setDialogOpen(false);
    } catch {
      toast.error("حدث خطأ غير متوقع — جرّب تاني");
    } finally {
      setPending(false);
    }
  };

  /* ------------------------------- Row actions ----------------------------- */

  const toggleFeatured = async (b: PCBuild) => {
    if (starPendingId) return;
    setStarPendingId(b.id);
    try {
      await repositories.builds.update(b.id, { featured: !b.featured });
      toast.success(b.featured ? "تم إلغاء تمييز التجميعة" : "تم تمييز التجميعة");
    } catch {
      toast.error("تعذر تحديث التجميعة");
    } finally {
      setStarPendingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await repositories.builds.remove(deleteTarget.id);
      toast.success(`تم حذف «${deleteTarget.title}»`);
      setDeleteTarget(null);
    } catch {
      toast.error("تعذر حذف التجميعة");
    } finally {
      setDeleting(false);
    }
  };

  /* --------------------------------- Render -------------------------------- */

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">التجميعات</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-tech">{builds.length}</span> تجميعة PC — ببيانات وهمية للعرض
          </p>
        </div>
        <Button onClick={openCreate} className="min-h-9 glow-accent-sm">
          <Plus className="h-4 w-4" aria-hidden />
          إضافة تجميعة
        </Button>
      </div>

      {/* Cards grid */}
      {builds.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title="لا توجد تجميعات"
          hint="أضف أول تجميعة — اكتب المكونات واحسب السعر بضغطة واحدة."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {builds.map((b) => (
            <article
              key={b.id}
              className="group overflow-hidden rounded-2xl border border-hair bg-surface/60 transition-colors hover:border-primary/25"
            >
              <div className="relative h-36 overflow-hidden bg-elevated">
                {b.images[0] ? (
                  <img
                    src={b.images[0]}
                    alt={b.title}
                    loading="lazy"
                    className="img-grade h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-faint">
                    <Cpu className="h-8 w-8" aria-hidden />
                  </span>
                )}
                <span className="absolute right-2 top-2 rounded-full bg-[#24221d]/55 px-2.5 py-1 text-[0.68rem] font-bold text-white backdrop-blur">
                  {BUILD_TYPE_META[b.type] ?? b.type}
                </span>
                <button
                  type="button"
                  onClick={() => toggleFeatured(b)}
                  disabled={starPendingId === b.id}
                  aria-label={b.featured ? "إلغاء تمييز التجميعة" : "تمييز التجميعة"}
                  aria-pressed={b.featured}
                  className="absolute left-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#24221d]/55 backdrop-blur transition-colors disabled:opacity-50"
                >
                  {starPendingId === b.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden />
                  ) : (
                    <Star
                      className={cn(
                        "h-4 w-4",
                        b.featured ? "fill-amber text-amber" : "text-white/70",
                      )}
                      aria-hidden
                    />
                  )}
                </button>
              </div>

              <div className="space-y-3 p-4">
                <h3 className="truncate text-base font-bold">{b.title}</h3>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    <span className="font-tech font-bold text-foreground">{b.components.length}</span>{" "}
                    مكون
                  </span>
                  <AvailabilityBadge status={b.availability} />
                </div>
                <p className="font-tech text-lg font-bold" dir="rtl">
                  {formatPriceCompact(b.totalPrice)}
                  <span className="mr-1.5 text-[0.6em] font-medium text-muted-foreground">ج.م</span>
                </p>
                <div className="flex items-center justify-between border-t border-hair pt-3">
                  {b.performance.length > 0 ? (
                    <span className="flex items-center gap-1 text-[0.68rem] text-faint">
                      <Gauge className="h-3.5 w-3.5" aria-hidden />
                      {b.performance.length} مؤشر أداء
                    </span>
                  ) : (
                    <span />
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(b)}
                      aria-label={`تعديل تجميعة ${b.title}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(b)}
                      aria-label={`حذف تجميعة ${b.title}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-danger/80 transition-colors hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ------------------------- Create / Edit dialog ------------------------ */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setAttempted(false);
        }}
      >
        <DialogPortal>
          <DialogOverlay />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pointer-events-none">
            <DialogPrimitive.Content
              className="pointer-events-auto flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-hair bg-elevated/95 shadow-2xl backdrop-blur-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 text-foreground"
            >
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-hair bg-elevated/95 px-4 py-3.5 sm:px-6 sm:py-4 backdrop-blur-md">
                <div className="space-y-0.5 text-right">
                  <DialogTitle className="text-base font-bold sm:text-lg">
                    {editing ? "تعديل تجميعة" : "إضافة تجميعة جديدة"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    اكتب المكونات وكمياتها — وزر «احسب من المكونات» يملّي السعر لوحده.
                  </DialogDescription>
                </div>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="إغلاق النافذة"
                    className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </Button>
                </DialogClose>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto max-h-[calc(90vh-9rem)] px-4 py-5 sm:px-6 space-y-6 overscroll-contain">
                {/* Basics */}
                <FormSectionTitle icon={Cpu}>الأساسيات</FormSectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="b-title">عنوان التجميعة *</Label>
                    <Input
                      id="b-title"
                      value={form.title}
                      onChange={(e) => setField("title", e.target.value)}
                      placeholder="مثال: وحش الألعاب — RTX 4070"
                    />
                    <FieldError>{attempted ? errors.title : undefined}</FieldError>
                  </div>

                  <div className="space-y-1.5">
                    <Label>النوع</Label>
                    <Select value={form.type} onValueChange={(v) => setField("type", v as BuildType)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>حالة التوفر</Label>
                    <Select
                      value={form.availability}
                      onValueChange={(v) => setField("availability", v as ProductAvailability)}
                    >
                      <SelectTrigger className="w-full">
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

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="b-desc">الوصف</Label>
                    <Textarea
                      id="b-desc"
                      rows={3}
                      value={form.description}
                      onChange={(e) => setField("description", e.target.value)}
                      placeholder="لمن التجميعة دي؟ وأقوى مميزاتها…"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-xl border border-hair bg-elevated/40 p-3.5 sm:col-span-2">
                    <div>
                      <Label htmlFor="b-featured" className="text-sm font-medium">
                        تجميعة مميزة
                      </Label>
                      <p className="text-[0.68rem] text-faint">تظهر أولًا في صفحة التجميعات</p>
                    </div>
                    <Switch
                      id="b-featured"
                      checked={form.featured}
                      onCheckedChange={(v) => setField("featured", v)}
                      aria-label="تمييز التجميعة"
                    />
                  </div>
                </div>

                {/* Total price */}
                <FormSectionTitle icon={Calculator}>السعر الإجمالي</FormSectionTitle>
                <div className="space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor="b-price">السعر الإجمالي (ج.م) *</Label>
                      <Input
                        id="b-price"
                        type="number"
                        min={0}
                        dir="ltr"
                        className="font-tech"
                        value={form.totalPrice}
                        onChange={(e) => setField("totalPrice", e.target.value)}
                        placeholder="45000"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={computeFromComponents}
                      className="min-h-10 shrink-0"
                    >
                      <Calculator className="h-4 w-4" aria-hidden />
                      احسب من المكونات
                    </Button>
                  </div>
                  <FieldError>{attempted ? errors.totalPrice : undefined}</FieldError>
                  <p className="text-[0.68rem] text-faint">
                    اتركه أو اضبطه يدويًا — زر «احسب من المكونات» يملأ مجموع أسعار المكونات.
                  </p>
                </div>

                {/* Components */}
                <FormSectionTitle icon={Cpu}>مكونات التجميعة</FormSectionTitle>
                <div className="space-y-3">
                  {/* Header labels (desktop) */}
                  <div className="hidden gap-2 px-1 text-[0.68rem] font-medium text-faint lg:grid lg:grid-cols-[1.2fr_1.5fr_1.1fr_4.5rem_6rem_auto]">
                    <span>الدور</span>
                    <span>الاسم *</span>
                    <span>المواصفة</span>
                    <span>الكمية</span>
                    <span>السعر (وحدة)</span>
                    <span />
                  </div>

                  {form.components.map((r) => (
                    <div
                      key={r.key}
                      className="rounded-xl border border-hair bg-surface/40 p-3 space-y-2 lg:space-y-0 lg:rounded-none lg:border-x-0 lg:border-t-0 lg:border-b lg:border-hair/60 lg:bg-transparent lg:p-0 lg:pb-2.5 lg:grid lg:grid-cols-[1.2fr_1.5fr_1.1fr_4.5rem_6rem_auto] lg:items-center lg:gap-2"
                    >
                      {/* On mobile: row 1 (role + name + delete) */}
                      <div className="flex items-center gap-2 lg:contents">
                        <div className="w-1/3 lg:w-auto">
                          <span className="block text-[0.65rem] font-medium text-muted-foreground lg:hidden mb-1">
                            الدور
                          </span>
                          <Input
                            value={r.role}
                            onChange={(e) => updateComponent(r.key, "role", e.target.value)}
                            placeholder="المعالج"
                            aria-label="دور المكون"
                          />
                        </div>
                        <div className="flex-1 lg:w-auto">
                          <span className="block text-[0.65rem] font-medium text-muted-foreground lg:hidden mb-1">
                            اسم المكون *
                          </span>
                          <Input
                            value={r.name}
                            onChange={(e) => updateComponent(r.key, "name", e.target.value)}
                            placeholder="Ryzen 7 7800X3D"
                            aria-label="اسم المكون"
                          />
                        </div>
                        {/* Mobile delete button placed in row 1 */}
                        <div className="lg:hidden shrink-0 self-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeComponent(r.key)}
                            aria-label="حذف المكون"
                            className="h-10 w-10 text-danger hover:bg-danger/10 hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </Button>
                        </div>
                      </div>

                      {/* Spec */}
                      <div className="lg:contents">
                        <span className="block text-[0.65rem] font-medium text-muted-foreground lg:hidden mb-1">
                          المواصفات
                        </span>
                        <Input
                          value={r.spec}
                          onChange={(e) => updateComponent(r.key, "spec", e.target.value)}
                          placeholder="اختياري — 8 نواة"
                          aria-label="مواصفة المكون"
                        />
                      </div>

                      {/* Qty & Price on mobile (grid 2 cols) */}
                      <div className="grid grid-cols-2 gap-2 lg:contents">
                        <div>
                          <span className="block text-[0.65rem] font-medium text-muted-foreground lg:hidden mb-1">
                            الكمية
                          </span>
                          <Input
                            type="number"
                            min={1}
                            dir="ltr"
                            className="font-tech"
                            value={r.qty}
                            onChange={(e) => updateComponent(r.key, "qty", e.target.value)}
                            aria-label="كمية المكون"
                          />
                        </div>
                        <div>
                          <span className="block text-[0.65rem] font-medium text-muted-foreground lg:hidden mb-1">
                            السعر (ج.م)
                          </span>
                          <Input
                            type="number"
                            min={0}
                            dir="ltr"
                            className="font-tech"
                            value={r.price}
                            onChange={(e) => updateComponent(r.key, "price", e.target.value)}
                            placeholder="0"
                            aria-label="سعر الوحدة للمكون"
                          />
                        </div>
                      </div>

                      {/* Desktop delete button */}
                      <div className="hidden lg:block">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeComponent(r.key)}
                          aria-label="حذف المكون"
                          className="text-danger hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <FieldError>{attempted ? errors.components : undefined}</FieldError>
                  <div>
                    <Button type="button" variant="outline" size="sm" onClick={addComponent} className="min-h-9">
                      <Plus className="h-4 w-4" aria-hidden />
                      إضافة مكون
                    </Button>
                  </div>
                </div>

                {/* Images */}
                <FormSectionTitle icon={ImageIcon}>الصور</FormSectionTitle>
                <div className="space-y-2">
                  <Label htmlFor="b-images">روابط الصور — سطر لكل رابط</Label>
                  <Textarea
                    id="b-images"
                    rows={3}
                    dir="ltr"
                    className="font-tech text-xs"
                    value={form.imagesText}
                    onChange={(e) => setField("imagesText", e.target.value)}
                    placeholder={"https://example.com/build-1.jpg\nhttps://example.com/build-2.jpg"}
                  />
                  {parsedImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      <div className="col-span-2 row-span-2 overflow-hidden rounded-lg border border-hair bg-[#0d0f13]">
                        <img
                          src={parsedImages[0]}
                          alt="الصورة الأساسية للتجميعة"
                          loading="lazy"
                          className="img-grade h-full min-h-24 w-full object-cover"
                        />
                      </div>
                      {parsedImages.slice(1, 5).map((src, i) => (
                        <div key={`${src}-${i}`} className="overflow-hidden rounded-lg border border-hair bg-[#0d0f13]">
                          <img
                            src={src}
                            alt={`صورة إضافية رقم ${i + 2}`}
                            loading="lazy"
                            className="img-grade h-20 w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Performance */}
                <FormSectionTitle icon={Gauge}>أداء التجميعة (اختياري)</FormSectionTitle>
                <div className="space-y-3">
                  <p className="text-[0.68rem] text-faint">
                    مؤشرات من 100 بتظهر كأشرطة أداء في صفحة التجميعة — اترك الاسم فارغًا لتجاهل
                    الصف.
                  </p>
                  {form.perf.map((p) => (
                    <div
                      key={p.key}
                      className="flex flex-col gap-2.5 rounded-xl border border-hair bg-surface/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1">
                        <Input
                          value={p.label}
                          onChange={(e) => updatePerf(p.key, { label: e.target.value })}
                          placeholder="مثال: Gaming"
                          aria-label="اسم مؤشر الأداء"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div dir="ltr" className="flex-1 sm:w-36">
                          <Slider
                            value={[p.score]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={(v) => updatePerf(p.key, { score: v[0] ?? p.score })}
                            aria-label="قيمة مؤشر الأداء من 100"
                          />
                        </div>
                        <span className="w-10 text-center font-tech text-sm font-bold text-primary" dir="ltr">
                          {p.score}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePerf(p.key)}
                          aria-label="حذف مؤشر الأداء"
                          className="h-9 w-9 shrink-0 text-danger hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {form.perf.length < 4 && (
                    <div>
                      <Button type="button" variant="outline" size="sm" onClick={addPerf} className="min-h-9">
                        <Plus className="h-4 w-4" aria-hidden />
                        إضافة مؤشر
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-end gap-2 border-t border-hair bg-elevated/95 px-4 py-3.5 sm:px-6 backdrop-blur-md">
                <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={pending} className="min-h-10 px-4">
                  إلغاء
                </Button>
                <Button onClick={submit} disabled={pending || (attempted && invalid)} className="min-h-10 px-5 glow-accent-sm">
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Plus className="h-4 w-4" aria-hidden />
                  )}
                  {editing ? "حفظ التعديلات" : "إضافة التجميعة"}
                </Button>
              </div>
            </DialogPrimitive.Content>
          </div>
        </DialogPortal>
      </Dialog>

      {/* --------------------------- Delete confirmation --------------------------- */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle>حذف التجميعة؟</AlertDialogTitle>
            <AlertDialogDescription>
              هتحذف «{deleteTarget?.title}» نهائيًا من التجميعات التجريبية. الإجراء فوري ولا يمكن
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
    </div>
  );
}
