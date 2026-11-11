"use client";

/**
 * ============================================================
 * HYPER TECH — Admin Orders Manager
 * ============================================================
 * WhatsApp-originated order records (fictional demo data).
 * Status changes go through the async order repository; rows
 * expand to show the full item lines. Table on lg, cards on
 * mobile. Filter chips by status.
 * ============================================================
 */

import { Fragment, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { useMockDB } from "@/lib/store/db-store";
import { repositories } from "@/lib/repositories";
import { ORDER_STATUS_META, formatPriceCompact, timeAgo } from "@/lib/format";
import { AdminHint, EmptyState } from "./admin-shell";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { OrderRecord, OrderStatus } from "@/types";

type OrderFilter = OrderStatus | "all";

const FILTERS: OrderFilter[] = ["all", ...(Object.keys(ORDER_STATUS_META) as OrderStatus[])];

const filterLabel = (f: OrderFilter) => (f === "all" ? "الكل" : ORDER_STATUS_META[f]?.label ?? f);

export default function OrdersManager() {
  const orders = useMockDB((s) => s.orders);

  const [filter, setFilter] = useState<OrderFilter>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrderRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sorted = useMemo(
    () => [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [orders],
  );

  const filtered = useMemo(
    () => (filter === "all" ? sorted : sorted.filter((o) => o.status === filter)),
    [sorted, filter],
  );

  const statusCount = (f: OrderFilter) =>
    f === "all" ? orders.length : orders.filter((o) => o.status === f).length;

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /* ------------------------------- Actions -------------------------------- */

  const changeStatus = async (order: OrderRecord, status: OrderStatus) => {
    if (status === order.status || statusPendingId) return;
    setStatusPendingId(order.id);
    try {
      await repositories.orders.update(order.id, { status });
      toast.success(`تم تحديث حالة الطلب ${order.ref}`);
    } catch {
      toast.error("تعذر تحديث الحالة");
    } finally {
      setStatusPendingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await repositories.orders.remove(deleteTarget.id);
      toast.success(`تم حذف الطلب ${deleteTarget.ref}`);
      setDeleteTarget(null);
    } catch {
      toast.error("تعذر حذف الطلب");
    } finally {
      setDeleting(false);
    }
  };

  /* --------------------------------- Render -------------------------------- */

  const statusSelect = (o: OrderRecord) => (
    <Select
      value={o.status}
      onValueChange={(v) => changeStatus(o, v as OrderStatus)}
      disabled={statusPendingId === o.id}
    >
      <SelectTrigger
        className={cn(
          "h-9 w-full border text-xs font-bold sm:w-40",
          ORDER_STATUS_META[o.status]?.tone,
        )}
        aria-label={`حالة الطلب ${o.ref}`}
      >
        {statusPendingId === o.id ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            جارٍ الحفظ…
          </span>
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>
      <SelectContent>
        {Object.keys(ORDER_STATUS_META).map((s) => (
          <SelectItem key={s} value={s}>
            {ORDER_STATUS_META[s].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const deleteButton = (o: OrderRecord, className?: string) => (
    <button
      type="button"
      onClick={() => setDeleteTarget(o)}
      aria-label={`حذف الطلب ${o.ref}`}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg text-danger/80 transition-colors hover:bg-danger/10 hover:text-danger",
        className,
      )}
    >
      <Trash2 className="h-4 w-4" aria-hidden />
    </button>
  );

  const expandButton = (o: OrderRecord) => (
    <button
      type="button"
      onClick={() => toggleExpanded(o.id)}
      aria-label={expanded.has(o.id) ? "إخفاء تفاصيل الطلب" : "عرض تفاصيل الطلب"}
      aria-expanded={expanded.has(o.id)}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
    >
      <ChevronDown
        className={cn("h-4 w-4 transition-transform", expanded.has(o.id) && "rotate-180")}
        aria-hidden
      />
    </button>
  );

  const itemsDetails = (o: OrderRecord) => (
    <div className="space-y-1.5">
      {o.items.map((it, i) => (
        <div
          key={`${o.id}-${i}`}
          className="flex items-center justify-between gap-3 rounded-lg border border-hair bg-surface/50 px-3 py-2"
        >
          <span className="min-w-0 truncate text-sm">{it.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            <span className="font-tech" dir="ltr">
              {it.qty} × {formatPriceCompact(it.price)}
            </span>{" "}
            ج.م
          </span>
        </div>
      ))}
      {o.notes ? <p className="pt-1 text-xs text-muted-foreground">ملاحظات: {o.notes}</p> : null}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <h2 className="font-display text-2xl font-bold">الطلبات</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-tech">{orders.length}</span> طلب — غيّر الحالة من القائمة
            الملونة بجانب كل طلب
          </p>
        </div>
        <AdminHint>طلبات تجريبية للعرض — التخزين الحقيقي في المرحلة الثانية.</AdminHint>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="تصفية الطلبات بحسب الحالة">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors",
              filter === f
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-hair text-muted-foreground hover:border-foreground/15 hover:text-foreground",
            )}
          >
            {filterLabel(f)}
            <span className="font-tech">({statusCount(f)})</span>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={filter === "all" ? "لا توجد طلبات بعد" : "لا توجد طلبات بهذه الحالة"}
          hint="الطلبات بتظهر هنا أول ما العميل يكمل الإرسال عبر واتساب."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-hair bg-surface/60 lg:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-32">الطلب</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead className="w-56">المنتجات</TableHead>
                  <TableHead>الإجمالي</TableHead>
                  <TableHead className="w-44">الحالة</TableHead>
                  <TableHead className="w-24 text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <Fragment key={o.id}>
                    <TableRow>
                      <TableCell>
                        <p className="font-tech text-sm font-bold" dir="ltr">
                          {o.ref}
                        </p>
                        <p className="text-[0.7rem] text-faint">{timeAgo(o.createdAt)}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{o.customerName}</p>
                        <p className="font-tech text-xs text-muted-foreground" dir="ltr">
                          {o.customerPhone}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-52">
                          <p className="truncate text-sm">{o.items[0]?.name}</p>
                          {o.items.length > 1 ? (
                            <span className="text-xs text-primary">
                              + {o.items.length - 1} آخر
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-tech text-sm font-bold">
                          {formatPriceCompact(o.total)}
                          <span className="mr-1 text-[0.7rem] font-medium text-muted-foreground">
                            ج.م
                          </span>
                        </p>
                      </TableCell>
                      <TableCell>{statusSelect(o)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {expandButton(o)}
                          {deleteButton(o)}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expanded.has(o.id) ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={6} className="bg-elevated/30">
                          {itemsDetails(o)}
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <ul className="grid gap-3 lg:hidden">
            {filtered.map((o) => (
              <li key={o.id} className="space-y-3 rounded-2xl border border-hair bg-surface/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-tech text-sm font-bold" dir="ltr">
                      {o.ref}
                    </p>
                    <p className="text-[0.7rem] text-faint">{timeAgo(o.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {expandButton(o)}
                    {deleteButton(o)}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{o.customerName}</p>
                    <p className="font-tech text-xs text-muted-foreground" dir="ltr">
                      {o.customerPhone}
                    </p>
                  </div>
                  <p className="shrink-0 font-tech text-sm font-bold">
                    {formatPriceCompact(o.total)}
                    <span className="mr-1 text-[0.7rem] font-medium text-muted-foreground">ج.م</span>
                  </p>
                </div>

                <div className="text-sm">
                  <p className="truncate">{o.items[0]?.name}</p>
                  {o.items.length > 1 ? (
                    <span className="text-xs text-primary">+ {o.items.length - 1} آخر</span>
                  ) : null}
                </div>

                {expanded.has(o.id) ? itemsDetails(o) : null}

                {statusSelect(o)}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* --------------------------- Delete confirmation --------------------------- */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle>حذف الطلب؟</AlertDialogTitle>
            <AlertDialogDescription>
              هتحذف الطلب <span className="font-tech">{deleteTarget?.ref}</span> الخاص بـ
              «{deleteTarget?.customerName}» نهائيًا من البيانات التجريبية — لا يمكن التراجع.
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
              حذف الطلب
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
