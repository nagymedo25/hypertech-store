"use client";

/**
 * ============================================================
 * HYPER TECH — Admin Image Upload (Cloudinary signed direct)
 * ============================================================
 * Premium image field for the admin suite:
 *  • Method A — drag & drop (or click) → signed DIRECT upload
 *    to Cloudinary (signature from /api/admin/cloudinary/sign)
 *    with real XHR `upload.onprogress` events (0–100%) per file.
 *  • Method B — paste a URL; the DB stores whatever the admin
 *    pastes (same contract as the old one-per-line textarea).
 *  • Gallery management: primary image, set-as-primary, remove.
 *
 * Contract: `onChange` only ever contains CONFIRMED urls — an
 * in-flight or failed upload never leaks into the saved form.
 * ============================================================
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  Image as ImageIcon,
  Link2,
  Loader2,
  RefreshCw,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* ------------------------------- Constants -------------------------------- */

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ACCEPT_ATTR = ACCEPTED_TYPES.join(",");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const FLASH_MS = 1600;

/* --------------------------------- Types ---------------------------------- */

interface SignResponse {
  params: Record<string, string | number>;
  signature: string;
  api_key: string;
  upload_url: string;
  cloud_name: string;
}

/** A local (not-yet-confirmed) upload — in-flight or failed. */
interface UploadCard {
  id: string;
  file: File;
  name: string;
  preview: string;
  progress: number;
  status: "uploading" | "error";
  error?: string;
}

export interface ImageUploadProps {
  /** Confirmed image urls only (never in-flight/failed files). */
  value: string[];
  onChange: (urls: string[]) => void;
  /** Cloudinary folder — must be whitelisted by the sign route. */
  folder: string;
  label?: string;
  /** Max confirmed images. `1` = single (replace) mode. Default 8. */
  max?: number;
  /** Preview shape: gallery = 4:3 thumb grid, cover = single 16:10 hero. */
  aspect?: "cover" | "gallery";
}

const rowId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/* ------------------------------ Upload helpers ---------------------------- */

async function fetchSignature(folder: string): Promise<SignResponse> {
  const res = await fetch("/api/admin/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder, resourceType: "image" }),
  });
  if (!res.ok) {
    throw new Error(res.status === 401 ? "انتهت الجلسة — سجّل الدخول تاني" : "فشل تجهيز الرفع");
  }
  return (await res.json()) as SignResponse;
}

/**
 * XHR (not fetch) so we get REAL `upload.onprogress` events.
 * The blob is re-wrapped in a File so the multipart part carries
 * a proper filename — Cloudinary rejects filename-less blobs.
 */
function uploadToCloudinary(
  file: File,
  signed: SignResponse,
  onProgress: (pct: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", signed.upload_url);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        // Cap at 99% — 100% is only honest once the response is parsed.
        onProgress(Math.min(99, Math.round((ev.loaded / ev.total) * 100)));
      }
    };
    xhr.onload = () => {
      let secureUrl: string | undefined;
      let message = `فشل الرفع (${xhr.status})`;
      try {
        const body = JSON.parse(xhr.responseText) as {
          secure_url?: string;
          error?: { message?: string };
        };
        secureUrl = body.secure_url;
        if (body.error?.message) message = body.error.message;
      } catch {
        // keep the default message
      }
      if (xhr.status >= 200 && xhr.status < 300 && secureUrl) resolve(secureUrl);
      else reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error("تعذر الوصول لخدمة الرفع — راجع النت"));
    xhr.onabort = () => reject(new Error("اتلغى الرفع"));

    const form = new FormData();
    form.append("file", new File([file], file.name || "image", { type: file.type || "image/png" }));
    form.append("api_key", signed.api_key);
    for (const [key, val] of Object.entries(signed.params)) form.append(key, String(val));
    form.append("signature", signed.signature);
    xhr.send(form);
  });
}

/* ------------------------------ Tiny sub-views ---------------------------- */

/** Mint check flash overlaid on a freshly confirmed thumbnail. */
function MintFlash() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-mint/25 animate-in fade-in zoom-in-95 duration-200"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint text-white shadow-card">
        <Check className="h-5 w-5" strokeWidth={3} aria-hidden />
      </span>
    </span>
  );
}

/** Slim progress row (used in single/cover mode). */
function ProgressRow({ card }: { card: UploadCard }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/[0.04] p-3">
      <img
        src={card.preview}
        alt=""
        className="h-11 w-11 shrink-0 rounded-lg border border-hair object-cover"
      />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 text-xs font-bold">
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" aria-hidden />
            <span className="truncate">جاري الرفع…</span>
          </span>
          <span className="font-tech text-xs font-bold text-primary" dir="ltr">
            {card.progress}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={card.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`تقدم رفع ${card.name}`}
          className="h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${card.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Component ------------------------------- */

export function ImageUpload({
  value,
  onChange,
  folder,
  label,
  max = 8,
  aspect = "gallery",
}: ImageUploadProps) {
  const single = max <= 1;

  const [uploads, setUploads] = useState<UploadCard[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [flashing, setFlashing] = useState<ReadonlySet<string>>(new Set());

  const inputRef = useRef<HTMLInputElement>(null);

  /** Authoritative mirror of `value` — concurrent completions never clobber. */
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const uploadsRef = useRef(uploads);
  useEffect(() => {
    uploadsRef.current = uploads;
  }, [uploads]);

  /** Liveness guard + preview cleanup on unmount. */
  const aliveRef = useRef(true);
  useEffect(
    () => () => {
      aliveRef.current = false;
      for (const card of uploadsRef.current) URL.revokeObjectURL(card.preview);
    },
    [],
  );

  const emit = useCallback(
    (next: string[]) => {
      valueRef.current = next;
      onChange(next);
    },
    [onChange],
  );

  /** Mint check flash on freshly confirmed images. */
  const flash = useCallback((url: string) => {
    setFlashing((prev) => new Set(prev).add(url));
    window.setTimeout(() => {
      setFlashing((prev) => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
    }, FLASH_MS);
  }, []);

  /* ------------------------------ Upload flow ----------------------------- */

  const startUpload = useCallback(
    async (card: UploadCard) => {
      try {
        const signed = await fetchSignature(folder);
        const url = await uploadToCloudinary(card.file, signed, (pct) => {
          setUploads((us) => us.map((u) => (u.id === card.id ? { ...u, progress: pct } : u)));
        });
        URL.revokeObjectURL(card.preview);
        setUploads((us) => us.filter((u) => u.id !== card.id));

        if (!aliveRef.current) {
          // The form was closed mid-upload — surface the asset, never fake it.
          toast("اترفعت الصورة بس الفورم اتقفل", { description: url });
          return;
        }
        flash(url);
        emit(single ? [url] : [...valueRef.current, url]);
        toast.success("اترفعت الصورة بنجاح");
      } catch (err) {
        const message = err instanceof Error ? err.message : "فشل الرفع";
        setUploads((us) =>
          us.map((u) => (u.id === card.id ? { ...u, status: "error", error: message } : u)),
        );
        toast.error(`فشل رفع «${card.name}»`);
      }
    },
    [folder, single, flash, emit],
  );

  const addCard = useCallback(
    (file: File) => {
      const card: UploadCard = {
        id: rowId(),
        file,
        name: file.name,
        preview: URL.createObjectURL(file),
        progress: 1,
        status: "uploading",
      };
      setUploads((us) => [...us, card]);
      void startUpload(card);
    },
    [startUpload],
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const active = uploadsRef.current.filter((u) => u.status === "uploading").length;

      if (single) {
        if (active > 0) {
          toast.error("في رفع شغال بالفعل — استنى يخلص الأول");
          return;
        }
        const file = files[0];
        if (!ACCEPTED_TYPES.includes(file.type)) {
          toast.error(`«${file.name}» صيغة مش مدعومة — PNG أو JPG أو WEBP بس`);
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`«${file.name}» أكبر من ٥ ميجا — صغّرها وشوف تاني`);
          return;
        }
        if (files.length > 1) toast("بنستخدم أول صورة بس — الغلاف صورة واحدة");
        addCard(file);
        return;
      }

      let slots = max - valueRef.current.length - active;
      for (const file of files) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          toast.error(`«${file.name}» صيغة مش مدعومة — PNG أو JPG أو WEBP بس`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`«${file.name}» أكبر من ٥ ميجا — صغّرها وشوف تاني`);
          continue;
        }
        if (slots <= 0) {
          toast.error(`الحد الأقصى ${max} صور — امسح واحدة الأول`);
          break;
        }
        slots -= 1;
        addCard(file);
      }
    },
    [single, max, addCard],
  );

  /* ------------------------------- URL paste ------------------------------ */

  const addUrl = (raw: string) => {
    const url = raw.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      toast.error("الرابط لازم يبدأ بـ http:// أو https://");
      return;
    }
    if (single) {
      if (uploads.some((u) => u.status === "uploading")) {
        toast.error("استنى الرفع الشغال يخلص الأول");
        return;
      }
      emit([url]);
      flash(url);
      setUrlInput("");
      return;
    }
    if (valueRef.current.includes(url)) {
      toast.error("الصورة دي مضافة بالفعل");
      return;
    }
    if (valueRef.current.length + uploads.filter((u) => u.status === "uploading").length >= max) {
      toast.error(`الحد الأقصى ${max} صور — امسح واحدة الأول`);
      return;
    }
    emit([...valueRef.current, url]);
    flash(url);
    setUrlInput("");
  };

  /* ---------------------------- Gallery actions --------------------------- */

  const removeImage = (index: number) =>
    emit(single ? [] : valueRef.current.filter((_, i) => i !== index));

  const makePrimary = (index: number) => {
    if (index === 0) return;
    emit([valueRef.current[index], ...valueRef.current.filter((_, i) => i !== index)]);
  };

  const retryCard = (id: string) => {
    setUploads((us) =>
      us.map((u) =>
        u.id === id ? { ...u, status: "uploading", progress: 1, error: undefined } : u,
      ),
    );
    const card = uploadsRef.current.find((u) => u.id === id);
    if (card) void startUpload(card);
  };

  const dismissCard = (id: string) => {
    const card = uploadsRef.current.find((u) => u.id === id);
    if (card) URL.revokeObjectURL(card.preview);
    setUploads((us) => us.filter((u) => u.id !== id));
  };

  /* -------------------------------- Render -------------------------------- */

  const openPicker = () => inputRef.current?.click();

  const uploading = uploads.filter((u) => u.status === "uploading");
  const failed = uploads.filter((u) => u.status === "error");
  const empty = value.length === 0 && uploads.length === 0;
  const full = !single && value.length + uploading.length >= max;

  const dropHandlers = {
    onDragOver: (e: DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setDragActive(true);
    },
    onDragLeave: (e: DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragActive(false);
    },
    onDrop: (e: DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setDragActive(false);
      handleFiles([...e.dataTransfer.files]);
    },
  };

  const dropClasses = cn(
    "flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-hair bg-elevated/70 px-4 text-center transition-all duration-200 outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20",
    dragActive && "border-primary/50 bg-primary/[0.05]",
  );

  return (
    <div className="space-y-3">
      {/* Header row */}
      {label || !single ? (
        <div className="flex items-center justify-between gap-2">
          {label ? <Label>{label}</Label> : <span />}
          {!single ? (
            <span className="font-tech text-[0.68rem] text-faint" dir="ltr">
              {value.length} / {max}
            </span>
          ) : null}
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple={!single}
        tabIndex={-1}
        aria-hidden
        className="hidden"
        onChange={(e) => {
          handleFiles([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />

      {single ? (
        <>
          {/* Current cover (replace / remove on hover) */}
          {value[0] ? (
            <figure className="group relative aspect-[16/10] overflow-hidden rounded-xl border border-hair bg-[#0d0f13]">
              <img
                src={value[0]}
                alt={aspect === "cover" ? "معاينة الغلاف" : "الصورة الأساسية"}
                loading="lazy"
                className="img-grade h-full w-full object-cover"
              />
              {flashing.has(value[0]) ? <MintFlash /> : null}
              <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-[#24221d]/45 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                <button
                  type="button"
                  onClick={openPicker}
                  className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-white/95 px-4 text-xs font-bold text-[#24221d] shadow-card transition-colors hover:bg-white"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  استبدال
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(0)}
                  aria-label="حذف الصورة"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-danger/90 text-white shadow-card transition-colors hover:bg-danger"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </figure>
          ) : null}

          {/* In-flight upload */}
          {uploading[0] ? <ProgressRow card={uploading[0]} /> : null}

          {/* Drop zone — full-size when empty, slim "replace" bar otherwise */}
          {empty ? (
            <button
              type="button"
              onClick={openPicker}
              {...dropHandlers}
              aria-label="اسحب صورة الغلاف وأفلتها هنا أو اضغط لاختيارها من جهازك"
              className={cn(dropClasses, "gap-2 py-10")}
            >
              <ImageIcon className="h-10 w-10 text-faint" aria-hidden />
              <span className="text-sm font-bold">اسحب صورة الغلاف هنا</span>
              <span className="text-xs text-muted-foreground">
                أو اضغط واختارها من جهازك — PNG / JPG / WEBP حتى ٥ ميجا
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={openPicker}
              {...dropHandlers}
              aria-label="استبدال الصورة — اسحب وأفلت أو اضغط للاختيار من جهازك"
              className={cn(dropClasses, "py-3.5")}
            >
              <span className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                <UploadCloud className="h-4 w-4 text-primary" aria-hidden />
                اسحب صورة هنا للاستبدال أو اضغط للاختيار من جهازك
              </span>
            </button>
          )}
        </>
      ) : (
        /* ------------------------- Gallery drop zone ------------------------- */
        <button
          type="button"
          onClick={openPicker}
          {...dropHandlers}
          aria-label="اسحب الصور وأفلتها هنا أو اضغط لاختيارها من جهازك"
          className={cn(dropClasses, empty ? "gap-1.5 py-8" : "py-3.5", full && "opacity-60")}
        >
          {empty ? (
            <>
              <ImageIcon className="h-8 w-8 text-faint" aria-hidden />
              <span className="text-sm font-bold">مفيش صور</span>
              <span className="text-xs text-muted-foreground">اسحب صورة هنا أو الصق رابط</span>
              <span className="mt-1 text-[0.65rem] text-faint" dir="ltr">
                PNG · JPG · WEBP — ≤ 5MB
              </span>
            </>
          ) : full ? (
            <span className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              <UploadCloud className="h-4 w-4 text-faint" aria-hidden />
              وصلت للحد الأقصى —{" "}
              <span className="font-tech" dir="ltr">
                {value.length}/{max}
              </span>{" "}
              (امسح صورة لإضافة غيرها)
            </span>
          ) : (
            <span className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              <UploadCloud className="h-4 w-4 text-primary" aria-hidden />
              اسحب صور تانية هنا أو اضغط واختارها من جهازك
            </span>
          )}
        </button>
      )}

      {/* URL paste row */}
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addUrl(urlInput);
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Link2
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
            aria-hidden
          />
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            dir="ltr"
            placeholder="https://res.cloudinary.com/…"
            className="min-h-11 pr-9 font-tech text-xs"
            aria-label="إضافة صورة برابط مباشر"
          />
        </div>
        <Button type="submit" variant="outline" className="min-h-11 shrink-0 px-4">
          إضافة
        </Button>
      </form>

      {/* Gallery grid — confirmed thumbs + in-flight tiles */}
      {!single && (value.length > 0 || uploading.length > 0) ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url, i) => (
            <figure
              key={`${url}-${i}`}
              className="group relative h-20 overflow-hidden rounded-xl border border-hair bg-[#0d0f13]"
            >
              <img
                src={url}
                alt={i === 0 ? "الصورة الرئيسية" : `صورة رقم ${i + 1}`}
                loading="lazy"
                className="img-grade h-full w-full object-cover"
              />
              {i === 0 && value.length > 1 ? (
                <figcaption className="absolute right-1.5 top-1.5 z-[5] rounded-full bg-[#24221d]/55 px-2 py-0.5 text-[0.6rem] font-bold text-white backdrop-blur">
                  رئيسية
                </figcaption>
              ) : null}
              {flashing.has(url) ? <MintFlash /> : null}
              <div className="absolute inset-x-0 bottom-0 z-[5] flex items-center justify-center gap-1 bg-gradient-to-t from-[#24221d]/85 to-transparent px-1 pb-1 pt-5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                {i > 0 ? (
                  <button
                    type="button"
                    onClick={() => makePrimary(i)}
                    aria-label="تعيين الصورة كصورة رئيسية"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-[#24221d] shadow-sm transition-colors hover:bg-white"
                  >
                    <Star className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  aria-label="حذف الصورة"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-danger shadow-sm transition-colors hover:bg-white"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </figure>
          ))}

          {uploading.map((card) => (
            <div
              key={card.id}
              className="relative h-20 overflow-hidden rounded-xl border border-primary/40 bg-[#0d0f13]"
            >
              <img src={card.preview} alt="" className="h-full w-full object-cover opacity-40" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[#24221d]/55 px-2">
                <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden />
                <span className="text-[0.6rem] font-bold text-white">جاري الرفع…</span>
                <div
                  role="progressbar"
                  aria-valuenow={card.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`تقدم رفع ${card.name}`}
                  className="h-1 w-full overflow-hidden rounded-full bg-white/25"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300"
                    style={{ width: `${card.progress}%` }}
                  />
                </div>
                <span className="font-tech text-[0.62rem] font-bold text-white" dir="ltr">
                  {card.progress}%
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Failed uploads — danger rows with retry */}
      {failed.map((card) => (
        <div
          key={card.id}
          className="flex items-center gap-2.5 rounded-xl border border-danger/35 bg-danger/[0.04] px-3 py-2"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-danger" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-danger">{card.name}</p>
            <p className="truncate text-[0.65rem] text-danger/75">{card.error ?? "فشل الرفع"}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => retryCard(card.id)}
            className="h-9 shrink-0 border-danger/30 text-danger hover:bg-danger/10 hover:text-danger"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            إعادة المحاولة
          </Button>
          <button
            type="button"
            onClick={() => dismissCard(card.id)}
            aria-label="تجاهل الصورة الفاشلة"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
