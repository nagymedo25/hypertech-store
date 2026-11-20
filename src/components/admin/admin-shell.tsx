"use client";

/**
 * ============================================================
 * HYPER TECH — Admin Shell (Mock Dashboard Layout)
 * ============================================================
 * RTL layout: sidebar on the RIGHT (icons-only on md, labels on
 * lg; horizontal scrollable tab bar + bottom bar + drawer on mobile).
 *
 * Mobile-First Responsiveness:
 * - w-full max-w-full overflow-x-hidden containers (zero horizontal jitter)
 * - Polished bottom bar with >= 48px touch targets for core sections
 * - Drawer (Sheet) for full access to all sections on mobile
 * - Scrollable pills bar with >= 44px touch targets
 *
 * This file also exports shared admin UI atoms:
 * (AdminHint / StatusPill / FormSectionTitle / FieldError / EmptyState).
 * ============================================================
 */

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Cpu,
  DatabaseBackup,
  ExternalLink,
  FileText,
  FolderTree,
  Info,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  SlidersHorizontal,
  Tag,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useRouterStore, type AdminSection } from "@/lib/router";
import { useUIStore } from "@/lib/store/ui-store";
import { useMockDB } from "@/lib/store/db-store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/* ------------------------------ Section map ------------------------------ */

const SECTIONS: { id: AdminSection; label: string; title: string; icon: LucideIcon }[] = [
  { id: "overview", label: "نظرة عامة", title: "نظرة عامة", icon: LayoutDashboard },
  { id: "products", label: "المنتجات", title: "إدارة المنتجات", icon: Package },
  { id: "categories", label: "الفئات", title: "إدارة الفئات", icon: FolderTree },
  { id: "builds", label: "التجميعات", title: "إدارة التجميعات", icon: Cpu },
  { id: "orders", label: "الطلبات", title: "إدارة الطلبات", icon: ShoppingCart },
  { id: "maintenance", label: "طلبات الصيانة", title: "طلبات الصيانة", icon: Wrench },
  { id: "hardware-pricing", label: "أسعار ترقية القطع", title: "أسعار ترقية القطع (RAM وتخزين)", icon: SlidersHorizontal },
  { id: "coupons", label: "كوبونات الخصم", title: "إدارة كوبونات الخصم", icon: Tag },
  { id: "content", label: "محتوى الموقع", title: "إدارة محتوى ونصوص الموقع", icon: FileText },
  { id: "data", label: "البيانات", title: "مركز إدارة البيانات والنسخ الاحتياطي", icon: DatabaseBackup },
  { id: "settings", label: "الإعدادات", title: "إعدادات المتجر", icon: Settings },
];

/* --------------------------------- Shell --------------------------------- */

export default function AdminShell({
  section,
  children,
}: {
  section: AdminSection;
  children: ReactNode;
}) {
  const navigate = useRouterStore((s) => s.navigate);
  const setAdminAuthed = useUIStore((s) => s.setAdminAuthed);
  const settings = useMockDB((s) => s.settings);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const current = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];

  const go = (id: AdminSection) => {
    navigate({ name: "admin", section: id });
    setDrawerOpen(false);
  };

  const logout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      /* cookie clears locally anyway */
    }
    setAdminAuthed(false);
    navigate({ name: "home" });
    toast.success("تم تسجيل الخروج — الجلسة انتهت بشكل آمن");
  };

  return (
    <div className="min-h-screen w-full md:pr-16 lg:pr-64">
      {/* Desktop sidebar (right side — RTL) */}
      <aside
        className="fixed inset-y-0 right-0 z-40 hidden w-16 flex-col border-l border-hair bg-surface md:flex lg:w-64"
        aria-label="التنقل في لوحة التحكم"
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-center gap-3 border-b border-hair lg:justify-start lg:px-5">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.storeName || "لوحة التحكم"}
              className="h-9 max-h-9 w-auto max-w-[130px] object-contain"
            />
          ) : (
            <>
              <span className="relative flex h-9 w-9 items-center justify-center">
                <svg viewBox="0 0 44 44" className="absolute inset-0 h-full w-full text-primary" aria-hidden>
                  <ellipse
                    cx="22"
                    cy="22"
                    rx="19"
                    ry="7.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    transform="rotate(-16 22 22)"
                  />
                </svg>
                <span
                  className="font-tech text-lg font-bold text-silver"
                  style={{ transform: "skewX(-8deg)" }}
                >
                  H
                </span>
              </span>
              <span className="hidden flex-col leading-none lg:flex">
                <span
                  className="font-tech text-base font-bold tracking-tight"
                  style={{ transform: "skewX(-8deg)" }}
                >
                  <span className="text-silver">HYPER</span>
                  <span className="text-electric"> TECH</span>
                </span>
                <span className="mt-1 text-[0.62rem] text-faint">لوحة التحكم</span>
              </span>
            </>
          )}
        </div>

        {/* Sections nav */}
        <nav className="flex-1 overflow-y-auto p-2 lg:p-3">
          <ul className="space-y-1">
            {SECTIONS.map((s) => {
              const active = s.id === section;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => go(s.id)}
                    title={s.label}
                    aria-label={s.label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 w-full items-center justify-center rounded-xl border px-2 text-sm font-medium transition-colors lg:justify-start lg:gap-3 lg:px-3",
                      active
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-transparent text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground",
                    )}
                  >
                    <s.icon className="h-5 w-5 shrink-0" aria-hidden />
                    <span className="hidden lg:block">{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t border-hair p-2 lg:p-3">
          <button
            type="button"
            onClick={logout}
            title="تسجيل الخروج"
            aria-label="تسجيل الخروج من لوحة التحكم"
            className="flex min-h-11 w-full items-center justify-center rounded-xl border border-transparent px-2 text-sm font-medium text-danger transition-colors hover:border-danger/30 hover:bg-danger/10 lg:justify-start lg:gap-3 lg:px-3"
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden />
            <span className="hidden lg:block">خروج</span>
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-col w-full max-w-full overflow-x-hidden">
        {/* Topbar */}
        <header className="sticky top-0 z-30 glass w-full max-w-full">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              {/* Mobile Drawer Trigger */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="فتح قائمة لوحة التحكم"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-hair text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground active:scale-95 md:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden />
              </button>

              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.storeName || "لوحة التحكم"}
                  className="h-8 max-h-8 w-auto max-w-[100px] object-contain sm:max-w-[110px] md:hidden"
                />
              ) : (
                <span className="relative hidden h-9 w-9 shrink-0 items-center justify-center xs:flex md:hidden">
                  <svg viewBox="0 0 44 44" className="absolute inset-0 h-full w-full text-primary" aria-hidden>
                    <ellipse
                      cx="22"
                      cy="22"
                      rx="19"
                      ry="7.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      transform="rotate(-16 22 22)"
                    />
                  </svg>
                  <span
                    className="font-tech text-lg font-bold text-silver"
                    style={{ transform: "skewX(-8deg)" }}
                  >
                    H
                  </span>
                </span>
              )}
              <div className="min-w-0">
                <p className="hidden text-[0.65rem] font-bold tracking-wider text-faint sm:block">
                  لوحة تحكم {settings.storeName || "هايبر تك"}
                </p>
                <h1 className="truncate font-display text-base font-bold leading-tight sm:text-lg">
                  {current.title}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ name: "home" })}
                className="min-h-9"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">عرض المتجر</span>
                <span className="sm:hidden">المتجر</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Panel content */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-6 pb-24 md:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile navigation drawer (Sheet) */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="flex w-[82vw] max-w-xs flex-col border-l border-hair bg-surface p-0">
          <SheetHeader className="flex flex-row items-center justify-between border-b border-hair p-4 text-right space-y-0">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                <svg viewBox="0 0 44 44" className="absolute inset-0 h-full w-full text-primary" aria-hidden>
                  <ellipse
                    cx="22"
                    cy="22"
                    rx="19"
                    ry="7.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    transform="rotate(-16 22 22)"
                  />
                </svg>
                <span className="font-tech text-base font-bold text-silver" style={{ transform: "skewX(-8deg)" }}>
                  H
                </span>
              </span>
              <SheetTitle className="text-base font-bold text-foreground">لوحة التحكم</SheetTitle>
            </div>
          </SheetHeader>

          {/* Drawer sections nav list */}
          <nav className="flex-1 overflow-y-auto p-3" aria-label="أقسام لوحة التحكم">
            <ul className="space-y-1">
              {SECTIONS.map((s) => {
                const active = s.id === section;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => go(s.id)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-[48px] w-full items-center gap-3 rounded-xl border px-3.5 text-sm font-medium transition-colors touch-manipulation",
                        active
                          ? "border-primary/30 bg-primary/10 text-primary font-bold shadow-sm"
                          : "border-transparent text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground active:bg-foreground/[0.08]",
                      )}
                    >
                      <s.icon className="h-5 w-5 shrink-0" aria-hidden />
                      <span className="flex-1 text-right">{s.label}</span>
                      {active && (
                        <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Drawer footer actions */}
          <div className="shrink-0 space-y-2 border-t border-hair p-3">
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                navigate({ name: "home" });
              }}
              className="flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-hair px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:bg-foreground/[0.05] touch-manipulation"
            >
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
              <span>عرض المتجر</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                logout();
              }}
              className="flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-transparent px-3.5 text-sm font-medium text-danger transition-colors hover:border-danger/30 hover:bg-danger/10 active:bg-danger/15 touch-manipulation"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile bottom navigation bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-hair bg-surface/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="التنقل السريع في الجوال"
      >
        <div className="grid grid-cols-5 items-center justify-around px-1 py-1">
          <button
            type="button"
            onClick={() => go("overview")}
            aria-current={section === "overview" ? "page" : undefined}
            className={cn(
              "flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.65rem] font-medium transition-colors touch-manipulation",
              section === "overview"
                ? "bg-primary/10 text-primary font-bold"
                : "text-muted-foreground hover:text-foreground active:text-foreground",
            )}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" aria-hidden />
            <span>الرئيسية</span>
          </button>

          <button
            type="button"
            onClick={() => go("products")}
            aria-current={section === "products" ? "page" : undefined}
            className={cn(
              "flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.65rem] font-medium transition-colors touch-manipulation",
              section === "products"
                ? "bg-primary/10 text-primary font-bold"
                : "text-muted-foreground hover:text-foreground active:text-foreground",
            )}
          >
            <Package className="h-5 w-5 shrink-0" aria-hidden />
            <span>المنتجات</span>
          </button>

          <button
            type="button"
            onClick={() => go("orders")}
            aria-current={section === "orders" ? "page" : undefined}
            className={cn(
              "flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.65rem] font-medium transition-colors touch-manipulation",
              section === "orders"
                ? "bg-primary/10 text-primary font-bold"
                : "text-muted-foreground hover:text-foreground active:text-foreground",
            )}
          >
            <ShoppingCart className="h-5 w-5 shrink-0" aria-hidden />
            <span>الطلبات</span>
          </button>

          <button
            type="button"
            onClick={() => go("builds")}
            aria-current={section === "builds" ? "page" : undefined}
            className={cn(
              "flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.65rem] font-medium transition-colors touch-manipulation",
              section === "builds"
                ? "bg-primary/10 text-primary font-bold"
                : "text-muted-foreground hover:text-foreground active:text-foreground",
            )}
          >
            <Cpu className="h-5 w-5 shrink-0" aria-hidden />
            <span>التجميعات</span>
          </button>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="المزيد من الأقسام"
            className={cn(
              "flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.65rem] font-medium transition-colors touch-manipulation",
              !["overview", "products", "orders", "builds"].includes(section)
                ? "bg-primary/10 text-primary font-bold"
                : "text-muted-foreground hover:text-foreground active:text-foreground",
            )}
          >
            <Menu className="h-5 w-5 shrink-0" aria-hidden />
            <span>المزيد</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

/* ---------------------------- Shared admin atoms ---------------------------- */

/** Honest amber notice box used across the mock admin. */
export function AdminHint({ children }: { children: ReactNode }) {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-xl border border-amber/30 bg-amber/5 p-4 text-sm leading-relaxed text-amber/90"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber" aria-hidden />
      <p>{children}</p>
    </div>
  );
}

/** Colored status pill built from the META maps in lib/format. */
export function StatusPill({ meta }: { meta?: { label: string; tone: string } }) {
  if (!meta) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-bold",
        meta.tone,
      )}
    >
      {meta.label}
    </span>
  );
}

/** Group heading inside the big create/edit dialogs. */
export function FormSectionTitle({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <Icon className="h-4 w-4 text-primary" aria-hidden />
      <h4 className="text-sm font-bold">{children}</h4>
      <span className="h-px flex-1 bg-hair" aria-hidden />
    </div>
  );
}

/** Inline Arabic validation error under a field. */
export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs font-medium text-danger">{children}</p>;
}

/** Friendly empty state for filtered/empty lists. */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  description,
  action,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  const text = hint || description;
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-hair bg-surface/40 px-6 py-14 text-center">
      <Icon className="h-8 w-8 text-faint" aria-hidden />
      <p className="mt-3 text-sm font-medium text-muted-foreground">{title}</p>
      {text ? <p className="mt-1 text-xs text-faint">{text}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
