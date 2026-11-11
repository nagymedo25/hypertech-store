"use client";

/**
 * ============================================================
 * HYPER TECH — App Shell (Luxury Light)
 * ============================================================
 * Single-route SPA shell: virtual router view-switching with a
 * cinematic curtain transition that can NEVER block navigation
 * (failsafe commits the view even if an animation fails).
 * ============================================================
 */

import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { gsap } from "gsap";
import { useRouterStore, type Route } from "@/lib/router";
import { initRouter } from "@/lib/router";
import { useMockDB, startBootstrap } from "@/lib/store/db-store";
import { SmoothScrollProvider, scrollTop } from "@/components/motion/smooth-scroll";
import { IntroSplash } from "@/components/app/intro-splash";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { AddedPanel } from "@/components/cart/added-panel";
import { SearchPalette } from "@/components/layout/search-palette";
import { FloatingWhatsApp } from "@/components/layout/floating-whatsapp";
import { ViewSkeleton } from "@/components/ui/view-skeleton";
import { Toaster } from "sonner";
import { EASE, DUR, prefersReducedMotion } from "@/lib/motion";

const HomeView = lazy(() => import("@/components/home/home-view"));
const StoreView = lazy(() => import("@/components/store/store-view"));
const ProductView = lazy(() => import("@/components/product/product-view"));
const BuildsView = lazy(() => import("@/components/builds/builds-view"));
const BuildView = lazy(() => import("@/components/builds/build-view"));
const MaintenanceView = lazy(() => import("@/components/maintenance/maintenance-view"));
const CartView = lazy(() => import("@/components/cart/cart-view"));
const CheckoutView = lazy(() => import("@/components/cart/checkout-view"));
const AdminView = lazy(() => import("@/components/admin/admin-view"));

function routeKey(route: Route): string {
  switch (route.name) {
    case "home":
      return "home";
    case "store":
      // brand + filters are URL-synced filter dimensions — only a category
      // ("world") switch plays the curtain; filter changes commit instantly.
      return `store:${route.categorySlug ?? "all"}`;
    case "product":
      return `product:${route.slug}`;
    case "builds":
      return "builds";
    case "build":
      return `build:${route.slug}`;
    case "maintenance":
      return "maintenance";
    case "cart":
      return "cart";
    case "checkout":
      return "checkout";
    case "admin":
      return `admin:${route.section}`;
  }
}

/** Per-view document titles (Arabic) */
function viewTitle(route: Route): string {
  switch (route.name) {
    case "home":
      return null as unknown as string;
    case "store":
      return "المتجر";
    case "product":
      return "تفاصيل المنتج";
    case "builds":
      return "تجميعات الكمبيوتر";
    case "build":
      return "تفاصيل التجميعة";
    case "maintenance":
      return "خدمة الصيانة";
    case "cart":
      return "سلة المشتريات";
    case "checkout":
      return "إتمام الطلب";
    case "admin":
      return "لوحة التحكم";
  }
}

export function HyperApp() {
  const route = useRouterStore((s) => s.route);
  const [displayed, setDisplayed] = useState<Route>({ name: "home" });
  const [splashDone, setSplashDone] = useState(false);
  const bootstrapped = useMockDB((s) => s.bootstrapped);
  const bootstrapError = useMockDB((s) => s.bootstrapError);
  /* Derived boot gate: the view only boots when BOTH the intro
     animation completed AND the database payload arrived — hero
     entrances then start on real data, never on skeletons. */
  const booted = splashDone && bootstrapped;
  const curtainRef = useRef<HTMLDivElement>(null);
  const pending = useRef<Route | null>(null);

  /* Boot the hash router + hydrate the store from the production DB */
  useEffect(() => {
    initRouter();
    startBootstrap().catch(() => undefined);
  }, []);

  /* Cinematic curtain transition with a NEVER-BLOCK failsafe */
  useEffect(() => {
    if (route.name === displayed.name && routeKey(route) === routeKey(displayed)) return;

    pending.current = route;
    const curtain = curtainRef.current;
    const reduced = prefersReducedMotion();

    const commit = () => {
      scrollTop(true);
      setDisplayed(pending.current ?? route);
    };

    if (!curtain || reduced) {
      commit();
      return;
    }

    // Cover → swap → reveal
    gsap
      .timeline()
      .set(curtain, { transformOrigin: "bottom", scaleY: 0, pointerEvents: "auto" })
      .to(curtain, { scaleY: 1, duration: DUR.fast, ease: "power3.in" })
      .add(() => commit())
      .to(curtain, { transformOrigin: "top", scaleY: 0, duration: DUR.base + 0.15, ease: EASE.inOut }, "+=0.05")
      .set(curtain, { pointerEvents: "none" });

    // Failsafe: navigation ALWAYS commits quickly, animation or not
    const failsafe = setTimeout(() => {
      if (pending.current) {
        gsap.set(curtain, { scaleY: 0, pointerEvents: "none" });
        commit();
        pending.current = null;
      }
    }, 520);

    return () => clearTimeout(failsafe);
  }, [route, displayed]);

  /* Update document title per view */
  useEffect(() => {
    const t = viewTitle(displayed);
    if (t) document.title = `${t} | هايبر تك HYPER TECH`;
    else document.title = "هايبر تك | HYPER TECH — إلكترونيات المنصورة";
  }, [displayed]);

  const isAdmin = displayed.name === "admin";

  /*
   * URL-synced store filters: لما الـ route يتغير جوّا نفس العرض ونفس العالم
   * (فلاتر / back-forward)، بن synced فورًا أثناء الـ render (نمط React
   * الرسمي لتعديل الحالة عند تغيّر الـ props) — من غير ستارة انتقال.
   * تغيّر العالم/العرض نفسه بيمشي في التأثير بالتحت (ستارة + scroll).
   */
  if (route.name === displayed.name && routeKey(route) === routeKey(displayed) && route !== displayed) {
    setDisplayed(route);
  }

  return (
    <SmoothScrollProvider>
      {/* Fixed atmospheric background — warm ivory gallery */}
      <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-background">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute -top-[30vh] left-1/2 h-[70vh] w-[90vw] -translate-x-1/2 orb-glow opacity-80" />
        <div className="absolute bottom-[-20vh] right-[-10vw] h-[50vh] w-[50vw] orb-warm opacity-50" />
      </div>

      <IntroSplash onDone={() => setSplashDone(true)} />

      {/* Route transition curtain (never blocks — see failsafe above) */}
      <div
        ref={curtainRef}
        aria-hidden
        className="fixed inset-0 z-[90] pointer-events-none bg-[#fbfaf7] hidden md:block"
        style={{ transform: "scaleY(0)", transformOrigin: "top" }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-primary/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-primary/50 to-transparent" />
      </div>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        تخطَّ إلى المحتوى الرئيسي
      </a>

      <div className="relative flex min-h-screen flex-col">
        <Header booted={booted} />
        <main id="main-content" className="relative flex-1">
          {bootstrapError ? (
            <BootstrapError />
          ) : (
            <Suspense fallback={<ViewSkeleton />}>
              <ViewSwitch route={displayed} booted={booted} />
            </Suspense>
          )}
        </main>
        {!isAdmin && <Footer />}
      </div>

      {!isAdmin && <FloatingWhatsApp />}
      <CartDrawer />
      <AddedPanel />
      <SearchPalette />
      <Toaster
        position="bottom-center"
        dir="rtl"
        theme="light"
        richColors
        closeButton
        toastOptions={{
          style: {
            fontFamily: "var(--font-body)",
            background: "#ffffff",
            border: "1px solid rgba(36,34,29,0.1)",
            color: "#24221d",
            boxShadow: "0 12px 40px -12px rgba(36,31,24,0.2)",
          },
        }}
      />
    </SmoothScrollProvider>
  );
}

/* Full-screen retry panel when the production DB is unreachable. */
function BootstrapError() {
  const retry = () => {
    useMockDB.getState().markBootstrapFailed();
    startBootstrap().catch(() => undefined);
  };
  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-danger/25 bg-danger/[0.06] text-danger">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M12 8v5M12 16.5v.01" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
      <h2 className="font-display text-2xl font-bold">تعذر تحميل بيانات المتجر</h2>
      <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
        في مشكلة في الاتصال بقاعدة البيانات. تأكد من الإنترنت وجرّب تاني — بياناتك محفوظة ومش هتتأثر.
      </p>
      <button
        onClick={retry}
        className="glow-accent-sm mt-7 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-primary px-7 font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}

function ViewSwitch({ route, booted }: { route: Route; booted: boolean }) {
  switch (route.name) {
    case "home":
      return <HomeView booted={booted} />;
    case "store":
      return (
        <StoreView
          categorySlug={route.categorySlug}
          brand={route.brand}
          filters={route.filters}
        />
      );
    case "product":
      return <ProductView slug={route.slug} />;
    case "builds":
      return <BuildsView />;
    case "build":
      return <BuildView slug={route.slug} />;
    case "maintenance":
      return <MaintenanceView />;
    case "cart":
      return <CartView />;
    case "checkout":
      return <CheckoutView />;
    case "admin":
      return <AdminView section={route.section} />;
  }
}
