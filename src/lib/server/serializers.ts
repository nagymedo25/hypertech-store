/**
 * ============================================================
 * HYPER TECH — Row ⇄ Domain serializers (server-only)
 * ============================================================
 * Prisma rows carry JSON columns + Date objects; the frontend
 * domain types (src/types) expect plain JSON-serializable data
 * (ISO strings, typed arrays). These mappers are the ONLY place
 * that translation happens, so API responses always match the
 * Phase-01 contract exactly — zero frontend type changes.
 * ============================================================
 */

import type {
  Category,
  MaintenanceRecord,
  OrderLine,
  OrderRecord,
  PCBuild,
  Product,
  StoreSettings,
} from "@/types";
import type {
  Category as CategoryRow,
  MaintenanceRecord as MaintenanceRow,
  OrderRecord as OrderRow,
  PCBuild as BuildRow,
  Product as ProductRow,
  StoreSettings as SettingsRow,
} from "@prisma/client";

/* JSON columns are `unknown` to TypeScript — narrow safely. */
const jsonArr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/* ----------------------------- Catalog ----------------------------- */

export function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    shortDescription: row.shortDescription,
    description: row.description,
    price: row.price,
    oldPrice: row.oldPrice ?? undefined,
    promotionalLabel: row.promotionalLabel ?? undefined,
    categoryId: row.categoryId,
    images: jsonArr<string>(row.images),
    availability: row.availability as Product["availability"],
    stockQty: row.stockQty,
    featured: row.featured,
    isNew: row.isNew,
    rating: row.rating,
    specs: jsonArr<Product["specs"][number]>(row.specs),
    specLayout: row.specLayout as Product["specLayout"],
    createdAt: row.createdAt.toISOString(),
  };
}

export function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    image: row.image,
    accent: row.accent,
    icon: row.icon,
    order: row.order,
    active: row.active,
  };
}

export function toBuild(row: BuildRow): PCBuild {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.type as PCBuild["type"],
    description: row.description,
    images: jsonArr<string>(row.images),
    components: jsonArr<PCBuild["components"][number]>(row.components),
    totalPrice: row.totalPrice,
    availability: row.availability as PCBuild["availability"],
    performance: jsonArr<PCBuild["performance"][number]>(row.performance),
    featured: row.featured,
  };
}

/* ----------------------------- Commerce ----------------------------- */

export function toOrder(row: OrderRow): OrderRecord {
  return {
    id: row.id,
    ref: row.ref,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    items: jsonArr<OrderLine>(row.items),
    total: row.total,
    createdAt: row.createdAt.toISOString(),
    status: row.status as OrderRecord["status"],
    notes: row.notes ?? undefined,
  };
}

export function toMaintenance(row: MaintenanceRow): MaintenanceRecord {
  return {
    id: row.id,
    ref: row.ref,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    deviceType: row.deviceType as MaintenanceRecord["deviceType"],
    deviceBrand: row.deviceBrand ?? undefined,
    deviceModel: row.deviceModel ?? undefined,
    problemCategory: row.problemCategory as MaintenanceRecord["problemCategory"],
    problemDescription: row.problemDescription,
    additionalNotes: row.additionalNotes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    status: row.status as MaintenanceRecord["status"],
    adminNotes: row.adminNotes ?? undefined,
  };
}

export function toSettings(row: SettingsRow): StoreSettings {
  return {
    storeName: row.storeName,
    tagline: row.tagline,
    whatsappNumber: row.whatsappNumber,
    whatsappDisplay: row.whatsappDisplay,
    facebookUrl: row.facebookUrl,
    tiktokUrl: row.tiktokUrl,
    address: row.address,
    businessDescription: row.businessDescription,
    logoUrl: row.logoUrl ?? undefined,
    showBuildsCategory: row.showBuildsCategory,
  };
}

/* ------------------------ Hero product picker ------------------------ */

/**
 * Intelligent hero selection:
 *   featured + in-stock + has-image products first (laptops preferred),
 *   then any in-stock + has-image product with the richest specs,
 *   then featured in low-stock, then anything featured.
 * Deterministic (stable order) so the hero doesn't flicker
 * between reloads with identical data.
 */
export function pickHeroProduct(products: Product[]): Product | null {
  if (!products.length) return null;

  const hasImage = (p: Product) => p.images.length > 0;
  const buyable = (p: Product) => p.availability === "in-stock" || p.availability === "low-stock";
  const specRichness = (p: Product) => p.specs.length * 10 + (p.description?.length ?? 0) / 200;
  const laptopCat = (p: Product) => p.categoryId.toLowerCase().includes("laptop");

  const pool = products.filter(hasImage);
  if (!pool.length) return null;

  const tiers: Product[][] = [
    pool.filter((p) => p.featured && buyable(p) && laptopCat(p)),
    pool.filter((p) => p.featured && buyable(p)),
    pool.filter((p) => buyable(p) && laptopCat(p)),
    pool.filter(buyable),
    pool.filter((p) => p.featured),
    pool,
  ];

  for (const tier of tiers) {
    if (!tier.length) continue;
    return [...tier].sort(
      (a, b) =>
        specRichness(b) - specRichness(a) ||
        +new Date(b.createdAt) - +new Date(a.createdAt)
    )[0];
  }
  return null;
}
