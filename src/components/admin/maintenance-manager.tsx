"use client";

/**
 * ============================================================
 * HYPER TECH — Admin Maintenance Manager
 * ============================================================
 * Maintenance request cards with device/problem chips,
 * expandable descriptions, a colored status select and an
 * inline editable admin notes area. All demo data.
 * ============================================================
 */

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Trash2, Wrench } from "lucide-react";
import { useMockDB } from "@/lib/store/db-store";
import { repositories } from "@/lib/repositories";
import {
  DEVICE_TYPE_META,
  MAINTENANCE_STATUS_META,
  PROBLEM_CATEGORY_META,
  timeAgo,
} from "@/lib/format";
import { AdminHint, EmptyState } from "./admin-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import type { MaintenanceRecord, MaintenanceStatus } from "@/types";

type MaintFilter = MaintenanceStatus | "all";

const FILTERS: MaintFilter[] = [
  "all",
  ...(Object.keys(MAINTENANCE_STATUS_META) as MaintenanceStatus[]),
];

const filterLabel = (f: MaintFilter) =>
  f === "all" ? "الكل" : MAINTENANCE_STATUS_META[f]?.label ?? f;

export default function MaintenanceManager() {
  const requests = useMockDB((s) => s.maintenanceRequests);

  const [filter, setFilter] = useState<MaintFilter>("all");
  const [expandedDesc, setExpandedDesc] = useState<Set<string>>(new Set());
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [notesPendingId, setNotesPendingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sorted = useMemo(
    () =>
      [...requests].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [requests],
  );

  const filtered = useMemo(
    () => (filter === "all" ? sorted : sorted.filter((m) => m.status === filter)),
    [sorted, filter],
  );

  const statusCount = (f: MaintFilter) =>
    f === "all" ? requests.length : requests.filter((m) => m.status === f).length;

  const toggleDesc = (id: string) =>
    setExpandedDesc((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /* ------------------------------- Actions -------------------------------- */

  const changeStatus = async (m: MaintenanceRecord, status: MaintenanceStatus) => {
    if (status === m.status || statusPendingId) return;
    setStatusPendingId(m.id);
    try {
      await repositories.maintenance.update(m.id, { status });
      toast.success(`تم تحديث حالة الطلب ${m.ref}`);
    } catch {
      toast.error("تعذر تحديث الحالة");
    } finally {
      setStatusPendingId(null);
    }
  };

  const saveNotes = async (m: MaintenanceRecord) => {
    setNotesPendingId(m.id);
    try {
      await repositories.maintenance.update(m.id, {
        adminNotes: (notesDraft[m.id] ?? "").trim() || undefined,
      });
      toast.success("تم حفظ الملاحظة الإدارية");
      setNotesDraft((d) => {
        const next = { ...d };
        delete next[m.id];
        return next;
      });
    } catch {
      toast.error("تعذر حفظ الملاحظة");
    } finally {
      setNotesPendingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await repositories.maintenance.remove(deleteTarget.id);
      toast.success(`تم حذف طلب الصيانة ${deleteTarget.ref}`);
      setDeleteTarget(null);
    } catch {
      toast.error("تعذر حذف الطلب");
    } finally {
      setDeleting(false);
    }
  };

  /* --------------------------------- Render -------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <h2 className="font-display text-2xl font-bold">طلبات الصيانة</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-tech">{requests.length}</span> طلب صيانة — حدّث الحالة وسجّل
            ملاحظاتك الفنية على كل طلب
          </p>
        </div>
        <AdminHint>بيانات تجريبية — طلبات الصيانة هنا للعرض فقط في هذه المرحلة.</AdminHint>
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="تصفية طلبات الصيانة بحسب الحالة"
      >
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

      {/* Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={filter === "all" ? "لا توجد طلبات صيانة" : "لا توجد طلبات بهذه الحالة"}
          hint="الطلبات بتوصل هنا أول ما العميل يسيب بياناته في صفحة الصيانة."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((m) => {
            const isDescExpanded = expandedDesc.has(m.id);
            const deviceLabel = [m.deviceBrand, m.deviceModel].filter(Boolean).join(" ");
            return (
              <article key={m.id} className="flex flex-col gap-3 rounded-2xl border border-hair bg-surface/60 p-4">
                {/* Ref + time + delete */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-amber/25 bg-amber/10 px-2.5 py-1 text-[0.68rem] font-bold text-amber">
                      صيانة
                    </span>
                    <p className="font-tech text-sm font-bold" dir="ltr">
                      {m.ref}
                    </p>
                    <span className="text-[0.7rem] text-faint">{timeAgo(m.createdAt)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(m)}
                    aria-label={`حذف طلب الصيانة ${m.ref}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-danger/80 transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                {/* Customer */}
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium">{m.customerName}</p>
                  <p className="shrink-0 font-tech text-xs text-muted-foreground" dir="ltr">
                    {m.customerPhone}
                  </p>
                </div>

                {/* Device + problem chips */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full border border-hair bg-raised px-2.5 py-1 text-xs">
                    {DEVICE_TYPE_META[m.deviceType] ?? m.deviceType}
                  </span>
                  {deviceLabel ? (
                    <span
                      className="rounded-full border border-hair bg-raised px-2.5 py-1 font-tech text-xs"
                      dir="ltr"
                    >
                      {deviceLabel}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-amber/25 bg-amber/10 px-2.5 py-1 text-xs text-amber">
                    {PROBLEM_CATEGORY_META[m.problemCategory] ?? m.problemCategory}
                  </span>
                </div>

                {/* Description */}
                <div>
                  <p
                    className={cn(
                      "text-sm leading-relaxed text-muted-foreground",
                      !isDescExpanded && "line-clamp-2",
                    )}
                  >
                    {m.problemDescription}
                  </p>
                  {m.problemDescription.length > 90 ? (
                    <button
                      type="button"
                      onClick={() => toggleDesc(m.id)}
                      className="mt-1 text-xs font-medium text-primary hover:underline"
                    >
                      {isDescExpanded ? "أقل" : "المزيد"}
                    </button>
                  ) : null}
                </div>

                {m.additionalNotes ? (
                  <p className="rounded-xl border border-hair bg-elevated/30 p-3 text-xs text-muted-foreground">
                    <span className="font-bold">ملاحظات العميل: </span>
                    {m.additionalNotes}
                  </p>
                ) : null}

                {/* Status */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">الحالة</span>
                  <Select
                    value={m.status}
                    onValueChange={(v) => changeStatus(m, v as MaintenanceStatus)}
                    disabled={statusPendingId === m.id}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-9 w-full border text-xs font-bold sm:w-44",
                        MAINTENANCE_STATUS_META[m.status]?.tone,
                      )}
                      aria-label={`حالة طلب الصيانة ${m.ref}`}
                    >
                      {statusPendingId === m.id ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                          جارٍ الحفظ…
                        </span>
                      ) : (
                        <SelectValue />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(MAINTENANCE_STATUS_META).map((s) => (
                        <SelectItem key={s} value={s}>
                          {MAINTENANCE_STATUS_META[s].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Admin notes */}
                <div className="space-y-1.5 rounded-xl border border-hair bg-elevated/30 p-3">
                  <Label htmlFor={`notes-${m.id}`} className="text-xs">
                    ملاحظات إدارية (الفني)
                  </Label>
                  <Textarea
                    id={`notes-${m.id}`}
                    rows={2}
                    value={notesDraft[m.id] ?? m.adminNotes ?? ""}
                    onChange={(e) =>
                      setNotesDraft((d) => ({ ...d, [m.id]: e.target.value }))
                    }
                    placeholder="ملاحظاتك الداخلية عن الطلب — العميل مش شايفها"
                    className="bg-background"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => saveNotes(m)}
                      disabled={
                        notesPendingId === m.id ||
                        (notesDraft[m.id] ?? "") === (m.adminNotes ?? "")
                      }
                      className="min-h-9"
                    >
                      {notesPendingId === m.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Save className="h-3.5 w-3.5" aria-hidden />
                      )}
                      حفظ الملاحظة
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* --------------------------- Delete confirmation --------------------------- */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle>حذف طلب الصيانة؟</AlertDialogTitle>
            <AlertDialogDescription>
              هتحذف طلب <span className="font-tech">{deleteTarget?.ref}</span> الخاص بـ
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
