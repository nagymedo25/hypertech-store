"use client";

/**
 * ============================================================
 * HYPER TECH — UI Store (transient interface state)
 * ============================================================
 * Cart drawer, mobile nav, search palette, mock admin session.
 * NOT persisted (except admin demo flag in sessionStorage).
 * ⚠️ The admin flag is a DEMO gate only — it provides zero real
 * security. Real auth belongs to Phase 02. It is honestly labeled
 * as such in the UI.
 * ============================================================
 */

import { create } from "zustand";

interface UIState {
  cartOpen: boolean;
  mobileNavOpen: boolean;
  searchOpen: boolean;
  adminAuthed: boolean;
  transitioning: boolean;
  setCartOpen: (v: boolean) => void;
  setMobileNavOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  setAdminAuthed: (v: boolean) => void;
  setTransitioning: (v: boolean) => void;
}

function initialAdminAuthed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem("hypertech-admin-demo") === "1";
  } catch {
    return false;
  }
}

export const useUIStore = create<UIState>((set) => ({
  cartOpen: false,
  mobileNavOpen: false,
  searchOpen: false,
  adminAuthed: initialAdminAuthed(),
  transitioning: false,
  setCartOpen: (v) => set({ cartOpen: v }),
  setMobileNavOpen: (v) => set({ mobileNavOpen: v }),
  setSearchOpen: (v) => set({ searchOpen: v }),
  setAdminAuthed: (v) => {
    try {
      if (typeof window !== "undefined") {
        if (v) window.sessionStorage.setItem("hypertech-admin-demo", "1");
        else window.sessionStorage.removeItem("hypertech-admin-demo");
      }
    } catch {
      /* storage unavailable */
    }
    set({ adminAuthed: v });
  },
  setTransitioning: (v) => set({ transitioning: v }),
}));
