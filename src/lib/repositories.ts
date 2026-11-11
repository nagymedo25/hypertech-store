"use client";

/**
 * ============================================================
 * HYPER TECH — Repository Layer (Phase 02 · API-backed)
 * ============================================================
 * The ONLY mutation path the UI uses. Every write travels to
 * the production API (Neon PostgreSQL behind it) and enters the
 * client cache strictly AFTER the server confirms.
 *
 * Reads are served from the hydrated store (instant, reactive)
 * — bootstrap keeps it fresh and mutations keep it exact.
 *
 * Server-side pricing: orders are computed by the server from
 * live DB prices; the browser cart is never trusted.
 * ============================================================
 */

import { useMockDB, startBootstrap } from "@/lib/store/db-store";
import type {
  Category,
  MaintenanceRecord,
  OrderRecord,
  PCBuild,
  Product,
  ProductFilter,
  StoreSettings,
} from "@/types";

/* --------------------------- HTTP core --------------------------- */

export class ApiError extends Error {
  status: number;
  retryAfter?: number;
  constructor(message: string, status: number, retryAfter?: number) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      "cache-control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    const err = data as { error?: string; retryAfter?: number } | null;
    throw new ApiError(
      err?.error ?? "تعذر تنفيذ العملية — حاول تاني",
      res.status,
      err?.retryAfter
    );
  }
  return data as T;
}

const post = <T,>(path: string, body: unknown) =>
  api<T>(path, { method: "POST", body: JSON.stringify(body) });
const patch = <T,>(path: string, body: unknown) =>
  api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
const put = <T,>(path: string, body: unknown) =>
  api<T>(path, { method: "PUT", body: JSON.stringify(body) });
const del = <T,>(path: string) => api<T>(path, { method: "DELETE" });

/* ------------------------- Filter matching ------------------------- */

function applyFilter(products: Product[], f: ProductFilter): Product[] {
  let out = [...products];
  if (f.categoryId) out = out.filter((p) => p.categoryId === f.categoryId);
  if (f.brand) out = out.filter((p) => p.brand === f.brand);
  if (f.search?.trim()) {
    const q = f.search.trim().toLowerCase();
    out = out.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }
  if (typeof f.minPrice === "number") out = out.filter((p) => p.price >= f.minPrice!);
  if (typeof f.maxPrice === "number") out = out.filter((p) => p.price <= f.maxPrice!);
  if (f.availability?.length) out = out.filter((p) => f.availability!.includes(p.availability));
  switch (f.sort) {
    case "price-asc":
      out.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      out.sort((a, b) => b.price - a.price);
      break;
    case "featured":
      out.sort((a, b) => Number(b.featured) - Number(a.featured));
      break;
    case "newest":
    default:
      out.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }
  return out;
}

/* ------------------------ Repository interfaces ----------------------- */

export interface ProductRepository {
  list(filter?: ProductFilter): Promise<Product[]>;
  get(idOrSlug: string): Promise<Product | null>;
  related(productId: string, limit?: number): Promise<Product[]>;
  create(input: Omit<Product, "id" | "slug" | "createdAt">): Promise<Product>;
  update(id: string, patch: Partial<Product>): Promise<Product | null>;
  remove(id: string): Promise<void>;
}

export interface CategoryRepository {
  list(): Promise<Category[]>;
  get(idOrSlug: string): Promise<Category | null>;
  create(input: Omit<Category, "id">): Promise<Category>;
  update(id: string, patch: Partial<Category>): Promise<void>;
  remove(id: string): Promise<void>;
  reorder(id: string, direction: "up" | "down"): Promise<void>;
}

export interface BuildRepository {
  list(): Promise<PCBuild[]>;
  get(idOrSlug: string): Promise<PCBuild | null>;
  create(input: Omit<PCBuild, "id" | "slug">): Promise<PCBuild>;
  update(id: string, patch: Partial<PCBuild>): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface OrderRepository {
  list(): Promise<OrderRecord[]>;
  /** Public order submission — the server prices it from the live DB. */
  submit(input: {
    customerName: string;
    customerPhone: string;
    notes?: string;
    items: { productId: string; qty: number }[];
  }): Promise<OrderRecord>;
  update(id: string, patch: Partial<OrderRecord>): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface MaintenanceRepository {
  list(): Promise<MaintenanceRecord[]>;
  create(input: Omit<MaintenanceRecord, "id" | "ref" | "createdAt" | "status">): Promise<MaintenanceRecord>;
  update(id: string, patch: Partial<MaintenanceRecord>): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface SettingsRepository {
  get(): Promise<StoreSettings>;
  update(patch: Partial<StoreSettings>): Promise<void>;
}

/* ---------------------- API-backed implementations --------------------- */

const apiProductRepository: ProductRepository = {
  async list(filter = {}) {
    await startBootstrap().catch(() => undefined);
    return applyFilter(useMockDB.getState().products, filter);
  },
  async get(idOrSlug) {
    await startBootstrap().catch(() => undefined);
    const { products } = useMockDB.getState();
    return products.find((p) => p.id === idOrSlug || p.slug === idOrSlug) ?? null;
  },
  async related(productId, limit = 4) {
    await startBootstrap().catch(() => undefined);
    const { products } = useMockDB.getState();
    const me = products.find((p) => p.id === productId);
    if (!me) return [];
    return products
      .filter((p) => p.id !== me.id && p.categoryId === me.categoryId)
      .slice(0, limit);
  },
  async create(input) {
    const { product } = await post<{ product: Product }>("/api/admin/products", input);
    useMockDB.getState().addProduct(product);
    return product;
  },
  async update(id, patchBody) {
    const { product } = await patch<{ product: Product }>(`/api/admin/products/${id}`, patchBody);
    useMockDB.getState().updateProduct(id, product);
    return product;
  },
  async remove(id) {
    await del(`/api/admin/products/${id}`);
    useMockDB.getState().removeProduct(id);
  },
};

const apiCategoryRepository: CategoryRepository = {
  async list() {
    await startBootstrap().catch(() => undefined);
    return [...useMockDB.getState().categories].sort((a, b) => a.order - b.order);
  },
  async get(idOrSlug) {
    await startBootstrap().catch(() => undefined);
    const { categories } = useMockDB.getState();
    return categories.find((c) => c.id === idOrSlug || c.slug === idOrSlug) ?? null;
  },
  async create(input) {
    const { category } = await post<{ category: Category }>("/api/admin/categories", input);
    useMockDB.getState().addCategory(category);
    return category;
  },
  async update(id, patchBody) {
    const { category } = await patch<{ category: Category }>(`/api/admin/categories/${id}`, patchBody);
    useMockDB.getState().updateCategory(id, category);
  },
  async remove(id) {
    await del(`/api/admin/categories/${id}`);
    useMockDB.getState().removeCategory(id);
  },
  async reorder(id, direction) {
    const { categories } = await patch<{ categories: Category[] }>(
      `/api/admin/categories/${id}`,
      { reorder: direction }
    );
    useMockDB.getState().setCategories(categories);
  },
};

const apiBuildRepository: BuildRepository = {
  async list() {
    await startBootstrap().catch(() => undefined);
    return [...useMockDB.getState().builds];
  },
  async get(idOrSlug) {
    await startBootstrap().catch(() => undefined);
    const { builds } = useMockDB.getState();
    return builds.find((b) => b.id === idOrSlug || b.slug === idOrSlug) ?? null;
  },
  async create(input) {
    const { build } = await post<{ build: PCBuild }>("/api/admin/builds", input);
    useMockDB.getState().addBuild(build);
    return build;
  },
  async update(id, patchBody) {
    const { build } = await patch<{ build: PCBuild }>(`/api/admin/builds/${id}`, patchBody);
    useMockDB.getState().updateBuild(id, build);
  },
  async remove(id) {
    await del(`/api/admin/builds/${id}`);
    useMockDB.getState().removeBuild(id);
  },
};

const apiOrderRepository: OrderRepository = {
  async list() {
    const { orders } = await api<{ orders: OrderRecord[] }>("/api/admin/orders");
    useMockDB.getState().setOrders(orders);
    return orders;
  },
  async submit(input) {
    const { order } = await post<{ order: OrderRecord }>("/api/orders", input);
    // Append locally so the admin (if logged in on this device) sees it immediately
    useMockDB.getState().addOrder(order);
    return order;
  },
  async update(id, patchBody) {
    const { order } = await patch<{ order: OrderRecord }>(`/api/admin/orders/${id}`, patchBody);
    useMockDB.getState().updateOrder(id, order);
  },
  async remove(id) {
    await del(`/api/admin/orders/${id}`);
    useMockDB.getState().removeOrder(id);
  },
};

const apiMaintenanceRepository: MaintenanceRepository = {
  async list() {
    const { requests } = await api<{ requests: MaintenanceRecord[] }>("/api/admin/maintenance");
    useMockDB.getState().setMaintenance(requests);
    return requests;
  },
  async create(input) {
    const { request } = await post<{ request: MaintenanceRecord }>("/api/maintenance", input);
    useMockDB.getState().addMaintenanceRequest(request);
    return request;
  },
  async update(id, patchBody) {
    const { request } = await patch<{ request: MaintenanceRecord }>(
      `/api/admin/maintenance/${id}`,
      patchBody
    );
    useMockDB.getState().updateMaintenanceRequest(id, request);
  },
  async remove(id) {
    await del(`/api/admin/maintenance/${id}`);
    useMockDB.getState().removeMaintenanceRequest(id);
  },
};

const apiSettingsRepository: SettingsRepository = {
  async get() {
    await startBootstrap().catch(() => undefined);
    return { ...useMockDB.getState().settings };
  },
  async update(patchBody) {
    const { settings } = await put<{ settings: StoreSettings }>("/api/admin/settings", patchBody);
    useMockDB.getState().updateSettings(settings);
  },
};

/* --------------------------- Active repos ----------------------------- */

export const repositories = {
  products: apiProductRepository,
  categories: apiCategoryRepository,
  builds: apiBuildRepository,
  orders: apiOrderRepository,
  maintenance: apiMaintenanceRepository,
  settings: apiSettingsRepository,
};
