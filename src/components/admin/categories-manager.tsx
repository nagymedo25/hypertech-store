"use client";

/**
 * ============================================================
 * HYPER TECH — Admin Categories / Worlds Manager
 * ============================================================
 * Full dynamic CRUD control for Store Categories & Worlds:
 * - Create, Read, Update, Reorder, Enable/Disable, Delete.
 * - Editable fields: Name, Tagline, Description, Image, Icon
 *   (with Lucide icon picker + custom input), Accent Color
 *   (native picker, hex code input, curated presets), Display Order,
 *   and Active/Visibility toggle.
 * ============================================================
 */

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  Check,
  ChevronDown,
  ChevronUp,
  Coins,
  Cpu,
  Flame,
  FolderTree,
  Gamepad2,
  HardDrive,
  Headphones,
  Keyboard,
  Laptop,
  Layers,
  Loader2,
  MemoryStick,
  Monitor,
  Mouse,
  Package,
  Palette,
  Pencil,
  Plus,
  Rocket,
  Server,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useMockDB } from "@/lib/store/db-store";
import { repositories } from "@/lib/repositories";
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
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

/* --------------------------- Lucide Icon Helpers -------------------------- */

const ICON_MAP: Record<string, LucideIcon> = {
  Cpu,
  Gamepad2,
  Coins,
  Laptop,
  Briefcase,
  Sparkles,
  Zap,
  Monitor,
  Server,
  HardDrive,
  MemoryStick,
  Keyboard,
  Mouse,
  Headphones,
  ShieldCheck,
  Layers,
  Flame,
  Trophy,
  Rocket,
  Package,
};

const POPULAR_ICONS: { name: string; label: string }[] = [
  { name: "Cpu", label: "معالج" },
  { name: "Gamepad2", label: "ألعاب" },
  { name: "Coins", label: "اقتصادي" },
  { name: "Briefcase", label: "أعمال" },
  { name: "Laptop", label: "لابتوب" },
  { name: "Sparkles", label: "مميز" },
  { name: "Zap", label: "أداء فائق" },
  { name: "Monitor", label: "شاشات" },
  { name: "Server", label: "سيرفر" },
  { name: "HardDrive", label: "تخزين" },
  { name: "MemoryStick", label: "رامات" },
  { name: "Keyboard", label: "كيبورد" },
  { name: "Mouse", label: "ماوس" },
  { name: "Headphones", label: "سماعات" },
  { name: "ShieldCheck", label: "حماية" },
  { name: "Layers", label: "طبقات" },
];

const PRESET_COLORS = [
  { hex: "#0284c7", label: "أزرق وورك ستيشن" },
  { hex: "#10b981", label: "أخضر جيمنج" },
  { hex: "#f59e0b", label: "ذهبي اقتصادي" },
  { hex: "#8b5cf6", label: "بنفسجي سايبر" },
  { hex: "#ec4899", label: "وردي نيون" },
  { hex: "#ef4444", label: "أحمر توربو" },
  { hex: "#06b6d4", label: "سماوي تقني" },
  { hex: "#64748b", label: "رمادي معدني" },
];

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Package;
}

/* ------------------------------- Form Model ------------------------------- */

interface CategoryForm {
  name: string;
  tagline: string;
  description: string;
  accent: string;
  icon: string;
  image: string;
  order: string;
  active: boolean;
}

const EMPTY_FORM: CategoryForm = {
  name: "",
  tagline: "",
  description: "",
  accent: "#0284c7",
  icon: "Cpu",
  image: "",
  order: "",
  active: true,
};

function slugify(text: string): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[\s/\\]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `cat-${Date.now()}`;
}

function uniqueSlug(base: string, taken: string[]): string {
  if (!taken.includes(base)) return base;
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

/* -------------------------------- Component ------------------------------- */

export default function CategoriesManager() {
  const categories = useMockDB((s) => s.categories);
  const products = useMockDB((s) => s.products);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reorderPending, setReorderPending] = useState<string | null>(null);
  const [visibilityPendingId, setVisibilityPendingId] = useState<string | null>(null);

  const sorted = useMemo(() => [...categories].sort((a, b) => a.order - b.order), [categories]);

  const productCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1);
    return map;
  }, [products]);

  const nameError = !form.name.trim() ? "اسم الفئة مطلوب" : undefined;

  /* ------------------------------ Dialog open ----------------------------- */

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setAttempted(false);
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({
      name: c.name,
      tagline: c.tagline,
      description: c.description,
      accent: c.accent || "#0284c7",
      icon: c.icon || "Package",
      image: c.image || "",
      order: String(c.order),
      active: c.active !== false,
    });
    setAttempted(false);
    setDialogOpen(true);
  };

  const setField = <K extends keyof CategoryForm>(key: K, value: CategoryForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  /* --------------------------------- Submit -------------------------------- */

  const submit = async () => {
    if (nameError) {
      setAttempted(true);
      return;
    }
    setPending(true);
    try {
      const orderVal = form.order.trim()
        ? Math.max(0, Math.floor(Number(form.order) || 0))
        : undefined;

      if (editing) {
        await repositories.categories.update(editing.id, {
          name: form.name.trim(),
          tagline: form.tagline.trim(),
          description: form.description.trim(),
          accent: form.accent,
          icon: form.icon.trim() || "Package",
          image: form.image.trim(),
          order: orderVal ?? editing.order,
          active: form.active,
        });
        toast.success("تم تحديث الفئة بنجاح");
      } else {
        const maxOrder = categories.reduce((m, c) => Math.max(m, c.order), -1);
        await repositories.categories.create({
          name: form.name.trim(),
          tagline: form.tagline.trim(),
          description: form.description.trim(),
          accent: form.accent,
          icon: form.icon.trim() || "Package",
          image: form.image.trim(),
          slug: uniqueSlug(
            slugify(form.name),
            categories.map((c) => c.slug),
          ),
          order: orderVal ?? maxOrder + 1,
          active: form.active,
        });
        toast.success("تمت إضافة الفئة بنجاح");
      }
      setDialogOpen(false);
    } catch {
      toast.error("حدث خطأ أثناء حفظ الفئة — يرجى المحاولة مرة أخرى");
    } finally {
      setPending(false);
    }
  };

  /* ------------------------------- Row actions ----------------------------- */

  const reorder = async (id: string, dir: "up" | "down") => {
    if (reorderPending) return;
    setReorderPending(id);
    try {
      await repositories.categories.reorder(id, dir);
      toast.success("تم تحديث ترتيب العرض");
    } catch {
      toast.error("تعذر تحديث الترتيب");
    } finally {
      setReorderPending(null);
    }
  };

  const toggleActive = async (c: Category, next: boolean) => {
    if (visibilityPendingId) return;
    setVisibilityPendingId(c.id);
    try {
      await repositories.categories.update(c.id, { active: next });
      toast.success(
        next
          ? `«${c.name}» مفعلة وظاهرة في المتجر`
          : `«${c.name}» معطلة ومخفية من المتجر`,
      );
    } catch {
      toast.error("تعذر تحديث ظهور الفئة");
    } finally {
      setVisibilityPendingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await repositories.categories.remove(deleteTarget.id);
      toast.success(`تم حذف فئة «${deleteTarget.name}»`);
      setDeleteTarget(null);
    } catch {
      toast.error("تعذر حذف الفئة");
    } finally {
      setDeleting(false);
    }
  };

  const SelectedIcon = resolveIcon(form.icon);

  /* --------------------------------- Render -------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">الفئات وعوالم المتجر</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-tech">{categories.length}</span> فئات وعوالم تفاعلية —
            الترتيب هنا يحدد تسلسل الظهور في بوابة العوالم والمتجر.
          </p>
        </div>
        <Button onClick={openCreate} className="min-h-9 glow-accent-sm">
          <Plus className="h-4 w-4" aria-hidden />
          إضافة فئة / عالم جديد
        </Button>
      </div>

      {/* Cards grid */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="لا توجد فئات حاليًا"
          hint="أضف فئتك الأولى أو عالمك الرقمي لتبدأ تنظيم منتجات المتجر."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((c, idx) => {
            const count = productCounts.get(c.id) ?? 0;
            const busy = reorderPending === c.id;
            const CardIcon = resolveIcon(c.icon);
            const isPrimaryWorld = ["workstation", "gaming", "economic"].includes(c.slug);

            return (
              <article
                key={c.id}
                className="group relative overflow-hidden rounded-2xl border border-hair bg-surface/60 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
              >
                {/* Accent top stripe */}
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: c.accent || "#0284c7" }}
                  aria-hidden
                />

                <div className="relative h-32 overflow-hidden bg-elevated">
                  {c.image ? (
                    <img
                      src={c.image}
                      alt={`غلاف فئة ${c.name}`}
                      loading="lazy"
                      className="img-grade h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted/20 text-faint">
                      <FolderTree className="h-10 w-10 opacity-40" aria-hidden />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Icon & Title Overlay */}
                  <div className="absolute bottom-2.5 right-3 flex items-center gap-2">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/20 backdrop-blur-md shadow"
                      style={{
                        backgroundColor: `${c.accent}33`,
                        color: c.accent || "#fff",
                      }}
                    >
                      <CardIcon className="h-4 w-4" />
                    </span>
                    <span className="font-display text-sm font-bold text-white drop-shadow">
                      {c.name}
                    </span>
                  </div>

                  {/* Badges on top */}
                  <div className="absolute left-3 top-3 flex items-center gap-1.5">
                    {isPrimaryWorld && (
                      <span className="rounded-full bg-primary/90 px-2.5 py-0.5 text-[0.65rem] font-bold text-primary-foreground backdrop-blur shadow">
                        عالم رئيسي
                      </span>
                    )}
                    {c.active === false && (
                      <span className="rounded-full bg-danger/80 px-2 py-0.5 text-[0.65rem] font-bold text-white backdrop-blur shadow">
                        معطلة
                      </span>
                    )}
                  </div>

                  {/* Order indicator */}
                  <span className="absolute right-3 top-3 rounded-md bg-black/60 px-2 py-0.5 font-tech text-[0.68rem] text-white/80 backdrop-blur">
                    #{c.order + 1}
                  </span>
                </div>

                <div className="space-y-3.5 p-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-base font-bold">{c.name}</h3>
                      <span className="font-tech text-xs text-faint" dir="ltr">
                        /{c.slug}
                      </span>
                    </div>
                    {c.tagline && (
                      <p className="mt-1 line-clamp-1 text-xs font-medium text-foreground/80">
                        {c.tagline}
                      </p>
                    )}
                    {c.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {c.description}
                      </p>
                    )}
                  </div>

                  {/* Meta stats */}
                  <div className="flex items-center justify-between rounded-xl bg-raised/40 px-3 py-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-faint" />
                      <span>
                        <strong className="font-tech text-foreground">{count}</strong> منتج نشط
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-tech">
                      <span
                        className="h-3 w-3 rounded-full border border-black/10 shadow-sm"
                        style={{ backgroundColor: c.accent }}
                        aria-hidden
                      />
                      <span className="text-[0.7rem] text-faint" dir="ltr">
                        {c.accent}
                      </span>
                    </span>
                  </div>

                  {/* Storefront active toggle */}
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-hair bg-raised/60 px-3 py-2.5">
                    <div className="min-w-0">
                      <Label htmlFor={`cat-active-${c.id}`} className="text-xs font-semibold">
                        {c.active !== false ? "مفعلة في المتجر" : "معطلة ومخفية"}
                      </Label>
                      <span className="block text-[0.65rem] text-faint">
                        {c.active !== false
                          ? "ظاهرة في بوابة العوالم والفلاتر"
                          : "محجوبة من التصفح — منتجاتها محفوظة"}
                      </span>
                    </div>
                    <Switch
                      id={`cat-active-${c.id}`}
                      checked={c.active !== false}
                      disabled={visibilityPendingId === c.id}
                      onCheckedChange={(next) => toggleActive(c, next)}
                      aria-label={`تفعيل فئة ${c.name}`}
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between border-t border-hair pt-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => reorder(c.id, "up")}
                        disabled={idx === 0 || busy}
                        aria-label={`تقديم فئة ${c.name} في الترتيب`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => reorder(c.id, "down")}
                        disabled={idx === sorted.length - 1 || busy}
                        aria-label={`تأخير فئة ${c.name} في الترتيب`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" aria-hidden />
                      </button>
                      {busy && (
                        <Loader2 className="mx-1 h-3.5 w-3.5 animate-spin text-primary" aria-hidden />
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(c)}
                        className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(c)}
                        className="h-8 gap-1.5 px-2 text-xs text-danger/80 hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
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
        <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
          <DialogHeader className="space-y-1 border-b border-hair px-6 py-4 text-right">
            <DialogTitle>
              {editing ? `تعديل فئة «${editing.name}»` : "إضافة فئة / عالم جديد"}
            </DialogTitle>
            <DialogDescription>
              تتحكم في الاسم، الهوية البصرية، الأيقونة، ترتيب الظهور، والحالة في المتجر.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[68vh]">
            <div className="space-y-6 px-6 py-5">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="c-name">اسم الفئة / العالم *</Label>
                  <Input
                    id="c-name"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="مثال: ورك ستيشن، جيمنج، اقتصادي..."
                  />
                  <FieldError>{attempted ? nameError : undefined}</FieldError>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-tagline">الوصف المختصر (Tagline)</Label>
                  <Input
                    id="c-tagline"
                    value={form.tagline}
                    onChange={(e) => setField("tagline", e.target.value)}
                    placeholder="مثال: قوة وإنتاجية فائقة للأعمال والريندر"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-desc">الوصف التفصيلي</Label>
                  <Textarea
                    id="c-desc"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="وصف الفئة كما يظهر في كارت العالم وبوابة المتجر..."
                  />
                </div>
              </div>

              {/* Visual Identity */}
              <FormSectionTitle icon={Palette}>الهوية البصرية واللون</FormSectionTitle>
              <div className="space-y-4">
                {/* Accent Color */}
                <div className="space-y-2">
                  <Label htmlFor="c-accent">لون التمييز (Accent Color)</Label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      id="c-accent"
                      type="color"
                      value={form.accent}
                      onChange={(e) => setField("accent", e.target.value)}
                      aria-label="اختيار لون التمييز"
                      className="h-10 w-14 cursor-pointer rounded-lg border border-hair bg-transparent p-1 shadow-sm"
                    />
                    <Input
                      value={form.accent}
                      onChange={(e) => setField("accent", e.target.value)}
                      placeholder="#0284c7"
                      className="w-32 font-tech text-xs uppercase"
                      dir="ltr"
                    />
                    <span
                      className="h-9 w-9 rounded-xl border border-foreground/15 shadow-sm"
                      style={{ backgroundColor: form.accent }}
                      aria-hidden
                    />
                  </div>

                  {/* Preset Swatches */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setField("accent", preset.hex)}
                        title={preset.label}
                        className={cn(
                          "flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[0.7rem] transition-all",
                          form.accent.toLowerCase() === preset.hex.toLowerCase()
                            ? "border-primary bg-primary/10 font-bold text-foreground"
                            : "border-hair bg-surface/50 text-muted-foreground hover:border-foreground/30",
                        )}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lucide Icon Picker */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="c-icon">أيقونة الفئة (Lucide Icon)</Label>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>المعاينة:</span>
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-md border"
                        style={{
                          backgroundColor: `${form.accent}20`,
                          color: form.accent,
                          borderColor: `${form.accent}40`,
                        }}
                      >
                        <SelectedIcon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>

                  <Input
                    id="c-icon"
                    value={form.icon}
                    onChange={(e) => setField("icon", e.target.value)}
                    placeholder="Cpu, Gamepad2, Coins..."
                    dir="ltr"
                    className="font-tech text-sm"
                  />

                  {/* Quick Icon Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {POPULAR_ICONS.map((ico) => {
                      const IcoComp = resolveIcon(ico.name);
                      const isSelected = form.icon.toLowerCase() === ico.name.toLowerCase();
                      return (
                        <button
                          key={ico.name}
                          type="button"
                          onClick={() => setField("icon", ico.name)}
                          className={cn(
                            "flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-all",
                            isSelected
                              ? "border-primary bg-primary/15 font-bold text-primary"
                              : "border-hair bg-surface/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                          )}
                        >
                          <IcoComp className="h-3 w-3" />
                          <span>{ico.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cover Image */}
                <div className="space-y-1.5">
                  <ImageUpload
                    folder="hypertech/categories"
                    aspect="cover"
                    max={1}
                    value={form.image.trim() ? [form.image.trim()] : []}
                    onChange={(images) => setField("image", images[0] ?? "")}
                    label="صورة الغلاف والعالم"
                  />
                  <p className="text-[0.68rem] text-faint">
                    صورة عريضة عالية الجودة لخلفية كارت العالم في البوابة وصفحة الفئة.
                  </p>
                </div>

                {/* Display Order & Active State */}
                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="c-order">ترتيب الظهور</Label>
                    <Input
                      id="c-order"
                      type="number"
                      min={0}
                      dir="ltr"
                      className="font-tech"
                      value={form.order}
                      onChange={(e) => setField("order", e.target.value)}
                      placeholder="0 (الأول)"
                    />
                    <p className="text-[0.68rem] text-faint">
                      الرقم الأصغر يظهر أولاً في عوالم المتجر.
                    </p>
                  </div>

                  <div className="flex flex-col justify-end">
                    <div className="flex items-center justify-between rounded-xl border border-hair bg-raised/60 p-3">
                      <div>
                        <Label htmlFor="dialog-cat-active" className="text-xs font-semibold">
                          الحالة في المتجر
                        </Label>
                        <span className="block text-[0.65rem] text-faint">
                          {form.active ? "مفعلة وتظهر للمستخدمين" : "معطلة ومخفية"}
                        </span>
                      </div>
                      <Switch
                        id="dialog-cat-active"
                        checked={form.active}
                        onCheckedChange={(next) => setField("active", next)}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="flex items-center justify-end gap-2 border-t border-hair px-6 py-4">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={pending}>
              إلغاء
            </Button>
            <Button onClick={submit} disabled={pending || (attempted && !!nameError)}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Check className="h-4 w-4" aria-hidden />
              )}
              {editing ? "حفظ التعديلات" : "إضافة الفئة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --------------------------- Delete confirmation --------------------------- */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle>حذف الفئة؟</AlertDialogTitle>
            <AlertDialogDescription>
              المنتجات التابعة لن تُحذف وستبقى بدون فئة في الكتالوج. حذف فئة «{deleteTarget?.name}» نهائي
              ولا يمكن التراجع عنه.
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
              حذف الفئة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
