"use client";

/**
 * ============================================================
 * HYPER TECH — Admin Categories Manager
 * ============================================================
 * Category cards with live product counts, accent swatches and
 * ordering arrows. NO hardcoded category names — everything is
 * read from the store (dynamic categories mandate).
 * ============================================================
 */

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  FolderTree,
  Loader2,
  Palette,
  Pencil,
  Plus,
  Trash2,
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

/* ------------------------------- Form model ------------------------------- */

interface CategoryForm {
  name: string;
  tagline: string;
  description: string;
  accent: string;
  icon: string;
  image: string;
  order: string;
}

const EMPTY_FORM: CategoryForm = {
  name: "",
  tagline: "",
  description: "",
  accent: "#1a5ca6",
  icon: "",
  image: "",
  order: "",
};

/** Local slug generator (mirrors the repository's approach). */
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
      accent: c.accent,
      icon: c.icon,
      image: c.image,
      order: String(c.order),
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
      if (editing) {
        await repositories.categories.update(editing.id, {
          name: form.name.trim(),
          tagline: form.tagline.trim(),
          description: form.description.trim(),
          accent: form.accent,
          icon: form.icon.trim() || "Package",
          image: form.image.trim(),
          order: Math.max(0, Math.floor(Number(form.order || "0") || 0)),
        });
        toast.success("تم تحديث الفئة");
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
          order: form.order.trim()
            ? Math.max(0, Math.floor(Number(form.order) || 0))
            : maxOrder + 1,
        });
        toast.success("تمت إضافة الفئة");
      }
      setDialogOpen(false);
    } catch {
      toast.error("حدث خطأ غير متوقع — جرّب تاني");
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
    } catch {
      toast.error("تعذر تحديث الترتيب");
    } finally {
      setReorderPending(null);
    }
  };

  /* Storefront visibility toggle — hidden categories disappear from
     the homepage sections + category bar, but keep their products. */
  const toggleActive = async (c: Category, next: boolean) => {
    if (visibilityPendingId) return;
    setVisibilityPendingId(c.id);
    try {
      await repositories.categories.update(c.id, { active: next });
      toast.success(
        next
          ? `«${c.name}» ظاهرة في المتجر الآن`
          : `«${c.name}» اتحجبت من المتجر`,
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

  /* --------------------------------- Render -------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">الفئات</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-tech">{categories.length}</span> فئة — الترتيب هنا هو ترتيب
            ظهورها في المتجر
          </p>
        </div>
        <Button onClick={openCreate} className="min-h-9 glow-accent-sm">
          <Plus className="h-4 w-4" aria-hidden />
          إضافة فئة
        </Button>
      </div>

      {/* Cards grid */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="لا توجد فئات"
          hint="أضف أول فئة ليبدأ تنظيم الكتالوج."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((c, idx) => {
            const count = productCounts.get(c.id) ?? 0;
            const busy = reorderPending === c.id;
            return (
              <article
                key={c.id}
                className="group overflow-hidden rounded-2xl border border-hair bg-surface/60 transition-colors hover:border-primary/25"
              >
                <div className="relative h-28 overflow-hidden bg-elevated">
                  {c.image ? (
                    <img
                      src={c.image}
                      alt={`غلاف فئة ${c.name}`}
                      loading="lazy"
                      className="img-grade h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-faint">
                      <FolderTree className="h-8 w-8" aria-hidden />
                    </span>
                  )}
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-full bg-[#24221d]/55 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: c.accent }}
                      aria-hidden
                    />
                    {c.name}
                  </span>
                  {c.active === false ? (
                    <span className="absolute left-2 top-2 rounded-full bg-[#24221d]/55 px-2.5 py-1 text-[0.65rem] font-bold text-white backdrop-blur">
                      مخفية
                    </span>
                  ) : null}
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="text-base font-bold">{c.name}</h3>
                    <p className="font-tech text-xs text-faint" dir="ltr">
                      /{c.slug}
                    </p>
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{c.tagline}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      <span className="font-tech font-bold text-foreground">{count}</span> منتج
                      تابع
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      لون التمييز
                      <span
                        className="h-3.5 w-3.5 rounded-md border border-foreground/20"
                        style={{ backgroundColor: c.accent }}
                        aria-hidden
                      />
                    </span>
                  </div>

                  {/* Storefront visibility */}
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-hair bg-raised/60 px-3 py-2.5">
                    <span className="min-w-0">
                      <Label htmlFor={`cat-active-${c.id}`} className="text-xs font-medium">
                        {c.active !== false ? "ظاهرة في المتجر" : "مخفية"}
                      </Label>
                      <span className="mt-0.5 block text-[0.65rem] leading-4 text-faint">
                        {c.active !== false
                          ? "ظاهرة في أقسام الرئيسية وشريط الفئات"
                          : "مش ظاهرة في المتجر — منتجاتها لسه موجودة"}
                      </span>
                    </span>
                    <Switch
                      id={`cat-active-${c.id}`}
                      checked={c.active !== false}
                      disabled={visibilityPendingId === c.id}
                      onCheckedChange={(next) => toggleActive(c, next)}
                      aria-label={`ظهور فئة ${c.name} في المتجر`}
                      className="h-6 w-11 data-[state=unchecked]:bg-muted"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-hair pt-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => reorder(c.id, "up")}
                        disabled={idx === 0 || busy}
                        aria-label={`تقديم فئة ${c.name} في الترتيب`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => reorder(c.id, "down")}
                        disabled={idx === sorted.length - 1 || busy}
                        aria-label={`تأخير فئة ${c.name} في الترتيب`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" aria-hidden />
                      </button>
                      {busy ? (
                        <Loader2 className="mx-1 h-4 w-4 animate-spin text-primary" aria-hidden />
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        aria-label={`تعديل فئة ${c.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(c)}
                        aria-label={`حذف فئة ${c.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-danger/80 transition-colors hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
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
        <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
          <DialogHeader className="space-y-1 border-b border-hair px-6 py-4 text-right">
            <DialogTitle>{editing ? "تعديل الفئة" : "إضافة فئة جديدة"}</DialogTitle>
            <DialogDescription>
              الفئات هي عالم المتجر — لكل فئة لونها وصورتها وأيقونتها.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[58vh]">
            <div className="space-y-5 px-6 py-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="c-name">اسم الفئة *</Label>
                  <Input
                    id="c-name"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="مثال: لابتوب"
                  />
                  <FieldError>{attempted ? nameError : undefined}</FieldError>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-tagline">الوصف المختصر</Label>
                  <Input
                    id="c-tagline"
                    value={form.tagline}
                    onChange={(e) => setField("tagline", e.target.value)}
                    placeholder="سطر قصير يظهر تحت اسم الفئة"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-desc">الوصف</Label>
                  <Textarea
                    id="c-desc"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="وصف الفئة كما يظهر في صفحتها بالمتجر…"
                  />
                </div>
              </div>

              <FormSectionTitle icon={Palette}>الهوية البصرية</FormSectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="c-accent">لون التمييز</Label>
                  <div className="flex items-center gap-3">
                    <input
                      id="c-accent"
                      type="color"
                      value={form.accent}
                      onChange={(e) => setField("accent", e.target.value)}
                      aria-label="اختيار لون تمييز الفئة"
                      className="h-10 w-16 cursor-pointer rounded-lg border border-hair bg-transparent p-1"
                    />
                    <span
                      className="h-6 w-10 rounded-md border border-foreground/20"
                      style={{ backgroundColor: form.accent }}
                      aria-hidden
                    />
                    <span className="font-tech text-xs text-muted-foreground" dir="ltr">
                      {form.accent}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-icon">اسم الأيقونة</Label>
                  <Input
                    id="c-icon"
                    value={form.icon}
                    onChange={(e) => setField("icon", e.target.value)}
                    placeholder="Laptop"
                    dir="ltr"
                    className="font-tech text-sm"
                  />
                  <p className="text-[0.68rem] text-faint">
                    اسم أيقونة Lucide مثل Laptop — بيفضل فارغًا بنستخدم أيقونة افتراضية.
                  </p>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <ImageUpload
                    folder="hypertech/categories"
                    aspect="cover"
                    max={1}
                    value={form.image.trim() ? [form.image.trim()] : []}
                    onChange={(images) => setField("image", images[0] ?? "")}
                    label="صورة الغلاف"
                  />
                  <p className="text-[0.68rem] text-faint">
                    صورة عريضة للفئة — اسحبها وافلتها للرفع المباشر أو الصق رابط.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-order">الترتيب</Label>
                  <Input
                    id="c-order"
                    type="number"
                    min={0}
                    dir="ltr"
                    className="font-tech"
                    value={form.order}
                    onChange={(e) => setField("order", e.target.value)}
                    placeholder="تلقائي"
                  />
                  <p className="text-[0.68rem] text-faint">
                    الأصغر يظهر أولًا — بيتحدد تلقائيًا لو فاضي.
                  </p>
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
                <Plus className="h-4 w-4" aria-hidden />
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
              المنتجات التابعة لن تُحذف — ستبقى بدون فئة. حذف فئة «{deleteTarget?.name}» نهائي
              ولا يمكن التراجع.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className={cn("bg-danger text-white hover:bg-danger/90")}
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
