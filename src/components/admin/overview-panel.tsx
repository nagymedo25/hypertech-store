"use client";

/**
 * ============================================================
 * HYPER TECH — Admin Overview Panel
 * ============================================================
 * Snapshot of the whole mock store: animated counters, popular
 * products, recent activity feed (orders + maintenance merged)
 * and pure-CSS status meters. No chart libraries.
 * ============================================================
 */

import { useMemo } from "react";
import {
  FolderTree,
  MessageCircle,
  Package,
  ShoppingCart,
  Star,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { useMockDB } from "@/lib/store/db-store";
import { useRouterStore } from "@/lib/router";
import { AnimatedNumber } from "@/components/motion/micro-interactions";
import {
  MAINTENANCE_STATUS_META,
  ORDER_STATUS_META,
  timeAgo,
} from "@/lib/format";
import { StatusPill } from "./admin-shell";
import { cn } from "@/lib/utils";

/** Presentation colors for the CSS meters (order statuses). */
const METER_BAR: Record<string, string> = {
  new: "bg-sky-400",
  contacted: "bg-cyan-300",
  confirmed: "bg-emerald-400",
  completed: "bg-emerald-300",
  cancelled: "bg-rose-400",
};

type ActivityItem = {
  kind: "order" | "maintenance";
  id: string;
  ref: string;
  name: string;
  createdAt: string;
  statusMeta?: { label: string; tone: string };
};

export default function OverviewPanel() {
  const products = useMockDB((s) => s.products);
  const categories = useMockDB((s) => s.categories);
  const orders = useMockDB((s) => s.orders);
  const maintenanceRequests = useMockDB((s) => s.maintenanceRequests);
  const navigate = useRouterStore((s) => s.navigate);

  const stats = [
    { label: "إجمالي المنتجات", value: products.length, icon: Package, accent: "text-primary" },
    { label: "الفئات", value: categories.length, icon: FolderTree, accent: "text-amber" },
    { label: "الطلبات", value: orders.length, icon: ShoppingCart, accent: "text-mint" },
    { label: "طلبات الصيانة", value: maintenanceRequests.length, icon: Wrench, accent: "text-danger" },
  ];

  const popular = useMemo(
    () =>
      [...products]
        .filter((p) => p.rating > 0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4),
    [products],
  );

  const activity = useMemo<ActivityItem[]>(() => {
    const merged: ActivityItem[] = [
      ...orders.map((o) => ({
        kind: "order" as const,
        id: o.id,
        ref: o.ref,
        name: o.customerName,
        createdAt: o.createdAt,
        statusMeta: ORDER_STATUS_META[o.status],
      })),
      ...maintenanceRequests.map((m) => ({
        kind: "maintenance" as const,
        id: m.id,
        ref: m.ref,
        name: m.customerName,
        createdAt: m.createdAt,
        statusMeta: MAINTENANCE_STATUS_META[m.status],
      })),
    ];
    merged.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return merged.slice(0, 5);
  }, [orders, maintenanceRequests]);

  const orderStatusCounts = useMemo(
    () =>
      Object.keys(ORDER_STATUS_META)
        .map((key) => ({
          key,
          meta: ORDER_STATUS_META[key],
          count: orders.filter((o) => o.status === key).length,
        }))
        .filter((c) => c.count > 0),
    [orders],
  );
  const maxCount = Math.max(1, ...orderStatusCounts.map((c) => c.count));

  return (
    <div className="space-y-6">
      {/* Welcome line */}
      <div>
        <h2 className="font-display text-2xl font-bold">نظرة سريعة على المتجر</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          كل الأرقام دي من قاعدة البيانات الوهمية في المتصفح — بتتحدث لحظيًا مع أي تعديل.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-hair bg-surface/60 p-5 transition-colors hover:border-primary/25"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
              <s.icon className={cn("h-5 w-5 shrink-0", s.accent)} aria-hidden />
            </div>
            <AnimatedNumber
              value={s.value}
              className="mt-2 block font-display text-3xl font-bold"
            />
            <span className="mt-1 block text-[0.65rem] text-faint">بيانات وهمية</span>
          </div>
        ))}
      </div>

      {/* Row 2: inquiries + popular products */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* WhatsApp inquiries (simulated) */}
        <div className="flex flex-col justify-between rounded-2xl border border-hair bg-surface/60 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              استفسارات واتساب هذا الشهر
            </span>
            <MessageCircle className="h-5 w-5 shrink-0 text-mint" aria-hidden />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <AnimatedNumber value={38} className="font-display text-4xl font-bold text-mint" />
            <span className="text-sm text-muted-foreground">استفسار</span>
          </div>
          <p className="mt-2 text-[0.65rem] leading-relaxed text-faint">
            رقم تقديري للعرض — القياس الحقيقي بيتم من محادثات واتساب المتجر.
          </p>
        </div>

        {/* Popular products */}
        <div className="rounded-2xl border border-hair bg-surface/60 p-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber" aria-hidden />
            <h3 className="text-sm font-bold">الأعلى تقييمًا</h3>
            <span className="text-[0.65rem] text-faint">تقييمات محاكاة</span>
          </div>
          <ul className="mt-3 space-y-2">
            {popular.length === 0 && (
              <li className="rounded-xl border border-dashed border-hair p-4 text-center text-xs text-faint">
                لا توجد منتجات بتقييم بعد
              </li>
            )}
            {popular.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => navigate({ name: "product", slug: p.slug })}
                  className="flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-right transition-colors hover:border-primary/20 hover:bg-primary/5"
                >
                  {p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      loading="lazy"
                      className="img-grade h-10 w-10 shrink-0 rounded-lg border border-hair bg-[#0d0f13] object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-hair bg-elevated text-faint">
                      <Package className="h-4 w-4" aria-hidden />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                  <span className="flex shrink-0 items-center gap-0.5" aria-hidden>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3",
                          i < Math.round(p.rating) ? "fill-amber text-amber" : "text-faint",
                        )}
                      />
                    ))}
                  </span>
                  <span className="shrink-0 font-tech text-xs text-amber" dir="ltr">
                    {p.rating.toFixed(1)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Row 3: activity feed + status meters */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent activity */}
        <div className="rounded-2xl border border-hair bg-surface/60 p-5">
          <h3 className="text-sm font-bold">آخر النشاطات</h3>
          <ul className="mt-3 space-y-2">
            {activity.length === 0 && (
              <li className="rounded-xl border border-dashed border-hair p-4 text-center text-xs text-faint">
                لا يوجد نشاط بعد
              </li>
            )}
            {activity.map((a) => (
              <li
                key={`${a.kind}-${a.id}`}
                className="flex items-center gap-3 rounded-xl border border-hair bg-elevated/40 p-3"
              >
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-bold",
                    a.kind === "order"
                      ? "border-primary/20 bg-primary/10 text-primary"
                      : "border-amber/25 bg-amber/10 text-amber",
                  )}
                >
                  {a.kind === "order" ? "طلب" : "صيانة"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="font-tech text-[0.7rem] text-faint" dir="ltr">
                    {a.ref}
                  </p>
                </div>
                <span className="shrink-0 whitespace-nowrap text-[0.7rem] text-muted-foreground">
                  {timeAgo(a.createdAt)}
                </span>
                <StatusPill meta={a.statusMeta} />
              </li>
            ))}
          </ul>
        </div>

        {/* Orders by status — pure CSS meters */}
        <div className="rounded-2xl border border-hair bg-surface/60 p-5">
          <h3 className="text-sm font-bold">توزيع حالات الطلبات</h3>
          {orderStatusCounts.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-hair p-4 text-center text-xs text-faint">
              لا توجد طلبات بعد
            </p>
          ) : (
            <ul className="mt-4 space-y-3.5">
              {orderStatusCounts.map((c) => (
                <li key={c.key}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">{c.meta.label}</span>
                    <span className="font-tech font-bold">{c.count}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-foreground/[0.06]">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", METER_BAR[c.key] ?? "bg-primary")}
                      style={{ width: `${Math.round((c.count / maxCount) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
