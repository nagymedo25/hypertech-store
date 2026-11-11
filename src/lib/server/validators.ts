/**
 * ============================================================
 * HYPER TECH — API Validation (server-only, zod)
 * ============================================================
 * Shared mutation schemas — mirrors of the frontend form
 * contracts (PHASE_02_BACKEND_HANDOFF.md §5).
 * ============================================================
 */

import { z } from "zod";

export const specItemSchema = z.object({
  label: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(300),
});

export const availabilityEnum = z.enum(["in-stock", "low-stock", "out-of-stock", "pre-order"]);
export const specLayoutEnum = z.enum(["device", "component", "accessory"]);

export const productInputSchema = z.object({
  name: z.string().trim().min(3).max(200),
  brand: z.string().trim().min(1).max(80),
  shortDescription: z.string().trim().min(3).max(300),
  description: z.string().trim().min(3).max(4000),
  price: z.number().min(0).max(10_000_000),
  oldPrice: z.number().min(0).max(10_000_000).nullable().optional(),
  promotionalLabel: z.string().trim().max(120).nullable().optional(),
  categoryId: z.string().trim().min(1).max(100),
  images: z.array(z.string().trim().min(1).max(2000)).max(12).default([]),
  availability: availabilityEnum.default("in-stock"),
  stockQty: z.number().int().min(0).max(100_000).default(0),
  featured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  rating: z.number().min(0).max(5).default(0),
  specs: z.array(specItemSchema).max(30).default([]),
  specLayout: specLayoutEnum.default("device"),
  heroEligible: z.boolean().default(true),
});

export const productPatchSchema = productInputSchema.partial();

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(80).optional(),
  tagline: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(2000),
  image: z.string().trim().min(1).max(2000),
  accent: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().trim().min(1).max(60),
  order: z.number().int().min(0).max(999).optional(),
  active: z.boolean().optional(),
});

export const categoryPatchSchema = categoryInputSchema.partial();

export const buildComponentSchema = z.object({
  id: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(160),
  spec: z.string().trim().max(200).optional(),
  qty: z.number().int().min(1).max(99),
  price: z.number().min(0).max(10_000_000).optional(),
});

export const buildInputSchema = z.object({
  title: z.string().trim().min(3).max(160),
  slug: z.string().trim().max(160).optional(),
  type: z.enum(["gaming", "workstation", "budget", "creator"]),
  description: z.string().trim().min(3).max(3000),
  images: z.array(z.string().trim().min(1).max(2000)).max(12).default([]),
  components: z.array(buildComponentSchema).max(40).default([]),
  totalPrice: z.number().min(0).max(10_000_000).default(0),
  availability: availabilityEnum.default("in-stock"),
  performance: z
    .array(z.object({ label: z.string().trim().min(1).max(60), score: z.number().min(0).max(100) }))
    .max(12)
    .default([]),
  featured: z.boolean().default(false),
});

export const buildPatchSchema = buildInputSchema.partial();

export const orderStatusEnum = z.enum(["new", "contacted", "confirmed", "completed", "cancelled"]);

export const orderPatchSchema = z.object({
  status: orderStatusEnum.optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const maintenanceStatusEnum = z.enum([
  "new",
  "in-review",
  "repairing",
  "ready",
  "delivered",
  "cancelled",
]);

export const maintenancePatchSchema = z.object({
  status: maintenanceStatusEnum.optional(),
  adminNotes: z.string().trim().max(2000).nullable().optional(),
});

/* ------------------------- Public submissions ------------------------- */

export const orderSubmitSchema = z.object({
  customerName: z.string().trim().min(3).max(120),
  customerPhone: z.string().trim().regex(/^01[0-9]{9}$/, "رقم موبايل مصري غير صالح"),
  notes: z.string().trim().max(300).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1).max(100),
        qty: z.number().int().min(1).max(99),
      })
    )
    .min(1, "السلة فاضية"),
});

export const maintenanceSubmitSchema = z.object({
  customerName: z.string().trim().min(3).max(120),
  customerPhone: z.string().trim().regex(/^01[0-9]{9}$/, "رقم موبايل مصري غير صالح"),
  deviceType: z.enum(["laptop", "desktop", "phone", "other"]),
  deviceBrand: z.string().trim().max(80).optional(),
  deviceModel: z.string().trim().max(80).optional(),
  problemCategory: z.enum(["hardware", "software", "performance", "os", "display", "other"]),
  problemDescription: z.string().trim().min(20).max(3000),
  additionalNotes: z.string().trim().max(2000).optional(),
});

export const settingsPatchSchema = z.object({
  storeName: z.string().trim().min(2).max(120).optional(),
  tagline: z.string().trim().min(2).max(200).optional(),
  whatsappNumber: z.string().trim().regex(/^\d{8,15}$/, "رقم واتساب غير صالح (أرقام فقط)").optional(),
  whatsappDisplay: z.string().trim().min(3).max(40).optional(),
  facebookUrl: z.string().trim().url().max(300).optional(),
  tiktokUrl: z.string().trim().url().max(300).optional(),
  address: z.string().trim().min(3).max(300).optional(),
  businessDescription: z.string().trim().min(3).max(2000).optional(),
  logoUrl: z.string().trim().url().max(2000).nullable().optional(),
  showBuildsCategory: z.boolean().optional(),
});

/** Format zod issues into a single readable Arabic-ish message. */
export function zodMessage(err: z.ZodError): string {
  const first = err.issues[0];
  if (!first) return "بيانات غير صالحة";
  const path = first.path.join(".");
  return `${first.message}${path ? ` (${path})` : ""}`;
}
