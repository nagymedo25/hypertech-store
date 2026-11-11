/**
 * ============================================================
 * HYPER TECH — WhatsApp message builders
 * ============================================================
 * Prepares professional Arabic messages for the click-to-chat
 * journey. NOTE (honesty contract): opening WhatsApp does NOT
 * prove the business received/accepted an order — the UI copy
 * reflects that. No fake "order submitted" success states.
 * ============================================================
 */

import { BUSINESS, whatsappUrl } from "@/lib/config";
import type { CartItem, CustomerInfo, MaintenanceRecord, Product } from "@/types";
import { formatPrice } from "@/lib/format";

const LINE = "────────────────────";

/* -------------------------- Order message --------------------------- */

export interface OrderMessageInput {
  items: (CartItem & { product: Product })[];
  subtotal: number;
  customer: CustomerInfo;
}

/**
 * Builds the professional Arabic order message sent to the store's
 * WhatsApp when a customer completes the cart checkout.
 */
export function buildOrderMessage({ items, subtotal, customer }: OrderMessageInput): string {
  const lines: string[] = [];

  lines.push("🛒 *طلب جديد — هايبر تك*");
  lines.push(LINE);

  lines.push("");
  lines.push("*المنتجات المطلوبة:*");
  items.forEach((entry, i) => {
    const { product, qty } = entry;
    const total = product.price * qty;
    lines.push(
      `${i + 1}. ${product.name}`,
      `   الكمية: ${qty} × ${formatPrice(product.price)} = ${formatPrice(total)}`
    );
  });

  lines.push("");
  lines.push(LINE);
  lines.push(`*الإجمالي: ${formatPrice(subtotal)}*`);

  lines.push("");
  lines.push("*بيانات العميل:*");
  lines.push(`👤 الاسم: ${customer.name}`);
  lines.push(`📱 الهاتف: ${customer.phone}`);
  if (customer.notes?.trim()) {
    lines.push(`📝 ملاحظات: ${customer.notes.trim()}`);
  }

  lines.push("");
  lines.push("برجاء تأكيد الطلب وتفاصيل الدفع والتوصيل. شكرًا لثقتكم في هايبر تك ⚡");

  return lines.join("\n");
}

/** Returns the ready-to-open wa.me URL for a cart order */
export function orderWhatsAppUrl(input: OrderMessageInput): string {
  return whatsappUrl(buildOrderMessage(input));
}

/* --------------------- Single product quick order -------------------- */

export function buildProductMessage(product: Product, qty = 1): string {
  const lines: string[] = [];
  lines.push("⚡ *استفسار عن منتج — هايبر تك*");
  lines.push(LINE);
  lines.push("");
  lines.push(`🏷️ *${product.name}*`);
  if (product.brand) lines.push(`الماركة: ${product.brand}`);
  lines.push(`الكمية: ${qty}`);
  lines.push(`السعر: ${formatPrice(product.price)}${qty > 1 ? ` × ${qty}` : ""}`);
  lines.push("");
  lines.push("مهتم بشراء المنتج ده، ينفع تفاصيل أكتر عن التوفر والدفع؟");
  return lines.join("\n");
}

export function productWhatsAppUrl(product: Product, qty = 1): string {
  return whatsappUrl(buildProductMessage(product, qty));
}

/* -------------------------- Build inquiry ---------------------------- */

import type { PCBuild } from "@/types";

export function buildBuildMessage(build: PCBuild): string {
  const lines: string[] = [];
  lines.push("🖥️ *استفسار عن تجميعة — هايبر تك*");
  lines.push(LINE);
  lines.push("");
  lines.push(`*${build.title}*`);
  lines.push(`السعر الإجمالي: ${formatPrice(build.totalPrice)}`);
  lines.push("");
  lines.push("*المكونات:*");
  build.components.forEach((c) => {
    lines.push(`• ${c.role}: ${c.name}${c.spec ? ` — ${c.spec}` : ""}`);
  });
  lines.push("");
  lines.push("عايز أعرف تفاصيل التجميعة وإمكانية التعديل عليها. شكرًا 👌");
  return lines.join("\n");
}

export function buildWhatsAppUrl(build: PCBuild): string {
  return whatsappUrl(buildBuildMessage(build));
}

/* ----------------------- Maintenance request ------------------------- */

export function buildMaintenanceMessage(
  data: Omit<MaintenanceRecord, "id" | "ref" | "createdAt" | "status" | "adminNotes">
): string {
  const deviceTypeLabels: Record<string, string> = {
    laptop: "لابتوب",
    desktop: "كمبيوتر مكتبي",
    phone: "هاتف",
    other: "جهاز آخر",
  };
  const problemLabels: Record<string, string> = {
    hardware: "عطل هاردوير",
    software: "مشكلة سوفتوير",
    performance: "بطء وضعف أداء",
    os: "نظام تشغيل",
    display: "شاشة / عرض",
    other: "أخرى",
  };

  const lines: string[] = [];
  lines.push("🛠️ *طلب صيانة — هايبر تك*");
  lines.push(LINE);
  lines.push("");
  lines.push("*بيانات العميل:*");
  lines.push(`👤 الاسم: ${data.customerName}`);
  lines.push(`📱 الهاتف: ${data.customerPhone}`);
  lines.push("");
  lines.push("*بيانات الجهاز:*");
  lines.push(`💻 نوع الجهاز: ${deviceTypeLabels[data.deviceType]}`);
  if (data.deviceBrand) lines.push(`الماركة: ${data.deviceBrand}`);
  if (data.deviceModel) lines.push(`الموديل: ${data.deviceModel}`);
  lines.push("");
  lines.push("*تفاصيل المشكلة:*");
  lines.push(`🔧 التصنيف: ${problemLabels[data.problemCategory]}`);
  lines.push(`📝 الوصف: ${data.problemDescription}`);
  if (data.additionalNotes?.trim()) {
    lines.push("");
    lines.push(`ملاحظات إضافية: ${data.additionalNotes.trim()}`);
  }
  lines.push("");
  lines.push("برجاء الرد عليّا لتحديد تفاصيل الفحص والصيانة. شكرًا 🙏");
  return lines.join("\n");
}

export function maintenanceWhatsAppUrl(
  data: Omit<MaintenanceRecord, "id" | "ref" | "createdAt" | "status" | "adminNotes">
): string {
  return whatsappUrl(buildMaintenanceMessage(data));
}

/* --------------------------- Guard helper ---------------------------- */

/** Human feedback when the WhatsApp number is not configured yet */
export function whatsappConfigured(): boolean {
  return /^\d{10,15}$/.test(BUSINESS.whatsappNumber);
}
