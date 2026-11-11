"use client";

/**
 * ============================================================
 * HYPER TECH — Admin Login · "Vault Entrance" (REAL auth)
 * ============================================================
 * Two-panel luxury composition:
 *  • Right (RTL, 55%) — ivory form panel with the elevated
 *    credential card: orbital emblem, generous inputs,
 *    security strip, storefront return.
 *  • Left (lg+, 45%) — warm-charcoal editorial surface with
 *    the drafting grid, ghost wordmark, counter-precessing
 *    orbital system and the real capability trust lines,
 *    meeting the form panel along a subtle angled seam.
 *
 * Credentials are verified against the production database
 * (scrypt hashes). The server issues an HMAC-signed HTTP-only
 * session cookie; rate-limited per IP + username. This file is
 * pure presentation — the functional contract is unchanged.
 *
 * GSAP scenes (all gated behind prefersReducedMotion):
 *  • entrance — card rise/fade, ring self-draw, monogram
 *    spring, 60ms field stagger, trust-line drift, ghost glide
 *  • error    — inline message slide-down
 *  • shake    — ±6px card jolt (~0.35s) on failed submit
 * ============================================================
 */

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { gsap } from "gsap";
import {
  DatabaseBackup,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Loader2,
  Lock,
  Package,
  ShieldCheck,
  Store,
  Timer,
  TriangleAlert,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useRouterStore } from "@/lib/router";
import { useUIStore } from "@/lib/store/ui-store";
import { EASE, prefersReducedMotion } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ---------------- Real capability trust lines (left panel) ---------------- */

const TRUST: { icon: LucideIcon; tone: string; text: string }[] = [
  { icon: Package, tone: "text-[#5b8fc7]", text: "إدارة الكتالوج والطلبات في الوقت الحقيقي" },
  { icon: DatabaseBackup, tone: "text-[#57b28a]", text: "نسخ احتياطي PDF آمن للبيانات" },
  { icon: Wrench, tone: "text-[#5b8fc7]", text: "متابعة طلبات الصيانة والعملاء" },
];

export default function AdminLogin({ onAuthed }: { onAuthed?: () => void }) {
  const navigate = useRouterStore((s) => s.navigate);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  /* ------------------- Entrance scene (instant if reduced) ------------------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: EASE.out } });

      tl
        // Vault card rises out of the ivory
        .fromTo(
          "[data-login='card']",
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.75, ease: EASE.expo },
          0
        )
        // Orbital ring draws itself
        .fromTo(
          "[data-login='ring']",
          { strokeDasharray: 160, strokeDashoffset: 160 },
          { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" },
          0.22
        )
        // Counter hairline ellipse fades in behind
        .fromTo("[data-login='ring2']", { opacity: 0 }, { opacity: 1, duration: 0.55 }, 0.62)
        // Monogram springs into orbit
        .fromTo(
          "[data-login='mark']",
          { opacity: 0, scale: 0.5 },
          { opacity: 1, scale: 1, duration: 0.6, ease: EASE.spring },
          0.52
        )
        // Heading block settles
        .fromTo("[data-login='head']", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55 }, 0.66)
        // Fields / security strip / return link stagger in (60ms rhythm)
        .fromTo(
          "[data-login='field']",
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.06 },
          0.78
        )
        // Atmospheric panel: ghost wordmark glides, trust lines slide in from the seam
        .fromTo(
          "[data-login='ghost']",
          { x: 34, opacity: 0 },
          { x: 0, opacity: 1, duration: 1.3, ease: "power2.out" },
          0.35
        )
        .fromTo(
          "[data-login='trust']",
          { x: -26, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.65, stagger: 0.09 },
          0.45
        );
    }, root);

    return () => ctx.revert();
  }, []);

  /* ------------------- Error message slide ------------------- */
  useEffect(() => {
    if (!error) return;
    const el = errorRef.current;
    if (!el || prefersReducedMotion()) return;
    gsap.fromTo(el, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.35, ease: EASE.out });
  }, [error]);

  /* ------------------- ±6px vault jolt on failed submit ------------------- */
  const shakeCard = () => {
    if (prefersReducedMotion() || !cardRef.current) return;
    gsap
      .timeline()
      .to(cardRef.current, { x: 6, duration: 0.06, ease: "power1.inOut" })
      .to(cardRef.current, { x: -6, duration: 0.06, ease: "power1.inOut" })
      .to(cardRef.current, { x: 4, duration: 0.06, ease: "power1.inOut" })
      .to(cardRef.current, { x: -4, duration: 0.06, ease: "power1.inOut" })
      .to(cardRef.current, { x: 2, duration: 0.06, ease: "power1.inOut" })
      .to(cardRef.current, { x: 0, duration: 0.05, ease: "power1.inOut" });
  };

  /* ------------------- Submit (functional contract — unchanged) ------------------- */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;

    if (!username.trim() || !password) {
      setError("ادخل اسم المستخدم وكلمة المرور");
      shakeCard();
      return;
    }

    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        retryAfter?: number;
      };
      if (!res.ok) {
        setError(data.error ?? "بيانات الدخول غير صحيحة");
        setAttempts((a) => a + 1);
        shakeCard();
        return;
      }
      useUIStore.getState().setAdminAuthed(true);
      setAttempts(0);
      toast.success("تم تسجيل الدخول — مرحبًا بك في لوحة التحكم");
      onAuthed?.();
    } catch {
      setError("تعذر الاتصال بالخادم — تأكد من الإنترنت وحاول تاني");
      shakeCard();
    } finally {
      setPending(false);
    }
  };

  /* ------------------------------ Composition ------------------------------ */

  return (
    <div ref={rootRef} className="relative flex min-h-screen flex-col bg-background lg:flex-row">
      {/* ============ Right panel (RTL primary, 55%) — credential form ============ */}
      <section
        aria-label="تسجيل دخول لوحة التحكم"
        className="relative flex flex-1 flex-col items-center justify-center px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-10 sm:px-6 lg:w-[55%] lg:px-10 xl:px-16"
      >
        {/* Ivory atmosphere — drafting grid + cobalt orb */}
        <div aria-hidden className="absolute inset-0 bg-grid opacity-40" />
        <div
          aria-hidden
          className="absolute -top-[14vh] left-1/2 h-[52vh] w-[44rem] max-w-full -translate-x-1/2 orb-glow opacity-70"
        />

        <div className="relative z-10 w-full max-w-md lg:max-w-lg">
          {/* -------- Vault card -------- */}
          <div
            ref={cardRef}
            data-login="card"
            className="relative overflow-hidden rounded-[1.75rem] border border-hair bg-elevated bg-noise shadow-card-lg"
          >
            {/* Cobalt keystone thread */}
            <div
              aria-hidden
              className="h-[3px] w-full bg-gradient-to-l from-transparent via-primary/60 to-transparent"
            />

            <div className="px-6 pb-8 pt-9 sm:px-9 sm:pb-9 sm:pt-10">
              {/* Emblem — orbital ellipse + skewed monogram */}
              <div className="flex flex-col items-center text-center">
                <span data-login="mark" className="relative mb-5 flex h-20 w-20 items-center justify-center">
                  <svg viewBox="0 0 56 56" className="absolute inset-0 h-full w-full" aria-hidden>
                    <defs>
                      <linearGradient id="loginRingGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#5B8FC7" />
                        <stop offset="100%" stopColor="#14476F" />
                      </linearGradient>
                    </defs>
                    <ellipse
                      data-login="ring"
                      cx="28"
                      cy="28"
                      rx="25"
                      ry="9.5"
                      fill="none"
                      stroke="url(#loginRingGrad)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      transform="rotate(-16 28 28)"
                    />
                    <ellipse
                      data-login="ring2"
                      cx="28"
                      cy="28"
                      rx="25"
                      ry="9.5"
                      fill="none"
                      stroke="rgba(36,34,29,0.18)"
                      strokeWidth="1"
                      transform="rotate(58 28 28)"
                    />
                  </svg>
                  <span
                    className="select-none font-tech text-[2.15rem] font-bold text-silver"
                    style={{ transform: "skewX(-8deg)" }}
                  >
                    H
                  </span>
                </span>

                <div data-login="head">
                  <h1 className="font-display text-[1.8rem] font-bold leading-tight sm:text-[2rem]">
                    لوحة تحكم هايبر تك
                  </h1>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
                    دخول آمن للإدارة — المنتجات، الطلبات، والصيانة
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
                {error && (
                  <div
                    ref={errorRef}
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/[0.06] px-4 py-3 text-sm font-medium leading-relaxed text-danger"
                  >
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>{error}</span>
                  </div>
                )}

                {/* Username */}
                <div data-login="field" className="space-y-2">
                  <Label htmlFor="admin-username" className="text-sm font-semibold">
                    <UserRound className="h-4 w-4 text-faint" aria-hidden />
                    اسم المستخدم
                  </Label>
                  <Input
                    id="admin-username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError(null);
                    }}
                    placeholder="بريد المدير"
                    autoComplete="username"
                    dir="ltr"
                    required
                    aria-invalid={error ? true : undefined}
                    className="min-h-12 rounded-xl bg-raised/50 px-4 text-[0.95rem] transition-[color,box-shadow,border-color] duration-200 focus-visible:border-primary/70 focus-visible:ring-primary/25 md:text-[0.95rem]"
                  />
                </div>

                {/* Password */}
                <div data-login="field" className="space-y-2">
                  <Label htmlFor="admin-password" className="text-sm font-semibold">
                    <KeyRound className="h-4 w-4 text-faint" aria-hidden />
                    كلمة المرور
                  </Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="كلمة المرور"
                      autoComplete="current-password"
                      required
                      aria-invalid={error ? true : undefined}
                      className="min-h-12 rounded-xl border-input bg-raised/50 pl-[3.25rem] pr-4 text-[0.95rem] transition-[color,box-shadow,border-color] duration-200 focus-visible:border-primary/70 focus-visible:ring-primary/25 md:text-[0.95rem]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                      className="absolute left-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-l-xl text-muted-foreground transition-colors hover:bg-primary/[0.06] hover:text-primary"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" aria-hidden />
                      ) : (
                        <Eye className="h-5 w-5" aria-hidden />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit + failed-attempt meter */}
                <div data-login="field" className="space-y-3">
                  <Button
                    type="submit"
                    disabled={pending}
                    className="min-h-12 w-full rounded-xl text-[0.95rem] font-bold glow-accent-sm transition-all duration-200 hover:brightness-105 hover:shadow-[0_14px_34px_-12px_rgba(26,92,166,0.55)] active:scale-[0.985]"
                  >
                    {pending ? (
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    ) : (
                      <Fingerprint className="h-5 w-5" aria-hidden />
                    )}
                    {pending ? "جاري التحقق من البيانات…" : "تسجيل الدخول"}
                  </Button>
                  {attempts > 0 && !error && (
                    <p className="flex items-center justify-center gap-1.5 text-center text-xs font-bold text-amber">
                      <Timer className="h-3.5 w-3.5" aria-hidden />
                      محاولات فاشلة متبقية قبل القفل المؤقت: {Math.max(0, 5 - attempts)}
                    </p>
                  )}
                </div>

                {/* Security strip */}
                <div
                  data-login="field"
                  className="flex items-center gap-3 rounded-2xl border border-hair bg-raised/60 px-4 py-3.5"
                >
                  <ShieldCheck className="h-5 w-5 shrink-0 text-mint" aria-hidden />
                  <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
                    جلسة موقّعة ومشفّرة — تسجيل خروج تلقائي بعد ٨ ساعات
                  </p>
                  <Lock className="h-3.5 w-3.5 shrink-0 text-faint" aria-hidden />
                </div>
              </form>
            </div>
          </div>

          {/* Back to storefront */}
          <div data-login="field" className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => navigate({ name: "home" })}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-primary"
            >
              <Store className="h-4 w-4" aria-hidden />
              العودة للمتجر
            </button>
          </div>
        </div>
      </section>

      {/* ============ Left panel (lg+) — atmospheric vault surface ============ */}
      <aside
        aria-label="قدرات لوحة التحكم"
        className="relative hidden overflow-hidden lg:block lg:w-[45%] lg:shrink-0"
        style={{ clipPath: "polygon(0 0, 100% 0, calc(100% - 2.75rem) 100%, 0 100%)" }}
      >
        {/* Warm charcoal base — the vault door */}
        <div aria-hidden className="absolute inset-0 bg-[#1d1b16]" />

        {/* Drafting grid (light hairlines — dark-surface inversion of bg-grid) */}
        <div
          aria-hidden
          className="absolute inset-0 bg-grid"
          style={{
            backgroundImage:
              "linear-gradient(rgba(247,245,240,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(247,245,240,0.05) 1px, transparent 1px)",
          }}
        />

        {/* Cobalt thread tracing the angled seam */}
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#5b8fc7]/25 via-[#5b8fc7]/[0.07] to-transparent"
        />

        {/* Deep cobalt atmosphere */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 orb-glow opacity-60"
        />

        {/* Orbital system — slow precession + counter-rotating hairline */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2"
        >
          <svg viewBox="0 0 200 200" className="h-full w-full animate-spin-slower opacity-90">
            <g transform="rotate(-16 100 100)">
              <ellipse
                cx="100"
                cy="100"
                rx="88"
                ry="33"
                fill="none"
                stroke="rgba(91,143,199,0.5)"
                strokeWidth="1.4"
              />
              <circle cx="188" cy="100" r="3.2" fill="#5B8FC7" />
            </g>
          </svg>
        </div>
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2"
        >
          <svg viewBox="0 0 200 200" className="h-full w-full animate-spin-slow">
            <ellipse
              cx="100"
              cy="100"
              rx="86"
              ry="30"
              fill="none"
              stroke="rgba(247,245,240,0.13)"
              strokeWidth="1"
              transform="rotate(58 100 100)"
            />
          </svg>
        </div>

        {/* Ghost wordmark */}
        <div
          data-login="ghost"
          aria-hidden
          dir="ltr"
          className="pointer-events-none absolute bottom-3 left-0 select-none whitespace-nowrap font-tech text-[6.5rem] font-bold leading-none tracking-tighter text-[#f7f5f0]/[0.05] xl:text-[8rem]"
        >
          HYPER TECH
        </div>

        {/* Micro plate label */}
        <p
          dir="ltr"
          className="absolute right-10 top-9 select-none font-tech text-[0.62rem] font-medium tracking-[0.38em] text-[#f7f5f0]/40"
        >
          HYPER TECH · CONTROL ROOM
        </p>

        {/* Trust content */}
        <div className="relative z-10 flex h-full flex-col justify-center gap-7 px-12 xl:px-16">
          <div data-login="trust">
            <h2 className="font-display text-[1.65rem] font-bold leading-snug text-[#f7f5f0]/90">بوابة الإدارة</h2>
            <p className="mt-2.5 max-w-[17rem] text-sm leading-relaxed text-[#f7f5f0]/55">
              منظومة تشغيل هايبر تك الكاملة — محمية بجلسات موقّعة ومشفّرة.
            </p>
            <div aria-hidden className="mt-6 h-px w-24 bg-gradient-to-l from-[#5b8fc7]/70 to-transparent" />
          </div>

          <ul className="space-y-4">
            {TRUST.map(({ icon: Icon, tone, text }) => (
              <li key={text} data-login="trust" className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#f7f5f0]/[0.1] bg-[#f7f5f0]/[0.04]">
                  <Icon className={`h-5 w-5 ${tone}`} aria-hidden />
                </span>
                <p className="text-sm font-medium leading-relaxed text-[#f7f5f0]/80">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
