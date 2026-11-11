"use client";

/**
 * ============================================================
 * HYPER TECH — Admin View (orchestrator)
 * ============================================================
 * Gate: REAL server session (HTTP-only signed cookie) checked
 * against /api/admin/session on every mount. Authed: full-screen
 * shell with the active panel switched by the `section` prop.
 * Admin-only records (orders + maintenance) hydrate here once.
 * ============================================================
 */

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useUIStore } from "@/lib/store/ui-store";
import { repositories } from "@/lib/repositories";
import type { AdminSection } from "@/lib/router";
import AdminLogin from "./admin-login";
import AdminShell from "./admin-shell";
import OverviewPanel from "./overview-panel";
import ProductsManager from "./products-manager";
import CategoriesManager from "./categories-manager";
import BuildsManager from "./builds-manager";
import OrdersManager from "./orders-manager";
import MaintenanceManager from "./maintenance-manager";
import SettingsManager from "./settings-manager";
import BackupCenter from "./backup-center";

type SessionState = "checking" | "authed" | "anon";

export default function AdminView({ section }: { section: AdminSection }) {
  const adminAuthed = useUIStore((s) => s.adminAuthed);
  const setAdminAuthed = useUIStore((s) => s.setAdminAuthed);
  const [session, setSession] = useState<SessionState>(adminAuthed ? "authed" : "checking");

  /* Server session check — the cookie is the single source of truth. */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/session", { headers: { "cache-control": "no-store" } });
        const data = (await res.json().catch(() => ({}))) as { authed?: boolean };
        if (!alive) return;
        const authed = Boolean(data.authed);
        setSession(authed ? "authed" : "anon");
        if (authed !== adminAuthed) setAdminAuthed(authed);
      } catch {
        if (alive) setSession("anon");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* Hydrate admin-only records (orders + maintenance) once authed. */
  useEffect(() => {
    if (session !== "authed") return;
    repositories.orders.list().catch(() => undefined);
    repositories.maintenance.list().catch(() => undefined);
  }, [session]);

  /* The app shell already hides the footer + floating widgets for
     admin routes; the fixed site header would still overlap the
     full-screen admin surface — hide it while the admin is mounted
     and restore it on unmount. */
  useEffect(() => {
    const header = document.querySelector("[data-header]");
    if (header instanceof HTMLElement) {
      header.style.display = "none";
      return () => {
        header.style.display = "";
      };
    }
  }, []);

  if (session === "checking") {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
        {/* Background image: atmospheric tech workspace / store */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-25 scale-105 filter blur-[2px] transition-transform duration-1000"
          style={{ backgroundImage: `url('/atmosphere/about-store.jpg')` }}
        />
        {/* High-tech gradient overlay */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/60 backdrop-blur-sm"
        />

        {/* Ambient orbital glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
        />

        {/* Central luxury card */}
        <div className="relative z-10 mx-4 flex w-full max-w-md flex-col items-center rounded-[2rem] border border-hair bg-elevated/90 p-8 text-center shadow-card-lg backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
          {/* Brand Monogram with pulsing aura */}
          <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
            <span
              aria-hidden
              className="absolute inset-0 animate-ping rounded-full bg-primary/20 opacity-75 duration-1000"
            />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-lg backdrop-blur-md">
              <svg viewBox="0 0 44 44" className="absolute inset-0 h-full w-full text-primary" aria-hidden>
                <ellipse
                  cx="22"
                  cy="22"
                  rx="19"
                  ry="7.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  transform="rotate(-16 22 22)"
                />
              </svg>
              <span className="font-tech text-2xl font-bold text-silver" style={{ transform: "skewX(-8deg)" }}>
                H
              </span>
            </span>
          </div>

          <h2 className="font-display text-xl font-bold text-foreground">لوحة تحكم هايبر تك</h2>
          <p className="mt-2 text-sm text-muted-foreground">جاري التحقق من الجلسة وتأمين الاتصال…</p>

          {/* Smooth modern pulse line instead of a spinning wheel */}
          <div className="mt-6 h-1.5 w-44 overflow-hidden rounded-full bg-foreground/[0.08]">
            <div className="h-full w-1/2 animate-[pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite] rounded-full bg-gradient-to-r from-primary to-[#5b8fc7]" />
          </div>
        </div>
      </div>
    );
  }

  if (session === "anon") return <AdminLogin onAuthed={() => setSession("authed")} />;

  return (
    <AdminShell section={section}>
      {section === "overview" && <OverviewPanel />}
      {section === "products" && <ProductsManager />}
      {section === "categories" && <CategoriesManager />}
      {section === "builds" && <BuildsManager />}
      {section === "orders" && <OrdersManager />}
      {section === "maintenance" && <MaintenanceManager />}
      {section === "data" && <BackupCenter />}
      {section === "settings" && <SettingsManager />}
    </AdminShell>
  );
}
