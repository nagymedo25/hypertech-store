"use client";

/**
 * ============================================================
 * HYPER TECH — Cart Store (Zustand + persist)
 * ============================================================
 * ⚠️ MOCK PERSISTENCE NOTICE:
 * localStorage here is a *frontend demo persistence layer only* —
 * it is NOT a database and NOT a source of truth for the business.
 * In Phase 02 the cart remains client state but checkout is sent
 * to the real backend (order persistence + verification).
 *
 * Task C — persistent "added to cart" panel state:
 * `lastAdded` + `panelOpen` drive the bottom confirmation sheet
 * (added-panel.tsx). They live inside the SAME persist entry so
 * the panel survives navigation, scrolling and full page refresh.
 * The custom `merge` below rehydrates OLD persisted carts (saved
 * before these fields existed) with safe closed-panel defaults.
 *
 * Hardware variants: Cart items with different configurations
 * (selectedRam / selectedStorage) are treated as distinct line items.
 * ============================================================
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "@/types";

/** Last add-to-cart event — powers the persistent confirmation panel */
export interface LastAdded {
  productId: string;
  qty: number;
  at: number;
  selectedRam?: string;
  selectedStorage?: string;
  unitPrice?: number;
}

export interface AddToCartOptions {
  qty?: number;
  selectedRam?: string;
  selectedStorage?: string;
  ramUpgradePrice?: number;
  storageUpgradePrice?: number;
  unitPrice?: number;
}

const matchItem = (
  item: CartItem,
  productId: string,
  selectedRam?: string,
  selectedStorage?: string
) =>
  item.productId === productId &&
  (item.selectedRam || "") === (selectedRam || "") &&
  (item.selectedStorage || "") === (selectedStorage || "");

interface CartState {
  items: CartItem[];
  /** آخر منتج تمت إضافته (يشغّل لوحة التأكيد السفلية) */
  lastAdded: LastAdded | null;
  /** اللوحة السفلة «تمت الإضافة إلى السلة» — مفتوحة حتى يغلقها المستخدم صراحةً */
  panelOpen: boolean;
  /** هل تم فتح السلة والاطلاع على عناصرها؟ عند الإضافة تصبح false لإظهار العداد */
  cartViewed: boolean;
  add: (
    productId: string,
    qtyOrOptions?: number | AddToCartOptions,
    maybeOptions?: AddToCartOptions
  ) => void;
  remove: (productId: string, selectedRam?: string, selectedStorage?: string) => void;
  setQty: (
    productId: string,
    qty: number,
    selectedRam?: string,
    selectedStorage?: string
  ) => void;
  clear: () => void;
  /** Mark a fresh add → sets lastAdded and opens (or re-triggers) the bottom panel */
  markAdded: (productId: string, qty: number, options?: AddToCartOptions) => void;
  setPanelOpen: (v: boolean) => void;
  markCartViewed: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      lastAdded: null,
      panelOpen: false,
      cartViewed: false,
      add: (productId, qtyOrOptions = 1, maybeOptions) =>
        set((s) => {
          let qty = 1;
          let opts: AddToCartOptions = {};

          if (typeof qtyOrOptions === "number") {
            qty = qtyOrOptions;
            opts = maybeOptions ?? {};
          } else if (typeof qtyOrOptions === "object" && qtyOrOptions !== null) {
            qty = qtyOrOptions.qty ?? 1;
            opts = qtyOrOptions;
          }

          const selectedRam = opts.selectedRam;
          const selectedStorage = opts.selectedStorage;
          const ramUpgradePrice = opts.ramUpgradePrice;
          const storageUpgradePrice = opts.storageUpgradePrice;
          const unitPrice = opts.unitPrice;

          const existingIdx = s.items.findIndex((i) =>
            matchItem(i, productId, selectedRam, selectedStorage)
          );

          if (existingIdx >= 0) {
            const updated = [...s.items];
            updated[existingIdx] = {
              ...updated[existingIdx],
              qty: Math.min(99, updated[existingIdx].qty + qty),
              unitPrice: unitPrice ?? updated[existingIdx].unitPrice,
              ramUpgradePrice: ramUpgradePrice ?? updated[existingIdx].ramUpgradePrice,
              storageUpgradePrice:
                storageUpgradePrice ?? updated[existingIdx].storageUpgradePrice,
            };
            return {
              cartViewed: false,
              items: updated,
            };
          }

          return {
            cartViewed: false,
            items: [
              ...s.items,
              {
                productId,
                qty,
                selectedRam,
                selectedStorage,
                ramUpgradePrice,
                storageUpgradePrice,
                unitPrice,
              },
            ],
          };
        }),
      remove: (productId, selectedRam, selectedStorage) =>
        set((s) => ({
          items: s.items.filter((i) => !matchItem(i, productId, selectedRam, selectedStorage)),
        })),
      setQty: (productId, qty, selectedRam, selectedStorage) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => !matchItem(i, productId, selectedRam, selectedStorage))
              : s.items.map((i) =>
                  matchItem(i, productId, selectedRam, selectedStorage)
                    ? { ...i, qty: Math.min(99, qty) }
                    : i
                ),
        })),
      /* إتمام الطلب/تفريغ السلة → اللوحة لا يجوز أن تبقى ظاهرة وتعتبر السلة مقروءة */
      clear: () => set({ items: [], lastAdded: null, panelOpen: false, cartViewed: true }),
      markAdded: (productId, qty, options) =>
        set({
          lastAdded: {
            productId,
            qty,
            at: Date.now(),
            selectedRam: options?.selectedRam,
            selectedStorage: options?.selectedStorage,
            unitPrice: options?.unitPrice,
          },
          panelOpen: true,
          cartViewed: false,
        }),
      setPanelOpen: (v) => set({ panelOpen: v }),
      markCartViewed: () => set({ cartViewed: true }),
    }),
    {
      name: "hypertech-cart-v1",
      storage: createJSONStorage(() => localStorage),
      /* Safe hydration for carts persisted BEFORE the panel fields
         existed: anything missing/malformed falls back to defaults. */
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as {
          items?: unknown;
          lastAdded?: {
            productId?: unknown;
            qty?: unknown;
            at?: unknown;
            selectedRam?: unknown;
            selectedStorage?: unknown;
            unitPrice?: unknown;
          };
          panelOpen?: unknown;
          cartViewed?: unknown;
        };
        const raw = p.lastAdded;
        const lastAdded: LastAdded | null =
          raw && typeof raw === "object" && typeof raw.productId === "string"
            ? {
                productId: raw.productId,
                qty: typeof raw.qty === "number" ? raw.qty : 1,
                at: typeof raw.at === "number" ? raw.at : Date.now(),
                selectedRam: typeof raw.selectedRam === "string" ? raw.selectedRam : undefined,
                selectedStorage:
                  typeof raw.selectedStorage === "string" ? raw.selectedStorage : undefined,
                unitPrice: typeof raw.unitPrice === "number" ? raw.unitPrice : undefined,
              }
            : null;
        return {
          ...current,
          items: Array.isArray(p.items) ? (p.items as CartItem[]) : current.items,
          lastAdded,
          panelOpen: typeof p.panelOpen === "boolean" ? p.panelOpen : false,
          cartViewed: typeof p.cartViewed === "boolean" ? p.cartViewed : false,
        };
      },
    }
  )
);

/** Derived helper: total item count (for header badge) */
export function cartCount(items: CartItem[]): number {
  return items.reduce((acc, i) => acc + i.qty, 0);
}
