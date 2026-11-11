"use client";

/**
 * ============================================================
 * HYPER TECH — Backup Center (مركز إدارة بيانات المتجر)
 * ============================================================
 * Task G — Store Data Management & Backup Center.
 *
 * 1. Live counts summary (GET /api/admin/reset).
 * 2. Full PDF backup: POST /api/admin/backups (atomic server
 *    snapshot) → premium off-DOM A4 report (paginated fixed
 *    794×1123px pages, html2canvas @2x, jsPDF) → signed
 *    Cloudinary raw upload (XHR with live progress) → PATCH
 *    finalize. Every stage visible in the progress tracker.
 * 3. Backup log (GET /api/admin/backups) — download / delete
 *    (latest successful is locked, mirrors the server rule).
 * 4. Safe reset (POST /api/admin/reset) — gated behind a
 *    verified + reachable backup, typed confirm phrase, then
 *    the client store is emptied via applyStoreReset().
 * ============================================================
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  DatabaseBackup,
  Download,
  ExternalLink,
  FolderTree,
  History,
  Layers,
  Loader2,
  Lock,
  Package,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldAlert,
  ShoppingCart,
  Trash2,
  Wrench,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useMockDB } from "@/lib/store/db-store";
import { BUSINESS } from "@/lib/config";
import {
  AVAILABILITY_META,
  BUILD_TYPE_META,
  DEVICE_TYPE_META,
  PROBLEM_CATEGORY_META,
} from "@/lib/format";
import { AdminHint, EmptyState } from "./admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type {
  Category,
  MaintenanceRecord,
  OrderRecord,
  PCBuild,
  Product,
  StoreSettings,
} from "@/types";

/* ------------------------------- Contracts ------------------------------- */

interface BackupCounts {
  products: number;
  categories: number;
  builds: number;
  orders: number;
  maintenance: number;
}

interface BackupRow {
  id: string;
  createdAt: string;
  counts: BackupCounts;
  status: "pending" | "success" | "failed";
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  exportPeriod: string;
  actor?: string | null;
}

interface ResetMeta {
  canReset: boolean;
  reason?: string | null;
  backupId?: string | null;
  counts: BackupCounts;
  confirmPhrase: string;
}

interface SnapshotData {
  products: Product[];
  categories: Category[];
  builds: PCBuild[];
  orders: OrderRecord[];
  maintenance: MaintenanceRecord[];
  settings: StoreSettings | null;
}

interface CreateBackupResponse {
  backup: {
    id: string;
    createdAt: string;
    counts: BackupCounts;
    status: string;
    exportPeriod: string;
  };
  snapshot: SnapshotData;
  serverTime: string;
}

interface SignedUpload {
  params: Record<string, string | number>;
  signature: string;
  api_key: string;
  cloud_name: string;
  upload_url: string;
  folder: string;
}

/* --------------------------------- Flow ---------------------------------- */

type FlowStage = "collect" | "render" | "upload" | "done" | "error";

interface FlowResult {
  id: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  counts: BackupCounts;
}

interface FlowState {
  stage: FlowStage;
  failedAt?: number;
  pagesDone?: number;
  totalPages?: number;
  uploadPct?: number;
  error?: string;
  result?: FlowResult;
}

/* ------------------------------- Constants ------------------------------- */

const CONFIRM_PHRASE = "RESET-STORE";
const JSON_HEADERS = { "content-type": "application/json" };

/** Display caps that keep PDF generation fast and bounded. */
const MAX_ROWS = {
  products: 400,
  categories: 60,
  builds: 120,
  orders: 300,
  maintenance: 300,
} as const;

/** A4 @96dpi — the off-DOM report page width. */
const PAGE_W = 794;

const COUNT_CARDS: {
  key: keyof BackupCounts;
  label: string;
  icon: LucideIcon;
  tone: string;
  hint: string;
}[] = [
  { key: "products", label: "المنتجات", icon: Package, tone: "text-primary", hint: "كتالوج المنتجات" },
  { key: "categories", label: "الفئات", icon: FolderTree, tone: "text-amber", hint: "أقسام المتجر" },
  { key: "builds", label: "التجميعات", icon: Cpu, tone: "text-foreground", hint: "تجميعات PC" },
  { key: "orders", label: "الطلبات", icon: ShoppingCart, tone: "text-mint", hint: "سجل الطلبات" },
  { key: "maintenance", label: "طلبات الصيانة", icon: Wrench, tone: "text-danger", hint: "سجل الصيانة" },
];

const BACKUP_CONTENTS: { icon: LucideIcon; label: string }[] = [
  { icon: Package, label: "كل المنتجات والمواصفات والأسعار" },
  { icon: FolderTree, label: "الفئات وترتيبها" },
  { icon: Cpu, label: "تجميعات PC بمكوناتها" },
  { icon: ShoppingCart, label: "الطلبات بتفاصيلها" },
  { icon: Wrench, label: "طلبات الصيانة" },
  { icon: SettingsIcon, label: "إعدادات المتجر" },
];

const FLOW_STAGES: { label: string; hint: string }[] = [
  { label: "جاري تجميع البيانات", hint: "لقطة ذرّية واحدة من قاعدة البيانات" },
  { label: "جاري توليد التقرير", hint: "صفحات PDF فاخرة بالعربي" },
  { label: "جاري رفع الملف", hint: "تخزين سحابي موثّق على Cloudinary" },
  { label: "اكتمل", hint: "النسخة جاهزة ومسجّلة في السجل" },
];

/* ------------------------------- Formatting ------------------------------ */

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const cairoDateFmt = new Intl.DateTimeFormat("ar-EG", {
  timeZone: "Africa/Cairo",
  year: "numeric",
  month: "long",
  day: "numeric",
  numberingSystem: "latn",
});
const cairoTimeFmt = new Intl.DateTimeFormat("ar-EG", {
  timeZone: "Africa/Cairo",
  hour: "numeric",
  minute: "2-digit",
  numberingSystem: "latn",
});
const cairoShortFmt = new Intl.DateTimeFormat("ar-EG", {
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "short",
  numberingSystem: "latn",
});

const fmtNum = (n: number) => nf.format(n);
const fmtPrice = (v: number) => `${nf.format(Math.round(v))} ج.م`;

const safeDate = (iso: string): Date | null => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};
const fmtDateFull = (iso: string) => {
  const d = safeDate(iso);
  return d ? cairoDateFmt.format(d) : "—";
};
const fmtTime = (iso: string) => {
  const d = safeDate(iso);
  return d ? cairoTimeFmt.format(d) : "—";
};
const fmtDateShort = (iso: string) => {
  const d = safeDate(iso);
  return d ? cairoShortFmt.format(d) : "—";
};

function fmtSize(bytes?: number | null): string {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024) return `${fmtNum(bytes)} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const countsSummary = (c: BackupCounts) =>
  `${fmtNum(c.products)} منتج · ${fmtNum(c.categories)} فئة · ${fmtNum(c.builds)} تجميعة · ${fmtNum(c.orders)} طلب · ${fmtNum(c.maintenance)} طلب صيانة`;

async function readApiError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: unknown };
    if (typeof data?.error === "string" && data.error) return data.error;
  } catch {
    /* fall through to the generic message */
  }
  return "حدث خطأ غير متوقع — حاول تاني";
}

/* ------------------------------ Report CSS ------------------------------- */
/* Scoped under .htr-* — injected into <head> only while generating, so the
 * browser (and therefore html2canvas) resolves every rule deterministically. */

const REPORT_CSS = `
.htr-root{position:fixed;left:-9999px;top:0;width:794px;direction:rtl;text-align:right;color:#24221d;background:#f7f5f0;font-family:var(--font-body),"IBM Plex Sans Arabic",system-ui,sans-serif;line-height:1.6;z-index:-1;}
.htr-page{position:relative;width:794px;height:1123px;overflow:hidden;display:flex;flex-direction:column;background:#f7f5f0;}
.htr-head{flex:none;height:56px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 42px;background:#fcfbf8;border-bottom:1px solid rgba(36,34,29,.14);}
.htr-head-titlebox{display:flex;flex-direction:column;gap:3px;min-width:0;}
.htr-head-sec{font-family:var(--font-display),"Alexandria",sans-serif;font-size:13px;font-weight:700;color:#24221d;line-height:1;}
.htr-head-sub{font-size:8.5px;color:#9b958b;line-height:1;}
.htr-head-brand{font-family:var(--font-tech),"Space Grotesk",monospace;font-size:10px;font-weight:600;letter-spacing:.22em;color:#6e695d;}
.htr-body{flex:1 1 auto;min-height:0;padding:24px 42px;overflow:hidden;}
.htr-body-plain{padding:0;}
.htr-foot{flex:none;height:42px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 42px;background:#fcfbf8;border-top:1px solid rgba(36,34,29,.14);font-size:9px;color:#6e695d;}
.htr-foot-side{display:flex;align-items:baseline;gap:4px;white-space:nowrap;}
.htr-pn{font-family:var(--font-tech),"Space Grotesk",monospace;font-size:9.5px;font-weight:700;color:#24221d;}
.htr-foot-mid{color:#9b958b;white-space:nowrap;}
.htr-foot-latin{font-family:var(--font-tech),"Space Grotesk",monospace;font-size:8px;color:#9b958b;white-space:nowrap;}
.htr-band{position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;background:#24221d;border-radius:12px;padding:14px 22px 14px 18px;margin-bottom:12px;}
.htr-band-title{color:#fbfaf7;font-family:var(--font-display),"Alexandria",sans-serif;font-size:16px;font-weight:800;line-height:1.2;}
.htr-band-side{display:flex;align-items:center;gap:10px;white-space:nowrap;}
.htr-band-count{padding:4px 12px;border-radius:999px;background:rgba(255,255,255,.15);color:#fbfaf7;font-size:10px;font-weight:600;}
.htr-band-latin{font-family:var(--font-tech),"Space Grotesk",monospace;font-size:8.5px;letter-spacing:.26em;color:rgba(251,250,247,.55);}
.htr-band-accent{position:absolute;top:0;bottom:0;right:0;width:4px;border-radius:0 12px 12px 0;background:#1a5ca6;}
.htr-cols{display:grid;column-gap:10px;align-items:center;padding:8px 14px;background:#f0ede6;border-radius:9px;font-size:9px;font-weight:700;color:#6e695d;}
.htr-row{display:grid;column-gap:10px;align-items:center;background:#ffffff;border:1px solid rgba(36,34,29,.10);border-radius:10px;padding:9px 14px;margin-bottom:6px;}
.htr-cols-products,.htr-row-products{grid-template-columns:minmax(0,1fr) 84px 92px 92px 84px 48px;}
.htr-cols-categories,.htr-row-categories{grid-template-columns:minmax(0,1.7fr) minmax(0,1fr) 76px 52px;}
.htr-cols-orders,.htr-row-orders{grid-template-columns:92px 78px minmax(0,1fr) 78px 62px 88px;}
.htr-cols-maintenance,.htr-row-maintenance{grid-template-columns:92px 76px minmax(0,1fr) minmax(0,1.15fr) minmax(0,1fr) 84px;}
.htr-row-build{display:block;}
.htr-cell{min-width:0;overflow:hidden;font-size:10px;color:#4a463c;line-height:1.5;}
.htr-col-center{text-align:center;}
.htr-tech{font-family:var(--font-tech),"Space Grotesk",monospace;}
.htr-p-namebox{min-width:0;}
.htr-p-name{font-size:11px;font-weight:700;color:#24221d;line-height:1.45;}
.htr-flag{display:inline-block;margin-right:6px;padding:1.5px 8px;border-radius:999px;background:rgba(168,123,47,.12);border:1px solid rgba(168,123,47,.25);color:#a87b2f;font-size:8px;font-weight:700;}
.htr-p-specs{margin-top:2px;font-size:8.5px;color:#9b958b;line-height:1.4;white-space:nowrap;}
.htr-brand{direction:ltr;text-align:center;font-family:var(--font-tech),"Space Grotesk",monospace;font-size:8.5px;font-weight:500;color:#4a463c;}
.htr-cat{font-size:9.5px;color:#4a463c;}
.htr-price{display:flex;flex-direction:column;line-height:1.3;}
.htr-price-now{font-size:11px;font-weight:700;color:#24221d;white-space:nowrap;}
.htr-price-old{font-size:8.5px;color:#9b958b;text-decoration:line-through;white-space:nowrap;}
.htr-stock{font-family:var(--font-tech),"Space Grotesk",monospace;font-size:10.5px;font-weight:600;color:#24221d;text-align:center;}
.htr-chip{display:inline-block;padding:3px 9px;border-radius:999px;font-size:8.5px;font-weight:700;line-height:1.4;border:1px solid transparent;white-space:nowrap;}
.htr-chip-mint{background:rgba(46,125,91,.09);border-color:rgba(46,125,91,.28);color:#2e7d5b;}
.htr-chip-amber{background:rgba(168,123,47,.10);border-color:rgba(168,123,47,.30);color:#a87b2f;}
.htr-chip-danger{background:rgba(179,56,47,.08);border-color:rgba(179,56,47,.28);color:#b3382f;}
.htr-chip-cobalt{background:rgba(26,92,166,.08);border-color:rgba(26,92,166,.28);color:#1a5ca6;}
.htr-chip-neutral{background:#f0ede6;border-color:rgba(36,34,29,.16);color:#6e695d;}
.htr-c-name{display:flex;align-items:center;gap:10px;min-width:0;}
.htr-c-dot{flex:none;width:10px;height:10px;border-radius:999px;border:1px solid rgba(36,34,29,.20);}
.htr-c-title{font-size:11px;font-weight:700;color:#24221d;line-height:1.4;}
.htr-c-desc{margin-top:1px;font-size:8.5px;color:#9b958b;line-height:1.5;max-height:26px;overflow:hidden;}
.htr-c-slug{direction:ltr;text-align:center;font-family:var(--font-tech),"Space Grotesk",monospace;font-size:8.5px;color:#6e695d;}
.htr-b-top{display:flex;align-items:center;flex-wrap:wrap;gap:8px;}
.htr-b-title{flex:1 1 150px;min-width:0;font-size:12px;font-weight:700;color:#24221d;line-height:1.4;}
.htr-b-total{font-size:11.5px;font-weight:700;color:#24221d;white-space:nowrap;}
.htr-b-comp-head{display:grid;grid-template-columns:86px minmax(0,1fr) 44px 88px;column-gap:10px;margin-top:10px;padding:6px 2px 0;border-top:1px solid rgba(36,34,29,.12);font-size:8.5px;font-weight:700;color:#9b958b;}
.htr-b-comp{display:grid;grid-template-columns:86px minmax(0,1fr) 44px 88px;column-gap:10px;align-items:baseline;padding:5px 2px;border-top:1px dashed rgba(36,34,29,.10);font-size:9.5px;color:#4a463c;}
.htr-b-role{color:#6e695d;}
.htr-b-name{font-weight:600;color:#24221d;min-width:0;overflow:hidden;white-space:nowrap;}
.htr-b-spec{color:#9b958b;font-weight:400;font-size:8.5px;}
.htr-b-qty{direction:ltr;text-align:center;font-family:var(--font-tech),"Space Grotesk",monospace;font-size:9px;color:#6e695d;}
.htr-b-cprice{font-size:9px;color:#4a463c;white-space:nowrap;}
.htr-o-ref{direction:ltr;text-align:right;font-family:var(--font-tech),"Space Grotesk",monospace;font-size:9px;font-weight:600;color:#1a5ca6;line-height:1.4;}
.htr-date{text-align:center;font-size:9px;color:#6e695d;line-height:1.5;}
.htr-o-cust{min-width:0;}
.htr-o-name{display:block;font-size:10.5px;font-weight:700;color:#24221d;line-height:1.4;overflow:hidden;white-space:nowrap;}
.htr-o-phone{display:block;margin-top:1px;direction:ltr;text-align:right;font-family:var(--font-tech),"Space Grotesk",monospace;font-size:8.5px;color:#9b958b;}
.htr-o-items{text-align:center;font-size:9.5px;color:#4a463c;}
.htr-m-device{font-size:9.5px;color:#24221d;line-height:1.5;}
.htr-m-problem{font-size:9.5px;color:#4a463c;line-height:1.5;}
.htr-empty{margin-top:10px;padding:36px 20px;border:1.5px dashed rgba(36,34,29,.20);border-radius:12px;text-align:center;color:#9b958b;font-size:10.5px;}
.htr-capnote{margin-top:2px;padding:8px 12px;border-radius:9px;background:rgba(168,123,47,.07);border:1px solid rgba(168,123,47,.22);color:#a87b2f;font-size:9px;font-weight:600;}
.htr-cover{position:relative;display:flex;flex-direction:column;width:100%;height:100%;background:#f7f5f0;}
.htr-cover-grid{position:absolute;top:0;right:0;bottom:0;left:0;background-image:linear-gradient(rgba(36,34,29,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(36,34,29,.045) 1px,transparent 1px);background-size:56px 56px;}
.htr-cover-glow{position:absolute;top:-130px;left:-110px;width:430px;height:430px;background:radial-gradient(circle,rgba(26,92,166,.10) 0%,rgba(26,92,166,.03) 45%,rgba(26,92,166,0) 70%);}
.htr-cover-glow2{position:absolute;bottom:-90px;right:-100px;width:380px;height:380px;background:radial-gradient(circle,rgba(168,123,47,.10) 0%,rgba(168,123,47,.03) 45%,rgba(168,123,47,0) 70%);}
.htr-cover-inner{position:relative;display:flex;flex-direction:column;flex:1;padding:56px 54px 44px;}
.htr-wordmark{direction:ltr;font-family:var(--font-tech),"Space Grotesk",monospace;font-size:56px;font-weight:700;letter-spacing:-.015em;line-height:1;transform:skewX(-8deg);transform-origin:100% 100%;}
.htr-wm-ink{color:#24221d;}
.htr-wm-cobalt{color:#1a5ca6;}
.htr-wordmark-sub{margin-top:10px;direction:ltr;text-align:right;font-family:var(--font-tech),"Space Grotesk",monospace;font-size:9.5px;letter-spacing:.4em;color:#9b958b;}
.htr-cover-secret{display:inline-block;margin-top:26px;padding:5px 14px;border-radius:999px;border:1px solid rgba(168,123,47,.35);background:rgba(168,123,47,.08);color:#a87b2f;font-size:10px;font-weight:700;}
.htr-cover-main{margin-top:46px;}
.htr-cover-title{margin:0;font-family:var(--font-display),"Alexandria",sans-serif;font-size:33px;font-weight:800;color:#24221d;line-height:1.4;}
.htr-cover-sub{margin:10px 0 0;font-size:12px;color:#6e695d;line-height:1.9;}
.htr-meta{margin-top:24px;background:#ffffff;border:1px solid rgba(36,34,29,.10);border-radius:14px;padding:5px 20px;}
.htr-meta-row{display:flex;align-items:baseline;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px dashed rgba(36,34,29,.10);}
.htr-meta-row-last{border-bottom:none;}
.htr-meta-label{flex:none;font-size:9.5px;font-weight:600;color:#9b958b;}
.htr-meta-value{min-width:0;font-size:11px;font-weight:700;color:#24221d;text-align:left;line-height:1.7;}
.htr-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:auto;}
.htr-stat{position:relative;background:#ffffff;border:1px solid rgba(36,34,29,.10);border-radius:12px;padding:12px 14px 15px;}
.htr-stat-label{display:block;font-size:9.5px;font-weight:600;color:#6e695d;}
.htr-stat-num{display:block;margin-top:7px;direction:ltr;text-align:right;font-family:var(--font-tech),"Space Grotesk",monospace;font-size:25px;font-weight:700;color:#24221d;line-height:1;}
.htr-stat-bar{position:absolute;right:14px;bottom:0;left:14px;height:3px;border-radius:999px 999px 0 0;}
.htr-cover-footline{margin-top:20px;padding-top:14px;border-top:1px solid rgba(36,34,29,.14);display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:10px;font-size:9px;color:#9b958b;}
.htr-dotsep{color:rgba(36,34,29,.25);}
.htr-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.htr-info-cell{min-width:0;background:#ffffff;border:1px solid rgba(36,34,29,.10);border-radius:12px;padding:12px 16px;}
.htr-info-label{display:block;font-size:9px;font-weight:600;color:#9b958b;margin-bottom:5px;}
.htr-info-value{display:block;min-width:0;overflow:hidden;white-space:nowrap;font-size:11.5px;font-weight:700;color:#24221d;line-height:1.5;}
.htr-info-latin{direction:ltr;text-align:right;font-family:var(--font-tech),"Space Grotesk",monospace;font-size:10px;font-weight:600;}
.htr-desc-card{margin-top:12px;background:#ffffff;border:1px solid rgba(36,34,29,.10);border-radius:12px;padding:16px 18px;}
.htr-desc-label{display:inline-block;padding:3px 11px;border-radius:999px;background:#f0ede6;color:#6e695d;font-size:9px;font-weight:700;}
.htr-desc-text{margin:10px 0 0;font-size:10.5px;color:#4a463c;line-height:2.1;}
.htr-toc-card{margin-top:12px;background:#ffffff;border:1px solid rgba(36,34,29,.10);border-radius:12px;padding:14px 18px 16px;}
.htr-toc-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px dashed rgba(36,34,29,.10);font-size:10.5px;color:#4a463c;}
.htr-toc-row-last{border-bottom:none;}
.htr-toc-count{direction:ltr;font-family:var(--font-tech),"Space Grotesk",monospace;font-size:12px;font-weight:700;color:#1a5ca6;}
`;

/* --------------------------- PDF micro helpers --------------------------- */

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );

const trunc = (s: string, max: number) =>
  s.length > max ? `${s.slice(0, Math.max(0, max - 1)).trimEnd()}…` : s;

const AVAIL_TONE: Record<string, string> = {
  "in-stock": "mint",
  "low-stock": "amber",
  "out-of-stock": "danger",
  "pre-order": "cobalt",
};

const ORDER_STATUS_PDF: Record<string, { label: string; tone: string }> = {
  new: { label: "جديد", tone: "cobalt" },
  contacted: { label: "تم التواصل", tone: "amber" },
  confirmed: { label: "مؤكد", tone: "mint" },
  completed: { label: "مكتمل", tone: "mint" },
  cancelled: { label: "ملغي", tone: "danger" },
};

const MAINT_STATUS_PDF: Record<string, { label: string; tone: string }> = {
  new: { label: "طلب جديد", tone: "cobalt" },
  "in-review": { label: "قيد الفحص", tone: "amber" },
  repairing: { label: "جاري الإصلاح", tone: "amber" },
  ready: { label: "جاهز للاستلام", tone: "mint" },
  delivered: { label: "تم التسليم", tone: "mint" },
  cancelled: { label: "ملغي", tone: "danger" },
};

const pdfChip = (label: string, tone: string) =>
  `<span class="htr-chip htr-chip-${tone}">${esc(label)}</span>`;

/* ----------------------------- Cloudinary XHR ---------------------------- */

/** Signed direct upload of the PDF blob — real progress events, no secrets. */
function uploadRawPdf(
  signed: SignedUpload,
  blob: Blob,
  fileName: string,
  onProgress: (pct: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", signed.upload_url);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        // Cap at 99% — 100% is only honest once the response is parsed.
        onProgress(Math.min(99, Math.round((ev.loaded / ev.total) * 100)));
      }
    };
    xhr.onload = () => {
      let secureUrl: string | undefined;
      let message = `فشل رفع الملف للتخزين السحابي (${xhr.status})`;
      try {
        const body = JSON.parse(xhr.responseText) as {
          secure_url?: string;
          error?: { message?: string };
        };
        secureUrl = body.secure_url;
        if (body.error?.message) message = `فشل الرفع: ${body.error.message}`;
      } catch {
        /* keep the default message */
      }
      if (xhr.status >= 200 && xhr.status < 300 && secureUrl) resolve(secureUrl);
      else reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error("انقطع الاتصال أثناء رفع الملف — راجع النت"));
    xhr.onabort = () => reject(new Error("تم إلغاء رفع الملف"));

    const form = new FormData();
    Object.entries(signed.params).forEach(([key, val]) => form.append(key, String(val)));
    form.append("api_key", signed.api_key);
    form.append("signature", signed.signature);
    // Blob with an explicit filename + type — Cloudinary requires it for raw files.
    form.append("file", blob, fileName);
    xhr.send(form);
  });
}

/* ============================== PDF GENERATOR ============================= */
/**
 * Builds the full premium backup report off-DOM as fixed 794×1123px pages,
 * then rasterizes each page (html2canvas @2x → JPEG 0.92) into an A4 jsPDF.
 *
 * Pagination guarantee: every page body has a FIXED height with
 * overflow:hidden; rows are appended one by one and measured against the
 * body's real scrollHeight — a row that would overflow is moved to a fresh
 * page (with the column header re-inserted), so no row is ever cut mid-page.
 */

async function generateBackupPdf(opts: {
  backup: { id: string; createdAt: string; counts: BackupCounts; exportPeriod: string };
  snapshot: SnapshotData;
  serverTime: string;
  onProgress?: (done: number, total: number) => void;
}): Promise<Blob> {
  const { backup, snapshot, onProgress } = opts;

  /* Fonts best-effort wait (they are already used by the live page). */
  try {
    await document.fonts.ready;
  } catch {
    /* proceed — the browser has the fallbacks */
  }

  const settings = snapshot.settings;
  const storeName = settings?.storeName?.trim() || BUSINESS.nameArabic;
  const genDate = fmtDateFull(opts.serverTime);
  const genTime = fmtTime(opts.serverTime);
  const refId = `HT-BKP-${backup.id
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(-8)
    .padStart(8, "0")}`;
  const catById = new Map(snapshot.categories.map((c) => [c.id, c.name] as const));
  const totalRecords =
    backup.counts.products +
    backup.counts.categories +
    backup.counts.builds +
    backup.counts.orders +
    backup.counts.maintenance;

  /* ---- inject the scoped stylesheet + off-DOM root ---- */
  const styleEl = document.createElement("style");
  styleEl.id = "htr-report-css";
  styleEl.textContent = REPORT_CSS;
  document.head.append(styleEl);

  const root = document.createElement("div");
  root.className = "htr-root";
  root.setAttribute("dir", "rtl");
  root.setAttribute("aria-hidden", "true");
  root.style.width = `${PAGE_W}px`;
  document.body.append(root);

  try {
    /* ------------------------- page machinery ------------------------- */
    const pageRefs: { el: HTMLDivElement; cur: HTMLElement; total: HTMLElement }[] = [];
    let body: HTMLElement = document.createElement("div");
    let sectionTitle = "";

    const newPage = (withHead = true): HTMLElement => {
      const page = document.createElement("div");
      page.className = "htr-page";
      if (withHead) {
        const head = document.createElement("div");
        head.className = "htr-head";
        head.innerHTML = `<div class="htr-head-titlebox"><span class="htr-head-sec">${esc(sectionTitle)}</span><span class="htr-head-sub">${esc(storeName)} · تقرير النسخة الاحتياطية الكاملة</span></div><span class="htr-head-brand" dir="ltr">HYPER TECH</span>`;
        page.append(head);
      }
      const bd = document.createElement("div");
      bd.className = withHead ? "htr-body" : "htr-body htr-body-plain";
      const foot = document.createElement("div");
      foot.className = "htr-foot";
      const side = document.createElement("span");
      side.className = "htr-foot-side";
      const cur = document.createElement("span");
      cur.className = "htr-pn";
      const total = document.createElement("span");
      total.className = "htr-pn";
      side.append("صفحة ", cur, " من ", total);
      const mid = document.createElement("span");
      mid.className = "htr-foot-mid";
      mid.textContent = "هايبر تك — نسخة احتياطية كاملة";
      const latin = document.createElement("span");
      latin.className = "htr-foot-latin";
      latin.setAttribute("dir", "ltr");
      latin.textContent = `${genDate} — ${genTime} · ${refId}`;
      foot.append(side, mid, latin);
      page.append(bd, foot);
      root.append(page);
      body = bd;
      pageRefs.push({ el: page, cur, total });
      return bd;
    };

    /** A full report section: fresh page + divider band + paginated rows. */
    const addSectionPages = (cfg: {
      titleAr: string;
      titleLatin: string;
      count: number;
      colsHtml?: string;
      colsClass?: string;
      rows?: string[];
      rowClass?: string;
      capNote?: string | null;
    }) => {
      sectionTitle = cfg.titleAr;
      newPage();
      const band = document.createElement("div");
      band.className = "htr-band";
      band.innerHTML = `<div class="htr-band-title">${esc(cfg.titleAr)}</div><div class="htr-band-side"><span class="htr-band-count">${fmtNum(cfg.count)} سجل</span><span class="htr-band-latin" dir="ltr">${esc(cfg.titleLatin)}</span></div><span class="htr-band-accent"></span>`;
      body.append(band);

      const rows = cfg.rows ?? [];
      if (rows.length === 0) {
        const empty = document.createElement("div");
        empty.className = "htr-empty";
        empty.textContent = "لا توجد سجلات في هذا القسم وقت إنشاء النسخة";
        body.append(empty);
        return;
      }

      let headerOnPage = false;
      const ensureHeader = () => {
        if (headerOnPage || !cfg.colsHtml) return;
        const cols = document.createElement("div");
        cols.className = `htr-cols ${cfg.colsClass ?? ""}`;
        cols.innerHTML = cfg.colsHtml;
        body.append(cols);
        headerOnPage = true;
      };
      ensureHeader();

      for (const rowHtml of rows) {
        const row = document.createElement("div");
        row.className = `htr-row ${cfg.rowClass ?? ""}`;
        row.innerHTML = rowHtml;
        body.append(row);
        if (body.scrollHeight > body.clientHeight) {
          // Overflow → move the row to a fresh page (header re-inserted).
          body.removeChild(row);
          newPage();
          headerOnPage = false;
          ensureHeader();
          body.append(row);
          // A single row taller than a page (theoretical) is kept as-is.
        }
      }

      if (cfg.capNote) {
        const note = document.createElement("div");
        note.className = "htr-capnote";
        note.textContent = cfg.capNote;
        body.append(note);
        if (body.scrollHeight > body.clientHeight) {
          body.removeChild(note);
          newPage();
          body.append(note);
        }
      }
    };

    /* ------------------------------ cover ----------------------------- */
    const buildCover = () => {
      sectionTitle = "الغلاف";
      newPage(false);
      const statsCells: Array<[string, number, string]> = [
        ["المنتجات", backup.counts.products, "#1a5ca6"],
        ["الفئات", backup.counts.categories, "#a87b2f"],
        ["التجميعات", backup.counts.builds, "#24221d"],
        ["الطلبات", backup.counts.orders, "#2e7d5b"],
        ["طلبات الصيانة", backup.counts.maintenance, "#b3382f"],
        ["إجمالي السجلات", totalRecords, "#14476f"],
      ];
      const statsHtml = statsCells
        .map(
          ([label, n, color]) => `
          <div class="htr-stat">
            <span class="htr-stat-label">${esc(label)}</span>
            <span class="htr-stat-num" dir="ltr">${fmtNum(n)}</span>
            <span class="htr-stat-bar" style="background:${color}"></span>
          </div>`,
        )
        .join("");
      const wa = settings?.whatsappDisplay?.trim() || BUSINESS.whatsappDisplay;
      const address = settings?.address?.trim() || BUSINESS.address;
      const social = settings?.facebookUrl?.trim() || BUSINESS.facebook;
      body.innerHTML = `
        <div class="htr-cover">
          <span class="htr-cover-grid"></span>
          <span class="htr-cover-glow"></span>
          <span class="htr-cover-glow2"></span>
          <div class="htr-cover-inner">
            <div>
              <div class="htr-wordmark" dir="ltr"><span class="htr-wm-ink">HYPER</span><span class="htr-wm-cobalt"> TECH</span></div>
              <div class="htr-wordmark-sub" dir="ltr">POWER YOUR NEXT LEVEL</div>
              <span class="htr-cover-secret">سري — للاستخدام الإداري</span>
            </div>
            <div class="htr-cover-main">
              <h1 class="htr-cover-title">تقرير النسخة الاحتياطية الكاملة</h1>
              <p class="htr-cover-sub">أرشيف موثّق لكل بيانات تشغيل ${esc(storeName)} — اتولّد لحظة إنشاء النسخة من قاعدة بيانات المتجر في لقطة ذرّية واحدة.</p>
              <div class="htr-meta">
                <div class="htr-meta-row"><span class="htr-meta-label">تاريخ التصدير</span><span class="htr-meta-value">${esc(genDate)} — ${esc(genTime)} (توقيت القاهرة)</span></div>
                <div class="htr-meta-row"><span class="htr-meta-label">فترة التصدير</span><span class="htr-meta-value">${esc(trunc(backup.exportPeriod || "كل فترة نشاط المتجر", 92))}</span></div>
                <div class="htr-meta-row htr-meta-row-last"><span class="htr-meta-label">رقم النسخة</span><span class="htr-meta-value htr-tech" dir="ltr">${esc(refId)}</span></div>
              </div>
            </div>
            <div class="htr-stats">${statsHtml}</div>
            <div class="htr-cover-footline">
              <span>${esc(trunc(address, 44))}</span><span class="htr-dotsep">·</span><span class="htr-tech" dir="ltr">${esc(wa)}</span><span class="htr-dotsep">·</span><span class="htr-tech" dir="ltr">${esc(trunc(social, 42))}</span>
            </div>
          </div>
        </div>`;
    };

    /* --------------------------- store info --------------------------- */
    const buildStoreInfo = () => {
      sectionTitle = "معلومات المتجر";
      newPage();
      const s = snapshot.settings;
      const v = (val?: string | null) => esc(trunc((val ?? "").trim() || "—", 58));
      const latin = (val?: string | null) =>
        `<span class="htr-info-value htr-info-latin" dir="ltr">${esc(trunc((val ?? "").trim() || "—", 46))}</span>`;
      const tocRows: Array<[string, number]> = [
        ["المنتجات — كل المنتجات والمواصفات والأسعار", backup.counts.products],
        ["الفئات — الأقسام والترتيب والظهور", backup.counts.categories],
        ["تجميعات PC — المكونات والأسعار", backup.counts.builds],
        ["الطلبات — العملاء والأصناف والحالات", backup.counts.orders],
        ["طلبات الصيانة — الأجهزة والمشاكل والحالات", backup.counts.maintenance],
      ];
      const tocHtml = tocRows
        .map(
          ([label, n], i) =>
            `<div class="htr-toc-row${i === tocRows.length - 1 ? " htr-toc-row-last" : ""}"><span>${esc(label)}</span><span class="htr-toc-count" dir="ltr">${fmtNum(n)}</span></div>`,
        )
        .join("");
      body.innerHTML = `
        <div class="htr-band"><div class="htr-band-title">معلومات المتجر</div><div class="htr-band-side"><span class="htr-band-latin" dir="ltr">STORE PROFILE</span></div><span class="htr-band-accent"></span></div>
        <div class="htr-info-grid">
          <div class="htr-info-cell"><span class="htr-info-label">اسم المتجر</span><span class="htr-info-value">${v(s?.storeName)}</span></div>
          <div class="htr-info-cell"><span class="htr-info-label">الشعار النصي</span><span class="htr-info-value">${v(s?.tagline)}</span></div>
          <div class="htr-info-cell"><span class="htr-info-label">رقم الواتساب</span>${latin(s?.whatsappDisplay || s?.whatsappNumber)}</div>
          <div class="htr-info-cell"><span class="htr-info-label">العنوان</span><span class="htr-info-value">${v(s?.address)}</span></div>
          <div class="htr-info-cell"><span class="htr-info-label">فيسبوك</span>${latin(s?.facebookUrl)}</div>
          <div class="htr-info-cell"><span class="htr-info-label">تيك توك</span>${latin(s?.tiktokUrl)}</div>
        </div>
        <div class="htr-desc-card">
          <span class="htr-desc-label">وصف النشاط</span>
          <p class="htr-desc-text">${esc((s?.businessDescription ?? "").trim() || BUSINESS.description)}</p>
        </div>
        <div class="htr-toc-card">
          <span class="htr-desc-label">محتويات التقرير</span>
          ${tocHtml}
        </div>`;
    };

    /* ----------------------------- products --------------------------- */
    const productRows = snapshot.products.slice(0, MAX_ROWS.products).map((p) => {
      const specsLine = (p.specs ?? [])
        .slice(0, 3)
        .map((sp) => `${sp.label}: ${sp.value}`)
        .join("  ·  ");
      const cat = catById.get(p.categoryId) ?? "غير مصنّف";
      const availLabel = AVAILABILITY_META[p.availability]?.label ?? "—";
      const availTone = AVAIL_TONE[p.availability] ?? "neutral";
      return `
        <div class="htr-p-namebox">
          <div class="htr-p-name">${esc(trunc(p.name || "—", 46))}${p.featured ? '<span class="htr-flag">مميز</span>' : ""}</div>
          <div class="htr-p-specs">${esc(trunc(specsLine || p.shortDescription || "", 76))}</div>
        </div>
        <div class="htr-cell htr-brand" dir="ltr">${esc(trunc(p.brand || "—", 16))}</div>
        <div class="htr-cell htr-cat">${esc(trunc(cat, 16))}</div>
        <div class="htr-cell htr-price"><span class="htr-price-now">${fmtPrice(p.price)}</span>${p.oldPrice && p.oldPrice > p.price ? `<span class="htr-price-old">${fmtPrice(p.oldPrice)}</span>` : ""}</div>
        <div class="htr-cell htr-col-center">${pdfChip(availLabel, availTone)}</div>
        <div class="htr-cell htr-stock" dir="ltr">${fmtNum(Math.max(0, p.stockQty ?? 0))}</div>`;
    });

    /* ---------------------------- categories -------------------------- */
    const categoryRows = snapshot.categories.slice(0, MAX_ROWS.categories).map((c) => {
      const accent = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c.accent ?? "")
        ? c.accent
        : "#1a5ca6";
      return `
        <div class="htr-c-name">
          <span class="htr-c-dot" style="background:${accent}"></span>
          <div class="htr-p-namebox">
            <div class="htr-c-title">${esc(trunc(c.name || "—", 34))}</div>
            <div class="htr-c-desc">${esc(trunc(c.description || c.tagline || "", 96))}</div>
          </div>
        </div>
        <div class="htr-cell htr-c-slug" dir="ltr">${esc(trunc(c.slug || "—", 22))}</div>
        <div class="htr-cell htr-col-center">${c.active !== false ? pdfChip("ظاهرة", "mint") : pdfChip("مخفية", "neutral")}</div>
        <div class="htr-cell htr-stock" dir="ltr">${fmtNum(c.order ?? 0)}</div>`;
    });

    /* ------------------------------ builds ---------------------------- */
    const buildRows = snapshot.builds.slice(0, MAX_ROWS.builds).map((b) => {
      const comps = (b.components ?? []).slice(0, 12);
      const extra = (b.components ?? []).length - comps.length;
      const compHtml = comps
        .map(
          (cmp) => `
          <div class="htr-b-comp">
            <span class="htr-b-role">${esc(trunc(cmp.role || "—", 14))}</span>
            <span class="htr-b-name">${esc(trunc(cmp.name || "—", 38))}${cmp.spec ? `<span class="htr-b-spec"> · ${esc(trunc(cmp.spec, 24))}</span>` : ""}</span>
            <span class="htr-b-qty" dir="ltr">×${fmtNum(cmp.qty ?? 1)}</span>
            <span class="htr-b-cprice">${cmp.price != null ? fmtPrice(cmp.price) : "—"}</span>
          </div>`,
        )
        .join("");
      const availLabel = AVAILABILITY_META[b.availability]?.label ?? "—";
      const availTone = AVAIL_TONE[b.availability] ?? "neutral";
      return `
        <div class="htr-b-top">
          <span class="htr-b-title">${esc(trunc(b.title || "—", 46))}</span>
          ${pdfChip(BUILD_TYPE_META[b.type] ?? b.type, "neutral")}
          ${pdfChip(availLabel, availTone)}
          <span class="htr-b-total">${fmtPrice(b.totalPrice)}</span>
        </div>
        ${
          comps.length === 0
            ? '<div class="htr-capnote">لا توجد مكونات مسجّلة لهذه التجميعة</div>'
            : `<div class="htr-b-comp-head"><span>الدور</span><span>المكوّن</span><span class="htr-col-center">الكمية</span><span>السعر</span></div>${compHtml}${
                extra > 0 ? `<div class="htr-capnote">و ${fmtNum(extra)} مكوّن إضافي غير معروض</div>` : ""
              }`
        }`;
    });

    /* ------------------------------ orders ---------------------------- */
    const orderRows = snapshot.orders.slice(0, MAX_ROWS.orders).map((o) => {
      const itemCount = (o.items ?? []).reduce((n, it) => n + (it.qty ?? 1), 0);
      const itemsLabel =
        itemCount === 0 ? "—" : itemCount === 1 ? "صنف واحد" : `${fmtNum(itemCount)} أصناف`;
      const st = ORDER_STATUS_PDF[o.status] ?? { label: o.status, tone: "neutral" };
      return `
        <span class="htr-o-ref" dir="ltr">${esc(trunc(o.ref || "—", 20))}</span>
        <span class="htr-cell htr-date">${esc(fmtDateShort(o.createdAt))}</span>
        <span class="htr-o-cust"><span class="htr-o-name">${esc(trunc(o.customerName || "—", 26))}</span><span class="htr-o-phone" dir="ltr">${esc(o.customerPhone || "—")}</span></span>
        <span class="htr-cell htr-col-center">${pdfChip(st.label, st.tone)}</span>
        <span class="htr-cell htr-o-items">${esc(itemsLabel)}</span>
        <span class="htr-cell htr-price"><span class="htr-price-now">${fmtPrice(o.total)}</span></span>`;
    });

    /* --------------------------- maintenance -------------------------- */
    const maintenanceRows = snapshot.maintenance.slice(0, MAX_ROWS.maintenance).map((m) => {
      const st = MAINT_STATUS_PDF[m.status] ?? { label: m.status, tone: "neutral" };
      const device = [DEVICE_TYPE_META[m.deviceType] ?? m.deviceType, m.deviceBrand, m.deviceModel]
        .filter(Boolean)
        .join(" ");
      return `
        <span class="htr-o-ref" dir="ltr">${esc(trunc(m.ref || "—", 20))}</span>
        <span class="htr-cell htr-date">${esc(fmtDateShort(m.createdAt))}</span>
        <span class="htr-o-cust"><span class="htr-o-name">${esc(trunc(m.customerName || "—", 24))}</span><span class="htr-o-phone" dir="ltr">${esc(m.customerPhone || "—")}</span></span>
        <span class="htr-cell htr-m-device">${esc(trunc(device || "—", 34))}</span>
        <span class="htr-cell htr-m-problem">${esc(trunc(PROBLEM_CATEGORY_META[m.problemCategory] ?? m.problemCategory ?? "—", 24))}</span>
        <span class="htr-cell htr-col-center">${pdfChip(st.label, st.tone)}</span>`;
    });

    /* ----------------------------- assemble --------------------------- */
    buildCover();
    buildStoreInfo();
    addSectionPages({
      titleAr: "المنتجات",
      titleLatin: "PRODUCTS",
      count: backup.counts.products,
      colsClass: "htr-cols-products",
      colsHtml: `<span>المنتج</span><span class="htr-col-center">الماركة</span><span class="htr-col-center">الفئة</span><span>السعر</span><span class="htr-col-center">التوفر</span><span class="htr-col-center">المخزون</span>`,
      rowClass: "htr-row-products",
      rows: productRows,
      capNote:
        snapshot.products.length > MAX_ROWS.products
          ? `و ${fmtNum(snapshot.products.length - MAX_ROWS.products)} صف إضافي غير معروض — حد العرض الآمن للحفاظ على سرعة توليد التقرير`
          : null,
    });
    addSectionPages({
      titleAr: "الفئات",
      titleLatin: "CATEGORIES",
      count: backup.counts.categories,
      colsClass: "htr-cols-categories",
      colsHtml: `<span>الفئة</span><span class="htr-col-center">المعرّف</span><span class="htr-col-center">الظهور</span><span class="htr-col-center">الترتيب</span>`,
      rowClass: "htr-row-categories",
      rows: categoryRows,
      capNote:
        snapshot.categories.length > MAX_ROWS.categories
          ? `و ${fmtNum(snapshot.categories.length - MAX_ROWS.categories)} فئة إضافية غير معروضة`
          : null,
    });
    addSectionPages({
      titleAr: "تجميعات PC",
      titleLatin: "PC BUILDS",
      count: backup.counts.builds,
      rowClass: "htr-row-build",
      rows: buildRows,
      capNote:
        snapshot.builds.length > MAX_ROWS.builds
          ? `و ${fmtNum(snapshot.builds.length - MAX_ROWS.builds)} تجميعة إضافية غير معروضة`
          : null,
    });
    addSectionPages({
      titleAr: "الطلبات",
      titleLatin: "ORDERS",
      count: backup.counts.orders,
      colsClass: "htr-cols-orders",
      colsHtml: `<span class="htr-col-center">المرجع</span><span class="htr-col-center">التاريخ</span><span>العميل</span><span class="htr-col-center">الحالة</span><span class="htr-col-center">الأصناف</span><span>الإجمالي</span>`,
      rowClass: "htr-row-orders",
      rows: orderRows,
      capNote:
        snapshot.orders.length > MAX_ROWS.orders
          ? `و ${fmtNum(snapshot.orders.length - MAX_ROWS.orders)} طلب إضافي غير معروض`
          : null,
    });
    addSectionPages({
      titleAr: "طلبات الصيانة",
      titleLatin: "MAINTENANCE",
      count: backup.counts.maintenance,
      colsClass: "htr-cols-maintenance",
      colsHtml: `<span class="htr-col-center">المرجع</span><span class="htr-col-center">التاريخ</span><span>العميل</span><span>الجهاز</span><span>المشكلة</span><span class="htr-col-center">الحالة</span>`,
      rowClass: "htr-row-maintenance",
      rows: maintenanceRows,
      capNote:
        snapshot.maintenance.length > MAX_ROWS.maintenance
          ? `و ${fmtNum(snapshot.maintenance.length - MAX_ROWS.maintenance)} طلب صيانة إضافي غير معروض`
          : null,
    });

    /* page numbers (known only after everything is laid out) */
    const totalPages = pageRefs.length;
    pageRefs.forEach((p, i) => {
      p.cur.textContent = fmtNum(i + 1);
      p.total.textContent = fmtNum(totalPages);
    });

    /* ---------------------------- rasterize --------------------------- */
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      unit: "px",
      format: "a4",
      orientation: "portrait",
      hotfixes: ["px_scaling"],
      compress: true,
    });
    pdf.setProperties({
      title: `HYPER TECH — تقرير النسخة الاحتياطية الكاملة (${genDate})`,
      subject: backup.exportPeriod,
      author: storeName,
      creator: "HYPER TECH — Backup Center",
    });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pageRefs.length; i++) {
      const canvas = await html2canvas(pageRefs[i].el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f7f5f0",
        logging: false,
      });
      const img = canvas.toDataURL("image/jpeg", 0.92);
      if (i > 0) pdf.addPage("a4", "portrait");
      pdf.addImage(img, "JPEG", 0, 0, pw, ph);
      canvas.width = 0;
      canvas.height = 0;
      onProgress?.(i + 1, pageRefs.length);
      if (i % 3 === 0) await new Promise((r) => setTimeout(r, 0)); // let the UI breathe
    }

    return pdf.output("blob");
  } finally {
    root.remove();
    styleEl.remove();
  }
}

/* =============================== COMPONENT =============================== */

function SectionHeading({
  icon: Icon,
  title,
  desc,
  id,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  id: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-hair bg-elevated shadow-card">
        <Icon className="h-5 w-5 text-primary" aria-hidden />
      </span>
      <div className="min-w-0">
        <h3 id={id} className="font-display text-lg font-bold leading-tight">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function BackupStatusBadge({ status }: { status: BackupRow["status"] }) {
  if (status === "success") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-mint/30 bg-mint/10 px-2.5 py-1 text-[0.68rem] font-bold text-mint">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
        ناجحة
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber/35 bg-amber/10 px-2.5 py-1 text-[0.68rem] font-bold text-amber">
        <Clock className="h-3.5 w-3.5" aria-hidden />
        قيد الإنشاء
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-2.5 py-1 text-[0.68rem] font-bold text-danger">
      <XCircle className="h-3.5 w-3.5" aria-hidden />
      فشلت
    </span>
  );
}

function CountChip({ n, label }: { n: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-raised px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
      <span className="font-tech font-bold text-foreground" dir="ltr">
        {fmtNum(n)}
      </span>
      {label}
    </span>
  );
}

/** Live multi-stage tracker for the backup creation flow. */
function FlowTracker({ flow, activeIdx }: { flow: FlowState; activeIdx: number }) {
  const stageDetail = (idx: number): string | null => {
    if (idx === 1 && flow.stage === "render") {
      if (flow.pagesDone && flow.totalPages) {
        return `توليد الصفحات: ${fmtNum(flow.pagesDone)} / ${fmtNum(flow.totalPages)}`;
      }
      return "بناء هيكل التقرير…";
    }
    if (idx === 2 && flow.stage === "upload") {
      return typeof flow.uploadPct === "number"
        ? `رفع الملف: ${fmtNum(flow.uploadPct)}%`
        : "تجهيز الرفع…";
    }
    return null;
  };

  return (
    <div
      aria-live="polite"
      className="rounded-2xl border border-hair bg-elevated/60 p-4 sm:p-5"
    >
      <ol className="space-y-0" aria-label="مراحل إنشاء النسخة الاحتياطية">
        {FLOW_STAGES.map((s, i) => {
          const done = i < activeIdx || (flow.stage === "done" && i === 3);
          const active = i === activeIdx && !done;
          const failed = flow.stage === "error" && i === activeIdx;
          const detail = stageDetail(i);
          return (
            <li key={s.label} className="relative flex items-start gap-3 pb-5 last:pb-0">
              {i < FLOW_STAGES.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute bottom-0 right-[15px] top-9 w-px",
                    done ? "bg-mint/40" : "bg-hair",
                  )}
                />
              ) : null}
              <span
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                  done && "border-mint/40 bg-mint/10 text-mint",
                  active && !failed && "border-primary/40 bg-primary/10 text-primary",
                  failed && "border-danger/40 bg-danger/10 text-danger",
                  !done && !active && !failed && "border-hair bg-raised text-faint",
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : failed ? (
                  <XCircle className="h-4 w-4" aria-hidden />
                ) : active ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <span className="font-tech text-xs font-bold" dir="ltr">
                    {i + 1}
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <p
                  className={cn(
                    "text-sm font-bold leading-none",
                    done && "text-mint",
                    failed && "text-danger",
                    !done && !failed && "text-foreground",
                  )}
                >
                  {s.label}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">{s.hint}</p>
                {detail ? (
                  <div className="mt-2">
                    <p className="font-tech text-xs font-bold text-primary" dir="auto">
                      {detail}
                    </p>
                    {flow.stage === "upload" && i === 2 ? (
                      <div className="mt-1.5 h-1.5 max-w-xs overflow-hidden rounded-full bg-foreground/[0.06]">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${flow.uploadPct ?? 0}%` }}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Success card shown once the PDF is uploaded and the record finalized. */
function BackupSuccessCard({ result }: { result: FlowResult }) {
  return (
    <div className="rounded-2xl border border-mint/30 bg-mint/[0.05] p-5 shadow-card">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-mint/30 bg-mint/10">
          <CheckCircle2 className="h-5 w-5 text-mint" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-bold leading-tight">النسخة الاحتياطية جاهزة وموثّقة</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            اترفعت للتخزين السحابي وسُجّلت في سجل النسخ تحتك
          </p>
        </div>
      </div>
      <dl className="mt-4 grid gap-x-6 gap-y-3 text-xs sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-faint">اسم الملف</dt>
          <dd className="mt-0.5 truncate font-tech font-semibold" dir="ltr">
            {result.fileName}
          </dd>
        </div>
        <div>
          <dt className="text-faint">حجم الملف</dt>
          <dd className="mt-0.5 font-tech font-semibold" dir="ltr">
            {fmtSize(result.fileSize)}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-faint">محتوى النسخة</dt>
          <dd className="mt-0.5 font-medium leading-relaxed">{countsSummary(result.counts)}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <Button asChild className="min-h-10 glow-accent-sm">
          <a href={result.fileUrl} download={result.fileName} aria-label="تحميل ملف النسخة الاحتياطية">
            <Download className="h-4 w-4" aria-hidden />
            تحميل النسخة
          </a>
        </Button>
        <Button asChild variant="outline" className="min-h-10">
          <a
            href={result.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="فتح النسخة الاحتياطية في تاب جديد"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            فتح في تاب جديد
          </a>
        </Button>
      </div>
    </div>
  );
}

/** Failure card — keeps the failed attempt honest in the UI. */
function BackupErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-danger/30 bg-danger/[0.04] p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-danger">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        تعذر إكمال النسخة الاحتياطية
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {message} — السجل محفوظ في سجل النسخ تحتك كمحاولة فاشلة، وتقدر تحاول تاني على طول.
      </p>
    </div>
  );
}

export default function BackupCenter() {
  /* ------------------------------ data state ----------------------------- */
  const [meta, setMeta] = useState<ResetMeta | null>(null);
  const [backups, setBackups] = useState<BackupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ------------------------------ flow state ----------------------------- */
  const [flow, setFlow] = useState<FlowState | null>(null);

  /* ------------------------------ reset state ---------------------------- */
  const [resetOpen, setResetOpen] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [copied, setCopied] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const [resetResult, setResetResult] = useState<{
    deleted: BackupCounts;
    preservedBackupId: string;
  } | null>(null);

  /* ------------------------------ delete state --------------------------- */
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [armedId, setArmedId] = useState<string | null>(null);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (armTimer.current) clearTimeout(armTimer.current);
    },
    [],
  );

  /* -------------------------------- loading ------------------------------ */

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [metaRes, listRes] = await Promise.all([
        fetch("/api/admin/reset", { headers: { "cache-control": "no-store" } }),
        fetch("/api/admin/backups", { headers: { "cache-control": "no-store" } }),
      ]);
      let failed = false;
      if (metaRes.ok) {
        setMeta((await metaRes.json()) as ResetMeta);
      } else {
        failed = true;
      }
      if (listRes.ok) {
        const data = (await listRes.json()) as { backups?: BackupRow[] };
        setBackups(Array.isArray(data.backups) ? data.backups : []);
      } else {
        failed = true;
      }
      setLoadError(failed ? "تعذر تحميل حالة البيانات من الخادم" : null);
    } catch {
      setLoadError("تعذر الوصول للخادم — راجع الاتصال");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const latestSuccessId = useMemo(
    () => backups.find((b) => b.status === "success")?.id ?? null,
    [backups],
  );

  const busy = flow !== null && ["collect", "render", "upload"].includes(flow.stage);
  const phraseMatch = phrase.trim().toUpperCase() === CONFIRM_PHRASE;
  const canReset = meta?.canReset === true;

  /* ------------------------------- backup flow --------------------------- */

  const runBackup = async () => {
    if (busy) return;
    setFlow({ stage: "collect" });
    let backupId: string | null = null;
    let failedAt = 0;
    try {
      /* 1 — atomic server snapshot */
      const createRes = await fetch("/api/admin/backups", {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      if (!createRes.ok) throw new Error(await readApiError(createRes));
      const data = (await createRes.json()) as CreateBackupResponse;
      backupId = data.backup.id;
      failedAt = 1;
      const fileName = `hypertech-backup-${data.backup.id}.pdf`;
      /* Storage extension: Cloudinary's account policy blocks direct .pdf
         delivery (401 ACL). The PDF bytes are stored under a delivery-allowed
         .dat extension and downloads are served through our admin-only
         proxy route with the proper application/pdf + .pdf filename. */
      const storageExt = ".dat";
      const storageId = `hypertech-backup-${data.backup.id}`;

      /* 2 — render the premium report from exactly this snapshot */
      setFlow((f) => ({ ...(f ?? { stage: "collect" }), stage: "render" }));
      const blob = await generateBackupPdf({
        backup: data.backup,
        snapshot: data.snapshot,
        serverTime: data.serverTime,
        onProgress: (done, total) =>
          setFlow((f) => (f && f.stage === "render" ? { ...f, pagesDone: done, totalPages: total } : f)),
      });
      failedAt = 2;

      /* 3 — signed direct upload with live progress */
      setFlow((f) => ({ ...(f ?? { stage: "collect" }), stage: "upload", uploadPct: 0 }));
      const signRes = await fetch("/api/admin/cloudinary/sign", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          folder: "hypertech/backups",
          resourceType: "raw",
          publicId: `${storageId}${storageExt}`,
        }),
      });
      if (!signRes.ok) throw new Error(await readApiError(signRes));
      const signed = (await signRes.json()) as SignedUpload;
      const secureUrl = await uploadRawPdf(signed, blob, `${storageId}${storageExt}`, (pct) =>
        setFlow((f) => (f && f.stage === "upload" ? { ...f, uploadPct: pct } : f)),
      );

      /* 4 — finalize the record */
      const patchRes = await fetch(`/api/admin/backups/${data.backup.id}`, {
        method: "PATCH",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          status: "success",
          fileUrl: secureUrl,
          fileName,
          fileSize: blob.size,
        }),
      });
      if (!patchRes.ok) throw new Error(await readApiError(patchRes));

      setFlow({
        stage: "done",
        result: {
          id: data.backup.id,
          fileName,
          fileSize: blob.size,
          fileUrl: `/api/admin/backups/${data.backup.id}/download`,
          counts: data.backup.counts,
        },
      });
      toast.success("النسخة الاحتياطية جاهزة واترفعت بنجاح");
      void refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "تعذر إنشاء النسخة الاحتياطية — حاول تاني";
      /* Keep the failure honest + visible in the log. */
      if (backupId) {
        await fetch(`/api/admin/backups/${backupId}`, {
          method: "PATCH",
          headers: JSON_HEADERS,
          body: JSON.stringify({ status: "failed" }),
        }).catch(() => undefined);
      }
      setFlow({ stage: "error", failedAt, error: message });
      toast.error(message);
      void refresh();
    }
  };

  /* ------------------------------- reset flow ---------------------------- */

  const copyPhrase = async () => {
    try {
      await navigator.clipboard.writeText(CONFIRM_PHRASE);
      setCopied(true);
      toast.success("تم نسخ عبارة التأكيد");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("تعذر النسخ — انسخها يدويًا من الشريحة");
    }
  };

  const confirmReset = async () => {
    if (resetPending || !phraseMatch) return;
    setResetPending(true);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ confirm: phrase.trim() }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const data = (await res.json()) as {
        ok: true;
        deleted: BackupCounts;
        preservedBackupId: string;
      };
      setResetResult({ deleted: data.deleted, preservedBackupId: data.preservedBackupId });
      setResetOpen(false);
      setPhrase("");
      /* Reflect the empty catalog across the whole client store. */
      useMockDB.getState().applyStoreReset();
      toast.success("تم مسح بيانات التشغيل بنجاح — النسخة الاحتياطية محفوظة");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تنفيذ المسح الآمن");
    } finally {
      setResetPending(false);
    }
  };

  /* ------------------------------ delete flow ---------------------------- */

  const deleteBackup = async (id: string) => {
    if (deletePendingId) return;
    setDeletePendingId(id);
    try {
      const res = await fetch(`/api/admin/backups/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readApiError(res));
      toast.success("تم حذف سجل النسخة الاحتياطية");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر حذف السجل");
    } finally {
      setDeletePendingId(null);
    }
  };

  const armDelete = (id: string) => {
    setArmedId(id);
    if (armTimer.current) clearTimeout(armTimer.current);
    armTimer.current = setTimeout(() => setArmedId(null), 3200);
  };

  const confirmArmedDelete = (id: string) => {
    if (armTimer.current) {
      clearTimeout(armTimer.current);
      armTimer.current = null;
    }
    setArmedId(null);
    void deleteBackup(id);
  };

  /* -------------------------------- render ------------------------------- */

  const flowIdx = (f: FlowState | null): number => {
    if (!f) return -1;
    if (f.stage === "error") return f.failedAt ?? 0;
    if (f.stage === "done") return 3;
    if (f.stage === "collect") return 0;
    if (f.stage === "render") return 1;
    return 2;
  };
  const activeIdx = flowIdx(flow);

  return (
    <div className="space-y-6">
      {/* ------------------------------ intro ------------------------------ */}
      <header>
        <h2 className="font-display text-2xl font-bold">مركز إدارة بيانات المتجر</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          النسخ الاحتياطي الكامل بتقرير PDF فاخر، سجل النسخ الموثّقة، والمسح الآمن لبيانات
          التشغيل — كل حاجة متقاسة ومحفوظة قبل أي خطوة.
        </p>
      </header>

      {loadError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/30 bg-danger/[0.04] p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            {loadError}
          </p>
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} aria-hidden />
            إعادة المحاولة
          </Button>
        </div>
      ) : null}

      {/* -------------------- Section 1 · live data summary ------------------ */}
      <section aria-labelledby="bc-summary" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHeading
            id="bc-summary"
            icon={Layers}
            title="ملخص البيانات الحالية"
            desc="أعداد السجلات الحقيقية في قاعدة بيانات المتجر لحظة فتح المركز."
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refresh()}
            disabled={refreshing || loading}
            className="min-h-9"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} aria-hidden />
            تحديث الأرقام
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {COUNT_CARDS.map((c) => (
              <div
                key={c.key}
                className="rounded-2xl border border-hair bg-elevated p-5 shadow-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="shimmer block h-3 w-16 rounded-full" />
                  <span className="shimmer block h-9 w-9 rounded-xl" />
                </div>
                <span className="shimmer mt-4 block h-8 w-14 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {COUNT_CARDS.map((c) => (
              <div
                key={c.key}
                className="rounded-2xl border border-hair bg-elevated p-5 shadow-card transition-colors hover:border-primary/25"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">{c.label}</span>
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-hair bg-raised",
                      c.tone,
                    )}
                  >
                    <c.icon className="h-4 w-4" aria-hidden />
                  </span>
                </div>
                <p className="mt-3 font-tech text-3xl font-bold leading-none" dir="ltr">
                  {fmtNum(meta?.counts[c.key] ?? 0)}
                </p>
                <p className="mt-2 text-[0.65rem] text-faint">{c.hint}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ------------------- Section 2 · create a backup -------------------- */}
      <section aria-labelledby="bc-create" className="space-y-4">
        <SectionHeading
          id="bc-create"
          icon={DatabaseBackup}
          title="إنشاء نسخة احتياطية كاملة"
          desc="تقرير PDF فاخر بالعربي بيتولّد من لقطة ذرّية واحدة من قاعدة البيانات، وبيترفع على التخزين السحابي."
        />

        <div className="overflow-hidden rounded-2xl border border-hair bg-surface/60 shadow-card">
          <div className="space-y-5 p-5 sm:p-6">
            {/* What the PDF contains */}
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {BACKUP_CONTENTS.map((c) => (
                <li
                  key={c.label}
                  className="flex items-center gap-2.5 rounded-xl border border-hair bg-elevated/70 px-3.5 py-2.5"
                >
                  <c.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="text-xs font-medium leading-relaxed">{c.label}</span>
                </li>
              ))}
            </ul>

            <AdminHint>
              الملف بيتخزن على Cloudinary وبيتوثّق على الخادم تلقائيًا — المسح الآمن مش بيتفعّل غير
              بعد نسخة ناجحة متاحة للتحميل. العملية ممكن تاخد كام ثانية حسب حجم البيانات، فسيب
              التاب مفتوح لحد ما المؤشر يقول «اكتمل».
            </AdminHint>

            {/* Multi-stage progress tracker */}
            {flow ? <FlowTracker flow={flow} activeIdx={activeIdx} /> : null}

            {/* Success card */}
            {flow?.stage === "done" && flow.result ? (
              <BackupSuccessCard result={flow.result} />
            ) : null}

            {/* Error card */}
            {flow?.stage === "error" ? (
              <BackupErrorCard message={flow.error ?? "حدث خطأ غير متوقع"} />
            ) : null}

            {/* Primary action */}
            <div className="-mx-5 -mb-5 flex flex-wrap items-center gap-3 border-t border-hair bg-elevated/30 px-5 py-4 sm:-mx-6 sm:-mb-6 sm:px-6">
              <Button
                size="lg"
                onClick={() => void runBackup()}
                disabled={busy}
                className="min-h-11 bg-primary text-primary-foreground glow-accent-sm"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <DatabaseBackup className="h-4 w-4" aria-hidden />
                )}
                {busy
                  ? "جاري إنشاء النسخة…"
                  : flow?.stage === "done"
                    ? "إنشاء نسخة احتياطية جديدة"
                    : "إنشاء نسخة احتياطية PDF"}
              </Button>
              <p className="text-xs text-faint">
                {busy ? "سيب التاب مفتوح لحد ما تكتمل المراحل" : "لقطة كاملة · PDF فاخر · رفع موثّق"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- Section 3 · backups log ------------------------ */}
      <section aria-labelledby="bc-log" className="space-y-4">
        <SectionHeading
          id="bc-log"
          icon={History}
          title="سجل النسخ الاحتياطية"
          desc="آخر 50 نسخة — الناجحة منها متاحة للتحميل، وآخر نسخة ناجحة محمية من الحذف."
        />

        <div className="overflow-hidden rounded-2xl border border-hair bg-surface/60">
          <div className="flex items-center justify-between gap-3 border-b border-hair bg-elevated/40 px-5 py-3.5">
            <p className="text-xs font-semibold text-muted-foreground">
              {backups.length > 0 ? `${fmtNum(backups.length)} سجل في السجل` : "السجل فاضي"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
              disabled={refreshing}
              className="min-h-9"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} aria-hidden />
              تحديث
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto p-3">
            {loading ? (
              <div className="space-y-2.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-hair bg-elevated/60 p-4"
                  >
                    <span className="shimmer block h-6 w-16 rounded-full" />
                    <span className="shimmer block h-4 flex-1 rounded-full" />
                    <span className="shimmer block h-9 w-9 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : backups.length === 0 ? (
              <EmptyState
                icon={DatabaseBackup}
                title="لا توجد نسخ احتياطية بعد"
                hint="أنشئ أول نسخة من قسم «إنشاء نسخة احتياطية كاملة» اللي فوق."
              />
            ) : (
              <ul className="space-y-2.5">
                {backups.map((b) => (
                  <li
                    key={b.id}
                    className={cn(
                      "rounded-xl border border-hair bg-elevated/70 p-4 transition-opacity",
                      deletePendingId === b.id && "opacity-60",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <BackupStatusBadge status={b.status} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold leading-tight">
                          {fmtDateFull(b.createdAt)}
                        </p>
                        <p className="mt-0.5 text-[0.7rem] text-faint">
                          {fmtTime(b.createdAt)} · بواسطة {b.actor || "—"}
                        </p>
                      </div>
                      <div className="ms-auto flex flex-wrap items-center gap-2">
                        {b.fileSize ? (
                          <span
                            className="rounded-md bg-raised px-2 py-1 font-tech text-[0.68rem] font-bold"
                            dir="ltr"
                          >
                            {fmtSize(b.fileSize)}
                          </span>
                        ) : null}
                        {b.status === "success" && b.fileUrl ? (
                          <>
                            <a
                              href={`/api/admin/backups/${b.id}/download`}
                              download={b.fileName ?? undefined}
                              title="تحميل النسخة"
                              aria-label={`تحميل نسخة ${fmtDateFull(b.createdAt)}`}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-hair bg-elevated text-primary transition-colors hover:border-primary/30 hover:bg-primary/5"
                            >
                              <Download className="h-4 w-4" aria-hidden />
                            </a>
                            <a
                              href={`/api/admin/backups/${b.id}/download`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="فتح في تاب جديد"
                              aria-label="فتح النسخة في تاب جديد"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-hair bg-elevated text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                            >
                              <ExternalLink className="h-4 w-4" aria-hidden />
                            </a>
                          </>
                        ) : null}
                        {b.id === latestSuccessId ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                tabIndex={0}
                                role="button"
                                aria-label="آخر نسخة ناجحة — لا يمكن حذفها"
                                className="flex h-9 w-9 cursor-help items-center justify-center rounded-lg border border-hair bg-raised text-faint"
                              >
                                <Lock className="h-4 w-4" aria-hidden />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              آخر نسخة ناجحة — لا يمكن حذفها
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              armedId === b.id ? confirmArmedDelete(b.id) : armDelete(b.id)
                            }
                            disabled={deletePendingId === b.id}
                            title={armedId === b.id ? "اضغط مرة تانية للتأكيد" : "حذف السجل"}
                            aria-label={
                              armedId === b.id ? "تأكيد حذف السجل" : "حذف السجل"
                            }
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                              armedId === b.id
                                ? "border-danger/40 bg-danger/10 text-danger"
                                : "border-hair bg-elevated text-muted-foreground hover:border-danger/30 hover:text-danger",
                            )}
                          >
                            {deletePendingId === b.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                              <Trash2 className="h-4 w-4" aria-hidden />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <CountChip n={b.counts.products} label="منتج" />
                      <CountChip n={b.counts.categories} label="فئة" />
                      <CountChip n={b.counts.builds} label="تجميعة" />
                      <CountChip n={b.counts.orders} label="طلب" />
                      <CountChip n={b.counts.maintenance} label="صيانة" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* -------------------- Section 4 · safe reset ------------------------- */}
      <section aria-labelledby="bc-reset" className="space-y-4">
        <SectionHeading
          id="bc-reset"
          icon={ShieldAlert}
          title="المسح الآمن لتشغيل المتجر"
          desc="لبدء تشغيل نظيف — بيمسح بيانات التشغيل بس بعد ما تتأكد إن في نسخة احتياطية موثّقة ومتاحة."
        />

        <div className="relative overflow-hidden rounded-2xl border border-danger/30 bg-danger/[0.03] p-5 sm:p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-danger/[0.05]"
          />
          <div className="relative space-y-5">
            {resetResult ? (
              <div className="rounded-2xl border border-mint/30 bg-mint/[0.05] p-5">
                <p className="flex items-center gap-2 font-bold text-mint">
                  <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
                  تم تنفيذ المسح الآمن بنجاح
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <CountChip n={resetResult.deleted.products} label="منتج اتمسح" />
                  <CountChip n={resetResult.deleted.categories} label="فئة اتمسحت" />
                  <CountChip n={resetResult.deleted.builds} label="تجميعة اتمسحت" />
                  <CountChip n={resetResult.deleted.orders} label="طلب اتمسح" />
                  <CountChip n={resetResult.deleted.maintenance} label="طلب صيانة اتمسح" />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  النسخة الموثّقة المحفوظة:{" "}
                  <span className="font-tech font-bold" dir="ltr">
                    {resetResult.preservedBackupId}
                  </span>
                </p>
                <p className="mt-1.5 text-[0.7rem] leading-relaxed text-faint">
                  حسابك كمدير وسجل النسخ الاحتياطية وسجل العمليات وإعدادات المتجر محفوظة زي ما هي —
                  والكتالوج دلوقتي فاضي وجاهز لبداية جديدة.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 min-h-9"
                  onClick={() => setResetResult(null)}
                >
                  عرض تفاصيل المسح الآمن تاني
                </Button>
              </div>
            ) : (
              <>
                {/* what is deleted vs preserved */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-danger/20 bg-elevated/70 p-4">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-danger">
                      <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                      هيتم مسحها نهائيًا
                    </h4>
                    <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                      <li>كل المنتجات والمواصفات والأسعار</li>
                      <li>كل الفئات وترتيبها</li>
                      <li>تجميعات PC ومكوناتها</li>
                      <li>كل الطلبات بتفاصيلها</li>
                      <li>كل طلبات الصيانة</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-mint/25 bg-elevated/70 p-4">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-mint">
                      <Lock className="h-4 w-4 shrink-0" aria-hidden />
                      محفوظة ومش هتتلمس
                    </h4>
                    <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                      <li>حساب المدير وجلستك الحالية</li>
                      <li>سجل النسخ الاحتياطية كامل</li>
                      <li>سجل العمليات (Audit Log)</li>
                      <li>إعدادات المتجر والهوية</li>
                    </ul>
                  </div>
                </div>

                {/* gating status */}
                <div
                  className={cn(
                    "flex flex-wrap items-center gap-2.5 rounded-xl border p-3.5 text-xs font-medium leading-relaxed",
                    canReset
                      ? "border-mint/30 bg-mint/[0.05] text-mint"
                      : "border-amber/30 bg-amber/[0.05] text-amber/90",
                  )}
                >
                  {canReset ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                      في نسخة احتياطية ناجحة موثّقة ومتاحة للتحميل — المسح متاح دلوقتي.
                      {meta?.backupId ? (
                        <span
                          className="rounded-md bg-mint/10 px-2 py-0.5 font-tech text-[0.68rem] font-bold"
                          dir="ltr"
                        >
                          {meta.backupId.slice(0, 14)}…
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 shrink-0" aria-hidden />
                      {loading
                        ? "جاري التحقق من حالة النسخ الاحتياطية…"
                        : (meta?.reason ?? "لازم تنشئ نسخة احتياطية ناجحة الأول قبل أي مسح")}
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="destructive"
                    size="lg"
                    disabled={!canReset || loading}
                    onClick={() => setResetOpen(true)}
                    className="min-h-11"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    بدء المسح الآمن
                  </Button>
                  {!canReset && !loading ? (
                    <p className="text-xs text-danger">
                      غير متاح حاليًا: {meta?.reason ?? "لا توجد نسخة موثّقة"}
                    </p>
                  ) : (
                    <p className="text-xs text-faint">
                      الخطوة دي نهائية — وبتطلب كتابة عبارة التأكيد بنفسك.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------- reset AlertDialog ------------------------- */}
      <AlertDialog
        open={resetOpen}
        onOpenChange={(o) => {
          if (resetPending && !o) return;
          setResetOpen(o);
          if (!o) setPhrase("");
        }}
      >
        <AlertDialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <AlertDialogHeader className="text-right sm:text-right">
            <AlertDialogTitle className="flex items-center gap-2 font-display text-lg">
              <ShieldAlert className="h-5 w-5 shrink-0 text-danger" aria-hidden />
              تأكيد المسح الآمن لبيانات التشغيل
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-relaxed">
              العملية دي نهائية ومش بترجع تاني. الخادم هيعيد التحقق من آخر نسخة احتياطية ناجحة
              (ورابطها لسه متاح) قبل ما يمسح أي حاجة.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-3 space-y-4">
            <div className="rounded-xl border border-danger/25 bg-danger/[0.04] p-3.5 text-xs leading-relaxed">
              <p className="font-bold text-danger">هيتم مسحها نهائيًا:</p>
              <p className="mt-1 text-muted-foreground">
                المنتجات والفئات والتجميعات والطلبات وطلبات الصيانة
                {meta ? ` (${countsSummary(meta.counts)})` : ""}.
              </p>
              <p className="mt-2.5 font-bold text-mint">
                محفوظة: حساب المدير، سجل النسخ، سجل العمليات، وإعدادات المتجر.
              </p>
            </div>

            <div>
              <Label className="text-xs">عبارة التأكيد (انسخها واكتبها بالظبط):</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <code
                  dir="ltr"
                  className="flex-1 select-all rounded-lg border border-hair bg-raised px-3 py-2.5 font-tech text-sm font-bold tracking-wide"
                >
                  RESET-STORE
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => void copyPhrase()}
                  aria-label="نسخ عبارة التأكيد"
                  className="h-10 w-10 shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-mint" aria-hidden />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="reset-phrase" className="text-xs">
                اكتب عبارة التأكيد هنا:
              </Label>
              <Input
                id="reset-phrase"
                dir="ltr"
                className="mt-1.5 font-tech"
                placeholder="RESET-STORE"
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                disabled={resetPending}
              />
              <p
                className={cn(
                  "mt-1.5 text-[0.68rem] font-medium",
                  phraseMatch ? "text-mint" : "text-faint",
                )}
              >
                {phraseMatch
                  ? "العبارة مطابقة — تقدر تأكد المسح دلوقتي"
                  : "زر التأكيد هيتفعّل لما تكتب العبارة صح"}
              </p>
            </div>
          </div>

          <AlertDialogFooter className="mt-5">
            <AlertDialogCancel disabled={resetPending}>إلغاء</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={!phraseMatch || resetPending}
              onClick={() => void confirmReset()}
              className="min-h-10"
            >
              {resetPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden />
              )}
              {resetPending ? "جاري تنفيذ المسح…" : "امسح بيانات التشغيل نهائيًا"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
