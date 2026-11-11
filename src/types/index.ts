/**
 * ============================================================
 * HYPER TECH — Domain Models (Phase 01)
 * ============================================================
 * Typed entities shared between the storefront, cart, maintenance
 * service and the admin dashboard. These models are backend-ready:
 * Phase 02 can map them onto Prisma models without frontend changes.
 * ============================================================
 */

/* ----------------------------- Catalog ----------------------------- */

export type ProductAvailability = "in-stock" | "low-stock" | "out-of-stock" | "pre-order";

/** A single technical specification row (label + value) */
export interface SpecItem {
  label: string;
  value: string;
}

/**
 * Different products present their specs differently:
 *  - device    → laptops / desktops (CPU, RAM, Storage, GPU…)
 *  - component → parts (GPU, RAM, SSD…)
 *  - accessory → peripherals (connection, battery, layout…)
 */
export type SpecLayout = "device" | "component" | "accessory";

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  shortDescription: string;
  description: string;
  /** Current selling price in EGP */
  price: number;
  /** Original price before discount (optional) */
  oldPrice?: number;
  /** Promotional badge label, e.g. "عرض الجمعة البيضاء" */
  promotionalLabel?: string;
  categoryId: string;
  images: string[];
  availability: ProductAvailability;
  stockQty: number;
  featured: boolean;
  isNew: boolean;
  /** Sample rating (clearly simulated data — 0 = unrated) */
  rating: number;
  specs: SpecItem[];
  specLayout: SpecLayout;
  createdAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  /** Category accent tint (hex) — its own visual world within the brand */
  accent: string;
  /** Lucide icon name used for quick navigation */
  icon: string;
  order: number;
  /** Visibility on the storefront (admin-controlled) */
  active?: boolean;
}

/* ------------------------------ Builds ------------------------------ */

export type BuildType = "gaming" | "workstation" | "budget" | "creator";

/** A component line inside a PC build (not independently purchasable) */
export interface BuildComponent {
  id: string;
  /** Component role, e.g. "المعالج", "كارت الشاشة" */
  role: string;
  name: string;
  spec?: string;
  qty: number;
  /** Optional unit price when supplied */
  price?: number;
}

export interface PerformanceBadge {
  label: string;
  /** 0-100 relative performance indicator (simulated) */
  score: number;
}

export interface PCBuild {
  id: string;
  slug: string;
  title: string;
  type: BuildType;
  description: string;
  images: string[];
  components: BuildComponent[];
  totalPrice: number;
  availability: ProductAvailability;
  performance: PerformanceBadge[];
  featured: boolean;
}

/* ------------------------------- Cart ------------------------------- */

export interface CartItem {
  productId: string;
  qty: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  notes?: string;
}

/* ------------------------------ Orders ------------------------------ */

export type OrderStatus = "new" | "contacted" | "confirmed" | "completed" | "cancelled";

export interface OrderLine {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

export interface OrderRecord {
  id: string;
  ref: string;
  customerName: string;
  customerPhone: string;
  items: OrderLine[];
  total: number;
  createdAt: string;
  status: OrderStatus;
  notes?: string;
}

/* --------------------------- Maintenance ---------------------------- */

export type DeviceType = "laptop" | "desktop" | "phone" | "other";

export type ProblemCategory =
  | "hardware"
  | "software"
  | "performance"
  | "os"
  | "display"
  | "other";

export type MaintenanceStatus =
  | "new"
  | "in-review"
  | "repairing"
  | "ready"
  | "delivered"
  | "cancelled";

export interface MaintenanceRecord {
  id: string;
  ref: string;
  customerName: string;
  customerPhone: string;
  deviceType: DeviceType;
  deviceBrand?: string;
  deviceModel?: string;
  problemCategory: ProblemCategory;
  problemDescription: string;
  additionalNotes?: string;
  createdAt: string;
  status: MaintenanceStatus;
  adminNotes?: string;
}

/* ----------------------------- Settings ----------------------------- */

export interface StoreSettings {
  storeName: string;
  tagline: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  facebookUrl: string;
  tiktokUrl: string;
  address: string;
  businessDescription: string;
  logoUrl?: string;
  /** Show/hide the "Gaming PCs / تجميعات PC" category on the storefront */
  showBuildsCategory?: boolean;
}

/* ---------------------------- Repository ---------------------------- */

export interface ProductFilter {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: ProductAvailability[];
  /** Filter by exact brand name (e.g. "ASUS") */
  brand?: string;
  sort?: "newest" | "price-asc" | "price-desc" | "featured";
}
