"use client";

/**
 * ============================================================
 * HYPER TECH — Live Data Store (Phase 02 · production)
 * ============================================================
 * The single client-side cache of the production database.
 * Hydrated once from GET /api/bootstrap (Neon PostgreSQL),
 * then kept in sync exclusively by the API-backed repository
 * layer (src/lib/repositories.ts) — every mutation goes to the
 * server FIRST and only enters this cache after confirmation.
 *
 * No localStorage: the database is the source of truth. The
 * cart remains intentionally client-side (see cart-store.ts).
 * ============================================================
 */

import { create } from "zustand";
import { BUSINESS } from "@/lib/config";
import type {
  Category,
  MaintenanceRecord,
  OrderRecord,
  PCBuild,
  Product,
  StoreSettings,
} from "@/types";

export interface BootstrapPayload {
  products: Product[];
  categories: Category[];
  builds: PCBuild[];
  settings: StoreSettings | null;
  hero: Product | null;
}

/** Identity defaults (verified business data) — replaced by DB settings on hydrate. */
const defaultSettings: StoreSettings = {
  storeName: BUSINESS.nameArabic,
  tagline: BUSINESS.taglineArabic,
  whatsappNumber: BUSINESS.whatsappNumber,
  whatsappDisplay: BUSINESS.whatsappDisplay,
  facebookUrl: BUSINESS.facebook,
  tiktokUrl: BUSINESS.tiktok,
  address: BUSINESS.address,
  businessDescription: BUSINESS.description,
  logoUrl: undefined,
  showBuildsCategory: true,
};

interface LiveDBState {
  products: Product[];
  categories: Category[];
  builds: PCBuild[];
  orders: OrderRecord[];
  maintenanceRequests: MaintenanceRecord[];
  settings: StoreSettings;
  /** The intelligent hero pick from the server (null until hydrated). */
  heroProduct: Product | null;
  /** True once /api/bootstrap succeeded. */
  bootstrapped: boolean;
  /** True when the bootstrap request failed (drives the retry screen). */
  bootstrapError: boolean;

  /* Hydration */
  hydrate: (payload: BootstrapPayload) => void;
  markBootstrapFailed: () => void;
  setOrders: (orders: OrderRecord[]) => void;
  setMaintenance: (requests: MaintenanceRecord[]) => void;
  setCategories: (categories: Category[]) => void;

  /* Catalog cache mutations — invoked by the repository layer
     ONLY after the server has confirmed the change. */
  addProduct: (p: Product) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  removeProduct: (id: string) => void;

  addCategory: (c: Category) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  reorderCategory: (id: string, direction: "up" | "down") => void;

  addBuild: (b: PCBuild) => void;
  updateBuild: (id: string, patch: Partial<PCBuild>) => void;
  removeBuild: (id: string) => void;

  addOrder: (o: OrderRecord) => void;
  updateOrder: (id: string, patch: Partial<OrderRecord>) => void;
  removeOrder: (id: string) => void;

  addMaintenanceRequest: (m: MaintenanceRecord) => void;
  updateMaintenanceRequest: (id: string, patch: Partial<MaintenanceRecord>) => void;
  removeMaintenanceRequest: (id: string) => void;

  updateSettings: (patch: Partial<StoreSettings>) => void;

  /** After a verified server-side store reset — clear operational data. */
  applyStoreReset: () => void;
}

export const useMockDB = create<LiveDBState>()((set) => ({
  products: [],
  categories: [],
  builds: [],
  orders: [],
  maintenanceRequests: [],
  settings: defaultSettings,
  heroProduct: null,
  bootstrapped: false,
  bootstrapError: false,

  hydrate: (payload) =>
    set({
      products: payload.products,
      categories: payload.categories,
      builds: payload.builds,
      settings: payload.settings ?? defaultSettings,
      heroProduct: payload.hero,
      bootstrapped: true,
      bootstrapError: false,
    }),

  markBootstrapFailed: () => set({ bootstrapError: true, bootstrapped: false }),
  setOrders: (orders) => set({ orders }),
  setMaintenance: (requests) => set({ maintenanceRequests: requests }),
  setCategories: (categories) => set({ categories }),

  addProduct: (p) => set((s) => ({ products: [p, ...s.products] })),
  updateProduct: (id, patch) =>
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),
  removeProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

  addCategory: (c) => set((s) => ({ categories: [...s.categories, c] })),
  updateCategory: (id, patch) =>
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
  removeCategory: (id) =>
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
      // Products of a deleted category stay in the catalog (handoff contract)
    })),
  reorderCategory: (id, direction) =>
    set((s) => {
      const sorted = [...s.categories].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((c) => c.id === id);
      const swapWith = direction === "up" ? idx - 1 : idx + 1;
      if (idx < 0 || swapWith < 0 || swapWith >= sorted.length) return s;
      [sorted[idx], sorted[swapWith]] = [sorted[swapWith], sorted[idx]];
      return {
        categories: sorted.map((c, i) => ({ ...c, order: i })),
      };
    }),

  addBuild: (b) => set((s) => ({ builds: [b, ...s.builds] })),
  updateBuild: (id, patch) =>
    set((s) => ({ builds: s.builds.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
  removeBuild: (id) => set((s) => ({ builds: s.builds.filter((b) => b.id !== id) })),

  addOrder: (o) => set((s) => ({ orders: [o, ...s.orders] })),
  updateOrder: (id, patch) =>
    set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),
  removeOrder: (id) => set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),

  addMaintenanceRequest: (m) =>
    set((s) => ({ maintenanceRequests: [m, ...s.maintenanceRequests] })),
  updateMaintenanceRequest: (id, patch) =>
    set((s) => ({
      maintenanceRequests: s.maintenanceRequests.map((m) =>
        m.id === id ? { ...m, ...patch } : m
      ),
    })),
  removeMaintenanceRequest: (id) =>
    set((s) => ({
      maintenanceRequests: s.maintenanceRequests.filter((m) => m.id !== id),
    })),

  updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

  applyStoreReset: () =>
    set({
      products: [],
      categories: [],
      builds: [],
      orders: [],
      maintenanceRequests: [],
      heroProduct: null,
      // settings preserved — essential store configuration survives resets
    }),
}));

/**
 * Bootstrap the store from the production database (once per page load).
 * Stale-while-revalidate strategy:
 *  1. Instantly hydrates from sessionStorage if available (0ms render).
 *  2. Silently refreshes from /api/bootstrap in the background.
 */
let bootstrapPromise: Promise<void> | null = null;

export function startBootstrap(): Promise<void> {
  const store = useMockDB.getState();
  if (store.bootstrapped) return Promise.resolve();

  // Instant client cache hydration (0ms paint)
  if (typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem("hypertech_catalog_cache");
      if (cached) {
        const parsed = JSON.parse(cached) as BootstrapPayload;
        if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) {
          useMockDB.getState().hydrate(parsed);
        }
      }
    } catch {
      // cache read fallback
    }
  }

  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = fetch("/api/bootstrap")
    .then(async (res) => {
      if (!res.ok) throw new Error(`bootstrap ${res.status}`);
      const data = (await res.json()) as BootstrapPayload;
      useMockDB.getState().hydrate(data);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("hypertech_catalog_cache", JSON.stringify(data));
        } catch {
          // ignore
        }
      }
    })
    .catch((err) => {
      console.error("[bootstrap] failed:", err);
      if (!useMockDB.getState().bootstrapped) {
        useMockDB.getState().markBootstrapFailed();
      }
      bootstrapPromise = null; // allow retry
      throw err;
    });

  return bootstrapPromise;
}
