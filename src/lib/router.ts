"use client";

/**
 * ============================================================
 * HYPER TECH — Virtual Router (hash-based SPA)
 * ============================================================
 * The whole experience lives on the single Next.js route "/".
 * Hash fragments give us deep-linkable views + working back /
 * forward navigation without extra app routes.
 *
 *   #/                  home
 *   #/store             store (all products)
 *   #/store/:slug       category world (legacy path form)
 *   #/product/:slug     product details
 *   #/builds            PC builds experience
 *   #/build/:slug       build details
 *   #/maintenance       maintenance service
 *   #/cart              cart page
 *   #/checkout          WhatsApp checkout
 *   #/admin             admin (mock login → dashboard)
 *   #/admin/:section    admin sections
 *
 * Store query params (URL-synced catalog filters — shareable pages):
 *   #/store?cat={slug}&brand={name[,name]}&min={n}&max={n}
 *          &avail=in-stock,low-stock&sort=price-asc&q={term}
 *   (legacy #/store/:slug and ?brand= links keep working)
 * ============================================================
 */

import { create } from "zustand";
import { useUIStore } from "@/lib/store/ui-store";

export type AdminSection =
  | "overview"
  | "products"
  | "categories"
  | "builds"
  | "orders"
  | "maintenance"
  | "data"
  | "settings";

/** URL-synced store filters (only non-default values are serialized). */
export interface StoreFilters {
  min?: number;
  max?: number;
  availability?: string[];
  sort?: string;
  q?: string;
}

export type Route =
  | { name: "home" }
  | { name: "store"; categorySlug?: string; brand?: string; filters?: StoreFilters }
  | { name: "product"; slug: string }
  | { name: "builds" }
  | { name: "build"; slug: string }
  | { name: "maintenance" }
  | { name: "cart" }
  | { name: "checkout" }
  | { name: "admin"; section: AdminSection };

export function parseHash(rawHash: string): Route {
  const withoutHash = rawHash.replace(/^#\/?/, "").replace(/\/+$/, "");
  const [pathPart, queryPart] = withoutHash.split("?");
  const params = queryPart ? new URLSearchParams(queryPart) : null;
  const brandParam = params?.get("brand") ?? undefined;
  const parts = pathPart ? pathPart.split("/") : [];

  switch (parts[0]) {
    case undefined:
    case "":
      return { name: "home" };
    case "store": {
      const catParam = params?.get("cat") ?? undefined;
      const slug = parts[1] || catParam;

      const filters: StoreFilters = {};
      const minParam = params?.get("min");
      const maxParam = params?.get("max");
      const minNum = minParam === null ? NaN : Number(minParam);
      const maxNum = maxParam === null ? NaN : Number(maxParam);
      if (Number.isFinite(minNum) && minNum >= 0) filters.min = Math.floor(minNum);
      if (Number.isFinite(maxNum) && maxNum >= 0) filters.max = Math.floor(maxNum);
      const availParam = params?.get("avail");
      if (availParam) {
        const list = availParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (list.length) filters.availability = list;
      }
      const sortParam = params?.get("sort");
      if (sortParam && sortParam !== "newest") filters.sort = sortParam;
      const qParam = params?.get("q");
      if (qParam && qParam.trim()) filters.q = qParam.trim();

      const hasFilters = Object.keys(filters).length > 0;
      return {
        name: "store",
        ...(slug ? { categorySlug: slug } : {}),
        ...(brandParam ? { brand: brandParam } : {}),
        ...(hasFilters ? { filters } : {}),
      };
    }
    case "product":
      return parts[1] ? { name: "product", slug: parts[1] } : { name: "store" };
    case "builds":
      return { name: "builds" };
    case "build":
      return parts[1] ? { name: "build", slug: parts[1] } : { name: "builds" };
    case "maintenance":
      return { name: "maintenance" };
    case "cart":
      return { name: "cart" };
    case "checkout":
      return { name: "checkout" };
    case "admin": {
      const section = parts[1] as AdminSection | undefined;
      const valid: AdminSection[] = [
        "overview",
        "products",
        "categories",
        "builds",
        "orders",
        "maintenance",
        "data",
        "settings",
      ];
      return { name: "admin", section: section && valid.includes(section) ? section : "overview" };
    }
    default:
      return { name: "home" };
  }
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case "home":
      return "#/";
    case "store": {
      const sp = new URLSearchParams();
      if (route.categorySlug) sp.set("cat", route.categorySlug);
      if (route.brand) sp.set("brand", route.brand);
      const f = route.filters;
      if (f) {
        if (typeof f.min === "number") sp.set("min", String(f.min));
        if (typeof f.max === "number") sp.set("max", String(f.max));
        if (f.availability?.length) sp.set("avail", f.availability.join(","));
        if (f.sort && f.sort !== "newest") sp.set("sort", f.sort);
        if (f.q && f.q.trim()) sp.set("q", f.q.trim());
      }
      const qs = sp.toString();
      return qs ? `#/store?${qs}` : "#/store";
    }
    case "product":
      return `#/product/${route.slug}`;
    case "builds":
      return "#/builds";
    case "build":
      return `#/build/${route.slug}`;
    case "maintenance":
      return "#/maintenance";
    case "cart":
      return "#/cart";
    case "checkout":
      return "#/checkout";
    case "admin":
      return route.section === "overview" ? "#/admin" : `#/admin/${route.section}`;
  }
}

interface RouterState {
  route: Route;
  /** Go to a route (updates the hash; hashchange listener applies it) */
  navigate: (route: Route, opts?: { replace?: boolean }) => void;
  /** Internal: apply a parsed route */
  apply: (route: Route) => void;
}

export const useRouterStore = create<RouterState>((set, get) => ({
  route: { name: "home" },
  navigate: (route, opts) => {
    // Close transient overlays on any navigation
    useUIStore.getState().setCartOpen(false);
    useUIStore.getState().setMobileNavOpen(false);
    useUIStore.getState().setSearchOpen(false);

    const hash = routeToHash(route);
    if (typeof window !== "undefined") {
      if (window.location.hash === hash) {
        // Same target — apply directly (e.g. re-entering #/)
        get().apply(parseHash(hash));
      } else if (opts?.replace) {
        window.history.replaceState(null, "", hash);
        get().apply(parseHash(hash));
      } else {
        window.location.hash = hash; // fires hashchange → apply
      }
    }
  },
  apply: (route) => set({ route }),
}));

/** Attach the global hash listener (call once in the app shell) */
export function initRouter(): () => void {
  const applyFromHash = () => {
    useRouterStore.getState().apply(parseHash(window.location.hash));
  };
  applyFromHash();
  window.addEventListener("hashchange", applyFromHash);
  return () => window.removeEventListener("hashchange", applyFromHash);
}
