"use client";

/**
 * ============================================================
 * HYPER TECH — Store View (Amazon-style catalog) · Light
 * ============================================================
 * • "all" mode      → كل المنتجات + شريط عوالم الفئات (<lg).
 * • category mode   → hero band بصبغة category.accent.
 * • builds world    → شبكة تجميعات BuildCard + زر للتجربة الكاملة.
 * • سطح المكتب (lg+): شريط فلاتر ثابت على اليمين — فئات / سعر /
 *   توفر / ماركات — بعدّادات ذكية بأسلوب أمازون (كل قسم بيحترم
 *   فلاتر الأقسام التانية).
 * • الموبايل (<lg): درج فلاتر سفلي بنفس الأقسام + زر عرض النتائج.
 * • حالة الفلاتر متزامنة مع الـ URL:
 *   #/store?cat={slug}&brand={name}&min={n}&max={n}&avail=…&sort=…&q=…
 *   روابط قابلة للمشاركة + back/forward بيرجّع حالة الفلاتر.
 *   الفلترة نفس دلالات repositories.applyFilter (+ ترتيب rating محلي).
 * ============================================================
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Cpu,
  FilterX,
  Gamepad2,
  HardDrive,
  Headphones,
  Keyboard,
  Laptop,
  LayoutGrid,
  MemoryStick,
  Mouse,
  Package,
  PackageSearch,
  Search,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Category, Product, ProductAvailability } from "@/types";
import { useRouterStore, type StoreFilters } from "@/lib/router";
import { useMockDB } from "@/lib/store/db-store";
import { ViewHeader } from "@/components/layout/view-header";
import { NotFoundView } from "@/components/layout/not-found";
import { ProductCard } from "@/components/store/product-card";
import { BuildCard } from "@/components/builds/build-card";
import { Reveal, StaggerReveal } from "@/components/motion/reveal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { EASE, prefersReducedMotion } from "@/lib/motion";
import { formatPriceCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ------------------------- constants & helpers ------------------------ */

/**
 * اصطلاح توجيه (routing convention) وليس اسمًا معروضًا: الفئة صاحبة
 * هذا الـ slug تعرض تجميعات PC بدل المنتجات — الأسماء كلها من المتجر.
 */
const BUILDS_SLUG = "builds";

type SortKey = "newest" | "price-asc" | "price-desc" | "featured" | "rating";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "الأحدث" },
  { value: "price-asc", label: "السعر: من الأقل" },
  { value: "price-desc", label: "السعر: من الأعلى" },
  { value: "featured", label: "المميزة أولاً" },
  { value: "rating", label: "الأعلى تقييمًا" },
];
const VALID_SORTS = new Set<string>(SORT_OPTIONS.map((o) => o.value));

const AVAILABILITY_FILTERS: { value: ProductAvailability; label: string }[] = [
  { value: "in-stock", label: "متوفر" },
  { value: "low-stock", label: "كمية محدودة" },
  { value: "pre-order", label: "حجز مسبق" },
  { value: "out-of-stock", label: "غير متوفر" },
];

/** Category icon-name → Lucide component (admin data stays a string) */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Laptop,
  Gamepad2,
  Mouse,
  Keyboard,
  MemoryStick,
  HardDrive,
  Cpu,
  Headphones,
};
const categoryIcon = (name: string): LucideIcon => CATEGORY_ICONS[name] ?? Package;

function getPageNumbers(current: number, total: number): number[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: number[] = [1];
  if (current > 3) pages.push(-1);
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push(-1);
  pages.push(total);
  return pages;
}

/** زمن الـ skeleton عند دخول عالم (بحث/فلاتر تبقى فورية بلا أي تأخير) */
const SKELETON_MS = 420;

/** خطوة منزلق السعر (جنيه) */
const PRICE_STEP = 250;

/** مهلة مزامنة كلمة البحث مع الـ URL (replace — من غير spam للتاريخ) */
const SEARCH_SYNC_MS = 500;

/** color-mix() للصبغة الديناميكية — يقبل hex أو CSS vars مثل var(--primary) */
const mix = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/** أرقام هندية للعدّ البشري (الأسعار/الكميات التقنية تظل لاتينية بـ font-tech) */
function arabicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

/** صيغة الجمع العربية الطبيعية */
function arabicCount(n: number, noun: { one: string; two: string; few: string; many: string }): string {
  if (n === 0) return `لا ${noun.few}`;
  if (n === 1) return noun.one;
  if (n === 2) return noun.two;
  if (n <= 10) return `${arabicDigits(n)} ${noun.few}`;
  return `${arabicDigits(n)} ${noun.many}`;
}
const PRODUCT_NOUN = { one: "منتج واحد", two: "منتجان", few: "منتجات", many: "منتج" };
const BUILD_NOUN = { one: "تجميعة واحدة", two: "تجميعتان", few: "تجميعات", many: "تجميعة" };

function parsePriceInput(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/* --------------------- route ⇄ filter state helpers -------------------- */

function toSortKey(raw?: string): SortKey {
  return raw && VALID_SORTS.has(raw) ? (raw as SortKey) : "newest";
}

function sanitizeAvailability(raw?: string[]): ProductAvailability[] {
  const valid = new Set<string>(AVAILABILITY_FILTERS.map((a) => a.value));
  const out: ProductAvailability[] = [];
  new Set(raw ?? []).forEach((v) => {
    if (valid.has(v)) out.push(v as ProductAvailability);
  });
  return out;
}

/** الماركة في الـ URL: قيمة واحدة (رابط قديم) أو قائمة مفصولة بفواصل */
function parseBrandList(raw?: string): string[] {
  if (!raw) return [];
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];
}

/** يبني StoreFilters من القيم الحالية — القيم الافتراضية مبت تشيلها */
function buildFilters(f: {
  q: string;
  sort: SortKey;
  min?: number;
  max?: number;
  availability: ProductAvailability[];
}): StoreFilters {
  const out: StoreFilters = {};
  if (f.min !== undefined) out.min = f.min;
  if (f.max !== undefined) out.max = f.max;
  if (f.availability.length) out.availability = [...f.availability];
  if (f.sort !== "newest") out.sort = f.sort;
  if (f.q) out.q = f.q;
  return out;
}

/* ---------------------------- subcomponents --------------------------- */

function WorldChip({
  active,
  accent,
  label,
  count,
  onClick,
  ariaLabel,
}: {
  active: boolean;
  accent: string;
  label: string;
  count: number;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition-all duration-300 active:scale-95",
        !active && "border-hair bg-elevated/70 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
      )}
      style={
        active
          ? {
              borderColor: mix(accent, 55),
              background: mix(accent, 12),
              color: accent,
              boxShadow: `0 6px 18px -8px ${mix(accent, 55)}`,
            }
          : undefined
      }
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
      {label}
      <span className="text-[0.65rem] font-medium opacity-75">{arabicDigits(count)}</span>
    </button>
  );
}

/** رقاقة فلتر نشط — بتظهر بـ pop صغير (GSAP) وتشيل الفلتر بالضغط عليها */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    gsap.fromTo(
      el,
      { scale: 0.72, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.34, ease: EASE.spring, clearProps: "transform,opacity" }
    );
  }, []);
  return (
    <button
      ref={ref}
      type="button"
      onClick={onRemove}
      aria-label={`إزالة فلتر ${label}`}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/30 bg-primary/[0.07] px-3 py-1.5 text-xs font-bold text-primary transition-all duration-200 hover:bg-primary/[0.12] active:scale-95"
    >
      <span className="truncate">{label}</span>
      <X className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
    </button>
  );
}

/** صف فئة (radio) في قائمة الفلاتر — اللمسة الافتراضية 44px */
function CategoryRow({
  icon,
  label,
  count,
  active,
  onClick,
  drawer,
}: {
  icon: LucideIcon;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  drawer: boolean;
}) {
  const Ico = icon;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-3 text-right transition-all duration-200",
        drawer ? "min-h-12 py-2.5" : "min-h-11 py-2",
        active
          ? "border-primary/30 bg-primary/10 font-bold text-primary"
          : "border-transparent text-foreground hover:border-hair hover:bg-foreground/[0.04]"
      )}
    >
      <Ico className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} aria-hidden />
      <span className="flex-1 truncate text-sm">{label}</span>
      <span className="shrink-0 font-tech text-[0.7rem] tabular-nums text-faint">{count}</span>
    </button>
  );
}

/** صف checkbox (توفر / ماركة) — الصف كله هدف اللمس */
function FacetRow({
  label,
  count,
  checked,
  onToggle,
  drawer,
}: {
  label: string;
  count: number;
  checked: boolean;
  onToggle: () => void;
  drawer: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-3 text-right transition-all duration-200",
        drawer ? "min-h-12 py-2.5" : "min-h-11 py-2",
        checked
          ? "border-primary/30 bg-primary/10 font-bold text-primary"
          : "border-transparent text-foreground hover:border-hair hover:bg-foreground/[0.04]"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px] border transition-colors duration-200",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-foreground/25 bg-elevated"
        )}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3.5} />}
      </span>
      <span className="flex-1 truncate text-sm">{label}</span>
      <span className="shrink-0 font-tech text-[0.7rem] tabular-nums text-faint">{count}</span>
    </button>
  );
}

/** خانة رقمية للسعر — ج.م ثابتة على الشمال */
function PriceInput({
  value,
  placeholder,
  onChange,
  onCommit,
  ariaLabel,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  onCommit: () => void;
  ariaLabel: string;
}) {
  return (
    <div className="relative min-w-0 flex-1" data-vaul-no-drag>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        aria-label={ariaLabel}
        className="h-11 w-full rounded-xl border border-hair bg-elevated px-3 pl-9 font-tech text-xs tabular-nums text-foreground outline-none transition-colors [appearance:textfield] placeholder:font-sans placeholder:text-faint focus-visible:border-primary/60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[0.6rem] font-medium text-faint"
        aria-hidden
      >
        ج.م
      </span>
    </div>
  );
}

/** قسم السعر: منزلق مزدوج + خانتا من/إلى + تسمية النطاق */
function PriceFilterBlock({
  floor,
  ceil,
  lo,
  hi,
  minPrice,
  maxPrice,
  onLive,
  onMinInput,
  onMaxInput,
  onCommit,
}: {
  floor: number;
  ceil: number;
  lo: number;
  hi: number;
  minPrice: string;
  maxPrice: string;
  onLive: (lo: number, hi: number) => void;
  onMinInput: (v: string) => void;
  onMaxInput: (v: string) => void;
  onCommit: () => void;
}) {
  return (
    <div data-vaul-no-drag className="pt-1">
      <Slider
        dir="rtl"
        min={floor}
        max={ceil}
        step={PRICE_STEP}
        value={[lo, hi]}
        onValueChange={(v) => onLive(v[0] ?? floor, v[1] ?? ceil)}
        onValueCommit={onCommit}
        aria-label="نطاق السعر بالجنيه المصري"
        className="mx-1 py-2"
      />
      <div className="mt-2 flex items-center gap-2">
        <PriceInput value={minPrice} placeholder="من" onChange={onMinInput} onCommit={onCommit} ariaLabel="الحد الأدنى للسعر" />
        <span className="shrink-0 text-faint" aria-hidden>
          —
        </span>
        <PriceInput value={maxPrice} placeholder="إلى" onChange={onMaxInput} onCommit={onCommit} ariaLabel="الحد الأعلى للسعر" />
      </div>
      <p className="mt-2.5 text-center font-tech text-[0.66rem] tabular-nums text-faint" dir="ltr">
        {formatPriceCompact(lo)} — {formatPriceCompact(hi)} ج.م
      </p>
    </div>
  );
}

/* ------- لوحة الفلاتر المشتركة (الشريط الجانبي + درج الموبايل) ------- */

interface FilterPanelProps {
  variant: "sidebar" | "drawer";
  sortedCategories: Category[];
  categoryCounts: Map<string, number>;
  allCount: number;
  buildsCount: number;
  activeCategorySlug?: string;
  onCategory: (slug?: string) => void;
  floor: number;
  ceil: number;
  sliderLo: number;
  sliderHi: number;
  minPrice: string;
  maxPrice: string;
  onPriceLive: (lo: number, hi: number) => void;
  onMinInput: (v: string) => void;
  onMaxInput: (v: string) => void;
  onPriceCommit: () => void;
  availability: ProductAvailability[];
  availabilityCounts: Record<ProductAvailability, number>;
  onToggleAvailability: (v: ProductAvailability) => void;
  brandList: { name: string; count: number }[];
  selectedBrands: string[];
  onToggleBrand: (name: string) => void;
  activeCount: number;
  onClearAll: () => void;
}

function FilterPanel(p: FilterPanelProps) {
  const drawer = p.variant === "drawer";
  return (
    <div className={cn("flex flex-col", drawer ? "gap-5" : "gap-4")}>
      {/* رأس اللوحة */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-bold text-foreground">تصفية النتائج</h2>
        {p.activeCount > 0 && (
          <button
            type="button"
            onClick={p.onClearAll}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
          >
            <FilterX className="h-3.5 w-3.5" aria-hidden />
            مسح الكل
          </button>
        )}
      </div>

      {/* الفئات */}
      <section aria-label="تصفية حسب الفئة">
        <h3 className="mb-2 font-display text-[0.78rem] font-bold text-foreground">الفئات</h3>
        <div role="radiogroup" aria-label="الفئات" className="flex flex-col gap-1">
          <CategoryRow
            icon={LayoutGrid}
            label="كل المنتجات"
            count={p.allCount}
            active={!p.activeCategorySlug}
            onClick={() => p.onCategory(undefined)}
            drawer={drawer}
          />
          {p.sortedCategories.map((c) => (
            <CategoryRow
              key={c.id}
              icon={categoryIcon(c.icon)}
              label={c.name}
              count={c.slug === BUILDS_SLUG ? p.buildsCount : (p.categoryCounts.get(c.id) ?? 0)}
              active={p.activeCategorySlug === c.slug}
              onClick={() => p.onCategory(c.slug)}
              drawer={drawer}
            />
          ))}
        </div>
      </section>

      <Separator className="bg-hair" />

      {/* السعر */}
      <section aria-label="تصفية حسب السعر">
        <h3 className="mb-2 font-display text-[0.78rem] font-bold text-foreground">السعر</h3>
        <PriceFilterBlock
          floor={p.floor}
          ceil={p.ceil}
          lo={p.sliderLo}
          hi={p.sliderHi}
          minPrice={p.minPrice}
          maxPrice={p.maxPrice}
          onLive={p.onPriceLive}
          onMinInput={p.onMinInput}
          onMaxInput={p.onMaxInput}
          onCommit={p.onPriceCommit}
        />
      </section>

      <Separator className="bg-hair" />

      {/* التوفر */}
      <section aria-label="تصفية حسب التوفر">
        <h3 className="mb-2 font-display text-[0.78rem] font-bold text-foreground">التوفر</h3>
        <div role="group" aria-label="التوفر" className="flex flex-col gap-1">
          {AVAILABILITY_FILTERS.map((a) => (
            <FacetRow
              key={a.value}
              label={a.label}
              count={p.availabilityCounts[a.value]}
              checked={p.availability.includes(a.value)}
              onToggle={() => p.onToggleAvailability(a.value)}
              drawer={drawer}
            />
          ))}
        </div>
      </section>

      <Separator className="bg-hair" />

      {/* الماركات */}
      <section aria-label="تصفية حسب الماركة">
        <h3 className="mb-2 font-display text-[0.78rem] font-bold text-foreground">الماركات</h3>
        <div
          role="group"
          aria-label="الماركات"
          className={cn("flex flex-col gap-1 overflow-y-auto pl-1", drawer ? "max-h-72" : "max-h-60")}
        >
          {p.brandList.map((b) => (
            <FacetRow
              key={b.name}
              label={b.name}
              count={b.count}
              checked={p.selectedBrands.includes(b.name)}
              onToggle={() => p.onToggleBrand(b.name)}
              drawer={drawer}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------ the view ------------------------------ */

interface RoutePatch {
  /** null = امسح الفئة (كل المنتجات) */
  categorySlug?: string | null;
  brands?: string[];
  q?: string;
  sort?: SortKey;
  /** null = امسح الحد */
  min?: number | null;
  max?: number | null;
  availability?: ProductAvailability[];
  replace?: boolean;
}

export default function StoreView({
  categorySlug,
  brand,
  filters,
}: {
  categorySlug?: string;
  brand?: string;
  filters?: StoreFilters;
}) {
  const products = useMockDB((s) => s.products);
  const categories = useMockDB((s) => s.categories);
  const builds = useMockDB((s) => s.builds);
  const settings = useMockDB((s) => s.settings);
  const navigate = useRouterStore((s) => s.navigate);

  /* ---- حالة الفلاتر المحلية (استجابة فورية) — الـ URL هو المرجع ---- */
  const [search, setSearch] = useState(filters?.q ?? "");
  const [sort, setSort] = useState<SortKey>(toSortKey(filters?.sort));
  const [minPrice, setMinPrice] = useState(filters?.min !== undefined ? String(filters.min) : "");
  const [maxPrice, setMaxPrice] = useState(filters?.max !== undefined ? String(filters.max) : "");
  const [availability, setAvailability] = useState<ProductAvailability[]>(sanitizeAvailability(filters?.availability));
  const [brandsFilter, setBrandsFilter] = useState<string[]>(parseBrandList(brand));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  /*
   * "Adjust state when props change" الرسمية من React — بدل Effect:
   * لما الـ route يتغير (deep-link / back-forward / رابط خارجي)،
   * الحالة تشتق من جديد. تغيّر "العالم" (فئة) بيشغّل skeleton؛
   * تغيّر الفلاتر بس بيظل فوري.
   */
  const routeSig = [
    categorySlug ?? "",
    brand ?? "",
    filters?.min ?? "",
    filters?.max ?? "",
    (filters?.availability ?? []).join(","),
    filters?.sort ?? "newest",
    filters?.q ?? "",
  ].join("|");
  const [prevSig, setPrevSig] = useState(routeSig);
  const [prevWorld, setPrevWorld] = useState(categorySlug ?? "all");
  if (routeSig !== prevSig) {
    const worldChanged = (categorySlug ?? "all") !== prevWorld;
    setPrevSig(routeSig);
    setSearch(filters?.q ?? "");
    setSort(toSortKey(filters?.sort));
    setMinPrice(filters?.min !== undefined ? String(filters.min) : "");
    setMaxPrice(filters?.max !== undefined ? String(filters.max) : "");
    setAvailability(sanitizeAvailability(filters?.availability));
    setBrandsFilter(parseBrandList(brand));
    if (worldChanged) {
      setPrevWorld(categorySlug ?? "all");
      setLoading(true);
      setDrawerOpen(false);
    }
  }

  /* دخول عالم جديد = skeleton قصير واقعي (البحث والفلاتر تظل لحظية) */
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), SKELETON_MS);
    return () => clearTimeout(t);
  }, [categorySlug]);

  const category = categorySlug ? categories.find((c) => c.slug === categorySlug) : undefined;
  const accent = category?.accent ?? "var(--primary)";
  const isBuildsWorld = category?.slug === BUILDS_SLUG;

  const sortedCategories = useMemo(
    () =>
      [...categories]
        .sort((a, b) => a.order - b.order)
        .filter((c) => c.active !== false)
        .filter((c) => c.slug !== BUILDS_SLUG || settings.showBuildsCategory !== false),
    [categories, settings.showBuildsCategory]
  );

  /* نطاق العرض الحالي (كل المنتجات أو فئة واحدة) */
  const base = useMemo(
    () => (category ? products.filter((p) => p.categoryId === category.id) : products),
    [products, category]
  );

  /* حدود منزلق السعر — من الكتالوج الحالي بخطوات 250 ج.م */
  const { floor, ceil } = useMemo(() => {
    if (!base.length) return { floor: 0, ceil: PRICE_STEP };
    const lo = Math.min(...base.map((p) => p.price));
    const hi = Math.max(...base.map((p) => p.price));
    const f = Math.max(0, Math.floor(lo / PRICE_STEP) * PRICE_STEP);
    let c = Math.ceil(hi / PRICE_STEP) * PRICE_STEP;
    if (c - f < PRICE_STEP) c = f + PRICE_STEP;
    return { floor: f, ceil: c };
  }, [base]);

  /* ---------------- الفلترة (نفس دلالات applyFilter) ---------------- */
  const q = search.trim().toLowerCase();
  const min = parsePriceInput(minPrice);
  const max = parsePriceInput(maxPrice);

  /**
   * مصنع مطابقة بأسلوب أمازون: كل بعد له عَلم — العدّادات بتتحسب
   * بكل الفلاتر "التانية" شغالة والبعد نفسه مطفي.
   */
  const matchesWith =
    (dims: { category: boolean; availability: boolean; brands: boolean }) =>
    (p: Product) => {
      if (dims.category && category && p.categoryId !== category.id) return false;
      if (q && !`${p.name} ${p.brand} ${p.shortDescription} ${p.description}`.toLowerCase().includes(q)) return false;
      if (min !== undefined && p.price < min) return false;
      if (max !== undefined && p.price > max) return false;
      if (dims.availability && availability.length && !availability.includes(p.availability)) return false;
      if (dims.brands && brandsFilter.length && !brandsFilter.includes(p.brand)) return false;
      return true;
    };

  /* العدّادات الذكية لكل قسم */
  const facets = useMemo(() => {
    const byCat = matchesWith({ category: false, availability: true, brands: true });
    const byAvail = matchesWith({ category: true, availability: false, brands: true });
    const byBrand = matchesWith({ category: true, availability: true, brands: false });
    const perCategory = new Map<string, number>();
    const availabilityCounts: Record<ProductAvailability, number> = {
      "in-stock": 0,
      "low-stock": 0,
      "pre-order": 0,
      "out-of-stock": 0,
    };
    const brandCounts = new Map<string, number>();
    let allCount = 0;
    products.forEach((p) => {
      if (byCat(p)) {
        allCount++;
        perCategory.set(p.categoryId, (perCategory.get(p.categoryId) ?? 0) + 1);
      }
      if (byAvail(p)) availabilityCounts[p.availability] += 1;
      if (byBrand(p)) brandCounts.set(p.brand, (brandCounts.get(p.brand) ?? 0) + 1);
    });
    return { perCategory, availabilityCounts, brandCounts, allCount };
  }, [products, category, q, min, max, availability, brandsFilter]);

  /* النتائج النهائية بالترتيب المطلوب */
  const filtered = useMemo(() => {
    const full = matchesWith({ category: true, availability: true, brands: true });
    const out = products.filter(full);
    switch (sort) {
      case "price-asc":
        out.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        out.sort((a, b) => b.price - a.price);
        break;
      case "featured":
        out.sort((a, b) => Number(b.featured) - Number(a.featured));
        break;
      case "rating":
        out.sort((a, b) => b.rating - a.rating);
        break;
      default:
        out.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return out;
  }, [products, category, q, min, max, availability, brandsFilter, sort]);

  /* قائمة الماركات: كل ماركات النطاق الحالي مرتبة بالعدد */
  const brandList = useMemo(() => {
    const names = new Set(base.map((p) => p.brand));
    return [...names]
      .map((name) => ({ name, count: facets.brandCounts.get(name) ?? 0 }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [base, facets]);

  /* -------------------------- ترقيم الصفحات -------------------------- */
  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);

  /* إعادة التعيين للصفحة الأولى عند تغير أي فلتر */
  useEffect(() => {
    setPage(1);
  }, [categorySlug, brandsFilter, search, sort, minPrice, maxPrice, availability]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const topEl = document.getElementById("catalog-grid-top");
    if (topEl) {
      topEl.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 380, behavior: "smooth" });
    }
  };

  /* ---------------------- المزامنة مع الـ URL ---------------------- */

  const latestRef = useRef({ search, sort, minPrice, maxPrice, availability, brandsFilter, categorySlug });
  latestRef.current = { search, sort, minPrice, maxPrice, availability, brandsFilter, categorySlug };

  /** ينقل الحالة الحالية للـ URL (push = خطوة تاريخ، replace = تحديث هادئ) */
  const pushRoute = (patch: RoutePatch = {}) => {
    const brands = patch.brands ?? brandsFilter;
    const qVal = patch.q !== undefined ? patch.q : search.trim();
    const sortVal = patch.sort ?? sort;
    const minVal = patch.min !== undefined ? (patch.min ?? undefined) : min;
    const maxVal = patch.max !== undefined ? (patch.max ?? undefined) : max;
    const availVal = patch.availability ?? availability;
    navigate(
      {
        name: "store",
        categorySlug: patch.categorySlug !== undefined ? (patch.categorySlug ?? undefined) : categorySlug,
        brand: brands.length ? brands.join(",") : undefined,
        filters: buildFilters({ q: qVal, sort: sortVal, min: minVal, max: maxVal, availability: availVal }),
      },
      { replace: patch.replace === true }
    );
  };

  /* البحث لحظي محليًا؛ الـ URL بيتحدث debounce (replace) */
  useEffect(() => {
    const t = setTimeout(() => {
      const s = latestRef.current;
      navigate(
        {
          name: "store",
          categorySlug: s.categorySlug,
          brand: s.brandsFilter.length ? s.brandsFilter.join(",") : undefined,
          filters: buildFilters({
            q: s.search.trim(),
            sort: s.sort,
            min: parsePriceInput(s.minPrice),
            max: parsePriceInput(s.maxPrice),
            availability: s.availability,
          }),
        },
        { replace: true }
      );
    }, SEARCH_SYNC_MS);
    return () => clearTimeout(t);
  }, [search, navigate]);

  /* ---------------------------- التفاعلات ---------------------------- */

  const goCategory = (slug?: string) => {
    setDrawerOpen(false);
    pushRoute({ categorySlug: slug ?? null });
  };

  const toggleAvailability = (value: ProductAvailability) => {
    const next = availability.includes(value)
      ? availability.filter((v) => v !== value)
      : [...availability, value];
    setAvailability(next);
    pushRoute({ availability: next });
  };

  const toggleBrand = (name: string) => {
    const next = brandsFilter.includes(name) ? brandsFilter.filter((b) => b !== name) : [...brandsFilter, name];
    setBrandsFilter(next);
    pushRoute({ brands: next });
  };

  const changeSort = (value: SortKey) => {
    setSort(value);
    pushRoute({ sort: value });
  };

  /* منزلق السعر: فلترة حية أثناء السحب + commit للـ URL عند الإفلات */
  const snap = (v: number) => Math.min(ceil, Math.max(floor, Math.round((v - floor) / PRICE_STEP) * PRICE_STEP + floor));
  const sliderLo = min !== undefined ? snap(min) : floor;
  const sliderHi = max !== undefined ? Math.max(snap(max), sliderLo) : ceil;

  const applySlider = (lo: number, hi: number) => {
    setMinPrice(lo > floor ? String(lo) : "");
    setMaxPrice(hi < ceil ? String(hi) : "");
  };

  const commitPrice = () => {
    let mn = min;
    let mx = max;
    if (mn !== undefined && mx !== undefined && mn > mx) {
      [mn, mx] = [mx, mn];
      setMinPrice(String(mn));
      setMaxPrice(String(mx));
    }
    pushRoute({});
  };

  const clearSearch = () => {
    setSearch("");
    pushRoute({ q: "" });
  };

  const clearPrice = () => {
    setMinPrice("");
    setMaxPrice("");
    pushRoute({ min: null, max: null });
  };

  const clearAll = () => {
    setSearch("");
    setSort("newest");
    setMinPrice("");
    setMaxPrice("");
    setAvailability([]);
    setBrandsFilter([]);
    pushRoute({ q: "", sort: "newest", min: null, max: null, availability: [], brands: [] });
  };

  /* --------------------- الرقائق النشطة والعدّادات --------------------- */

  const activeChips: { id: string; label: string; onRemove: () => void }[] = [];
  if (category) {
    activeChips.push({
      id: `cat:${category.slug}`,
      label: category.name,
      onRemove: () => goCategory(undefined),
    });
  }
  brandsFilter.forEach((b) =>
    activeChips.push({ id: `brand:${b}`, label: b, onRemove: () => toggleBrand(b) })
  );
  if (min !== undefined || max !== undefined) {
    const label =
      min !== undefined && max !== undefined
        ? `السعر: ${formatPriceCompact(min)} — ${formatPriceCompact(max)} ج.م`
        : min !== undefined
          ? `السعر: من ${formatPriceCompact(min)} ج.م`
          : `السعر: حتى ${formatPriceCompact(max ?? 0)} ج.م`;
    activeChips.push({ id: "price", label, onRemove: clearPrice });
  }
  availability.forEach((a) =>
    activeChips.push({
      id: `avail:${a}`,
      label: AVAILABILITY_FILTERS.find((x) => x.value === a)?.label ?? a,
      onRemove: () => toggleAvailability(a),
    })
  );
  if (search.trim()) {
    activeChips.push({ id: "q", label: `بحث: «${search.trim()}»`, onRemove: clearSearch });
  }

  /* الفئة = عالم مش فلتر — العدّاد بيقيس الفلاتر الفعلية بس */
  const activeFilterCount = activeChips.length - (category ? 1 : 0);

  const resultsLabel =
    filtered.length === 0
      ? "لا نتائج مطابقة"
      : filtered.length === 1
        ? "عرض نتيجة واحدة"
        : filtered.length === 2
          ? "عرض نتيجتين"
          : `عرض ${arabicDigits(filtered.length)} نتائج`;

  /* مفتاح إعادة تشغيل دخول الكروت عند تغيّر الفلاتر */
  const filterHash = [
    categorySlug ?? "all",
    brand ?? "",
    search.trim().toLowerCase(),
    sort,
    minPrice.trim(),
    maxPrice.trim(),
    [...availability].sort().join(","),
    [...brandsFilter].sort().join(","),
  ].join("|");

  /* slug فئة مش موجودة → dead-end أنيق */
  if (categorySlug && !category) {
    return <NotFoundView what="الفئة" />;
  }

  const panelProps: FilterPanelProps = {
    variant: "sidebar",
    sortedCategories,
    categoryCounts: facets.perCategory,
    allCount: facets.allCount,
    buildsCount: builds.length,
    activeCategorySlug: categorySlug,
    onCategory: goCategory,
    floor,
    ceil,
    sliderLo,
    sliderHi,
    minPrice,
    maxPrice,
    onPriceLive: applySlider,
    onMinInput: setMinPrice,
    onMaxInput: setMaxPrice,
    onPriceCommit: commitPrice,
    availability,
    availabilityCounts: facets.availabilityCounts,
    onToggleAvailability: toggleAvailability,
    brandList,
    selectedBrands: brandsFilter,
    onToggleBrand: toggleBrand,
    activeCount: activeFilterCount,
    onClearAll: clearAll,
  };

  return (
    <div className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6">
      {/* ===================== رأس العالم ===================== */}
      {category ? (
        <div className="relative">
          {/* Hero band: صورة الفئة + صبغة accent — "دخول عالم مختلف" */}
          <div aria-hidden className="absolute inset-0 overflow-hidden rounded-b-[2rem]">
            <img
              src={category.image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover img-grade opacity-25"
            />
            <span
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, ${mix(accent, 10)} 0%, transparent 45%), linear-gradient(0deg, #f7f5f0 0%, rgba(247,245,240,0.5) 22%, transparent 62%)`,
              }}
            />
          </div>
          <ViewHeader
            kicker={category.tagline}
            title={category.name}
            accent={accent}
            description={category.description}
          >
            <span
              className="mt-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold backdrop-blur-sm"
              style={{ borderColor: mix(accent, 45), background: mix(accent, 10), color: accent }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
              {isBuildsWorld
                ? arabicCount(builds.length, BUILD_NOUN)
                : arabicCount(facets.perCategory.get(category.id) ?? 0, PRODUCT_NOUN)}
            </span>
          </ViewHeader>
        </div>
      ) : (
        <ViewHeader
          kicker="المتجر"
          title={brandsFilter.length === 1 ? `منتجات ${brandsFilter[0]}` : "كل المنتجات"}
          description="كل حاجة عندنا في مكان واحد — اختار عالمك، وصفّي بالبحث والفلاتر لحد ما توصل على اللي يناسبك وميزانيتك."
        />
      )}

      {/* ====== شريط عوالم الفئات (موبايل/تابلت — سطح المكتب: الشريط الجانبي) ====== */}
      <nav
        aria-label="عوالم المتجر"
        className="-mx-4 mt-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 lg:hidden"
      >
        <ul className="flex w-max items-center gap-2">
          <li>
            <WorldChip
              active={!category}
              accent="var(--primary)"
              label="الكل"
              count={facets.allCount}
              onClick={() => goCategory(undefined)}
              ariaLabel="عرض كل المنتجات"
            />
          </li>
          {sortedCategories.map((c) => (
            <li key={c.id}>
              <WorldChip
                active={category?.id === c.id}
                accent={c.accent}
                label={c.name}
                count={c.slug === BUILDS_SLUG ? builds.length : (facets.perCategory.get(c.id) ?? 0)}
                onClick={() => goCategory(c.slug)}
                ariaLabel={`تصفح ${c.name}`}
              />
            </li>
          ))}
        </ul>
      </nav>

      {/* ===================== عالم التجميعات ===================== */}
      {isBuildsWorld ? (
        <>
          <Reveal dir="up" className="mt-6">
            <button
              type="button"
              onClick={() => navigate({ name: "builds" })}
              className="group flex w-full items-center justify-between gap-4 rounded-3xl border border-hair bg-elevated p-5 text-right shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-lg active:scale-[0.99] sm:p-6"
            >
              <span className="flex items-center gap-4">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
                  style={{ borderColor: mix(accent, 30), background: mix(accent, 12), color: accent }}
                >
                  <Cpu className="h-6 w-6" aria-hidden />
                </span>
                <span>
                  <span className="block font-display text-lg font-bold leading-7 sm:text-xl">
                    تجربة التجميعات الكاملة
                  </span>
                  <span className="mt-1 block text-xs leading-6 text-muted-foreground sm:text-sm sm:leading-7">
                    قارن التجميعات ببعضها، شوف مؤشرات الأداء المتوقعة، واختار اللي يناسب ميزانيتك — في صفحة مخصصة للتجميعات.
                  </span>
                </span>
              </span>
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-transform duration-300 group-hover:-translate-x-1"
                style={{ borderColor: mix(accent, 40), color: accent }}
                aria-hidden
              >
                <ArrowLeft className="h-5 w-5" />
              </span>
            </button>
          </Reveal>

          <div className="mt-8 sm:mt-10" aria-busy={loading}>
            {loading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6" aria-hidden>
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="shimmer h-[26rem] rounded-3xl border border-hair" />
                ))}
              </div>
            ) : builds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center sm:py-20">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-hair bg-elevated shadow-card">
                  <PackageSearch className="h-9 w-9 text-faint" aria-hidden />
                </div>
                <h2 className="mt-6 font-display text-2xl font-bold">التجميعات قيد التحضير</h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                  مفيش تجميعات معروضة حاليًا — كلمنا واتساب ولبّيك تجميعة على مقاسك وميزانيتك.
                </p>
              </div>
            ) : (
              <StaggerReveal className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                {builds.map((b) => (
                  <BuildCard key={b.id} build={b} />
                ))}
              </StaggerReveal>
            )}
          </div>
        </>
      ) : (
        <div className="mt-6 lg:grid lg:grid-cols-[18.75rem_minmax(0,1fr)] lg:gap-8">
          {/* ============ الشريط الجانبي الثابت (يمين في RTL) — lg+ ============ */}
          <aside aria-label="فلاتر المتجر" className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-hair bg-elevated p-5 shadow-card">
              <FilterPanel {...panelProps} variant="sidebar" />
            </div>
          </aside>

          {/* ===================== المنطقة الرئيسية ===================== */}
          <div className="min-w-0">
            {/* شريط الأدوات: بحث + ترتيب + عدد + زر الفلاتر (موبايل) */}
            <div className="rounded-2xl border border-hair bg-elevated p-3 shadow-card sm:p-4">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* البحث */}
                <div className="relative min-w-0 flex-1 basis-full sm:basis-64">
                  <label htmlFor="catalog-search" className="sr-only">
                    البحث في المنتجات
                  </label>
                  <Search
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
                    aria-hidden
                  />
                  <input
                    id="catalog-search"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ابحث بالاسم أو الماركة…"
                    className="h-11 w-full rounded-xl border border-hair bg-elevated/80 py-0 pl-9 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-faint focus-visible:border-primary/60"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      aria-label="مسح البحث"
                      className="absolute left-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-faint transition-colors hover:bg-foreground/5 hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  )}
                </div>

                {/* الترتيب */}
                <Select dir="rtl" value={sort} onValueChange={(v) => changeSort(v as SortKey)}>
                  <SelectTrigger
                    className="h-11 w-[10.5rem] rounded-xl border-hair bg-elevated/80 text-xs font-bold text-foreground"
                    aria-label="ترتيب النتائج"
                  >
                    <SelectValue placeholder="الترتيب" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-hair">
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-xs font-medium">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* عدد النتائج */}
                <span
                  className="ms-auto shrink-0 whitespace-nowrap text-xs font-medium text-muted-foreground"
                  aria-live="polite"
                >
                  {arabicCount(filtered.length, PRODUCT_NOUN)}
                </span>

                {/* زر الفلاتر — موبايل */}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  aria-haspopup="dialog"
                  aria-expanded={drawerOpen}
                  className="relative inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-hair bg-elevated/80 px-4 text-xs font-bold text-foreground transition-colors hover:border-foreground/25 lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                  الفلاتر
                  {activeFilterCount > 0 && (
                    <span className="absolute -left-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 font-tech text-[0.65rem] font-bold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* رقائق الفلاتر النشطة */}
            {activeChips.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="الفلاتر النشطة">
                {activeChips.map((c) => (
                  <FilterChip key={c.id} label={c.label} onRemove={c.onRemove} />
                ))}
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
                  >
                    <FilterX className="h-3.5 w-3.5" aria-hidden />
                    مسح الكل
                  </button>
                )}
              </div>
            )}

            {/* ===================== الشبكة ===================== */}
            <div id="catalog-grid-top" className="relative mt-6 sm:mt-8" aria-busy={loading}>
              {category && (
                <div
                  aria-hidden
                  /* below lg the 30rem accent glow is clamped to the
                     results column so its RTL left-bleed can't widen the
                     document scrolling area on phones/tablets; lg+ keeps
                     the original -3rem editorial bleed (no doc overflow
                     with the sidebar column in place) */
                  className="pointer-events-none absolute -top-24 right-[-3rem] h-56 w-[30rem] max-lg:right-0 max-lg:max-w-full rounded-full opacity-[0.12] blur-3xl"
                  style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
                />
              )}

              {loading ? (
                <div className="grid grid-cols-1 gap-5 min-[520px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4" aria-hidden>
                  {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="shimmer h-72 rounded-2xl border border-hair" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                /* Empty state — بلا dead-ends */
                <div className="relative flex flex-col items-center justify-center rounded-3xl border border-hair bg-elevated px-6 py-16 text-center shadow-card sm:py-20">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-hair bg-background shadow-card">
                    <PackageSearch className="h-9 w-9 text-faint" aria-hidden />
                  </div>
                  <h2 className="mt-6 font-display text-2xl font-bold">مفيش نتائج مطابقة</h2>
                  <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                    جرب كلمة بحث مختلفة، وسّع نطاق السعر، أو شيل فلتر التوفر أو الماركة — المنتج اللي بتدور عليه غالبًا
                    موجود عندنا.
                  </p>
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={clearAll}
                      className="glow-accent-sm inline-flex min-h-11 items-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95"
                    >
                      <FilterX className="h-4 w-4" aria-hidden />
                      مسح الفلاتر
                    </button>
                    {category && (
                      <button
                        type="button"
                        onClick={() => goCategory(undefined)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-hair bg-background px-6 text-sm font-bold text-foreground transition-colors hover:border-foreground/25"
                      >
                        <LayoutGrid className="h-4 w-4" aria-hidden />
                        تصفح كل المنتجات
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <StaggerReveal
                    key={`${filterHash}-p${currentPage}`}
                    className="relative grid grid-cols-1 gap-5 min-[520px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                  >
                    {paginatedProducts.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        category={category ?? categories.find((c) => c.id === p.categoryId)}
                      />
                    ))}
                  </StaggerReveal>

                  {/* عداد ومحدد الصفحات */}
                  {totalPages > 1 && (
                    <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-hair pt-6 sm:flex-row">
                      <p className="text-xs font-medium text-muted-foreground">
                        صفحة <span className="font-tech font-bold text-foreground">{currentPage}</span> من{" "}
                        <span className="font-tech font-bold text-foreground">{totalPages}</span>{" "}
                        (إجمالي {filtered.length} منتج)
                      </p>

                      <div className="flex items-center gap-1.5" dir="rtl">
                        <button
                          type="button"
                          disabled={currentPage <= 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-hair bg-elevated px-3 text-xs font-bold text-foreground transition-all hover:bg-foreground/[0.05] disabled:pointer-events-none disabled:opacity-40"
                          aria-label="الصفحة السابقة"
                        >
                          <ChevronRight className="h-4 w-4" />
                          السابق
                        </button>

                        <div className="flex items-center gap-1">
                          {getPageNumbers(currentPage, totalPages).map((pNum, idx) => {
                            if (pNum === -1) {
                              return (
                                <span key={`dots-${idx}`} className="px-2 text-xs text-faint">
                                  …
                                </span>
                              );
                            }
                            const isActive = pNum === currentPage;
                            return (
                              <button
                                key={pNum}
                                type="button"
                                onClick={() => handlePageChange(pNum)}
                                className={cn(
                                  "flex h-10 min-w-10 items-center justify-center rounded-xl font-tech text-xs font-bold transition-all",
                                  isActive
                                    ? "bg-primary text-primary-foreground shadow-sm glow-accent-sm"
                                    : "border border-hair bg-elevated text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
                                )}
                                aria-current={isActive ? "page" : undefined}
                              >
                                {pNum}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          disabled={currentPage >= totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-hair bg-elevated px-3 text-xs font-bold text-foreground transition-all hover:bg-foreground/[0.05] disabled:pointer-events-none disabled:opacity-40"
                          aria-label="الصفحة التالية"
                        >
                          التالي
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ درج الفلاتر — موبايل (<lg) ============ */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[88svh] border-hair bg-elevated">
          <DrawerHeader className="border-b border-hair pb-3 text-right md:text-right">
            <DrawerTitle className="font-display text-lg font-bold">فلترة المنتجات</DrawerTitle>
            <DrawerDescription className="text-xs">
              صفّي النتائج بالفئة والسعر والتوفر والماركة — النتائج بتتحدث فورًا
            </DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4" data-vaul-no-drag>
            <FilterPanel {...panelProps} variant="drawer" />
          </div>

          {/* تذييل ثابت: مسح + عرض النتائج */}
          <div className="mt-auto border-t border-hair bg-elevated/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={clearAll}
                disabled={activeFilterCount === 0}
                className="inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl border border-hair bg-background px-4 text-sm font-bold text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                <FilterX className="h-4 w-4" aria-hidden />
                مسح الفلاتر
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="glow-accent-sm inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-95"
              >
                {resultsLabel}
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
