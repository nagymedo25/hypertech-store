"use client";

/**
 * NotFoundView — elegant dead-end with way out (bad slug, etc.)
 */

import { Home, Store } from "lucide-react";
import { useRouterStore } from "@/lib/router";

export function NotFoundView({ what = "الصفحة" }: { what?: string }) {
  const navigate = useRouterStore((s) => s.navigate);
  return (
    <div className="mx-auto flex min-h-[70svh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="font-tech text-8xl font-bold text-silver select-none" style={{ transform: "skewX(-8deg)" }}>
        4<span className="text-electric">0</span>4
      </p>
      <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
        {what} مش موجودة… أو اتنقلت
      </h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        يمكن الرابط قديم أو المنتج اتشال من المتجر. متقلقش — عندك أماكن كويسة ترجع منها:
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => navigate({ name: "home" })}
          className="inline-flex items-center gap-2 rounded-2xl border border-hair bg-elevated px-5 py-3 text-sm font-bold transition-colors hover:border-foreground/25"
        >
          <Home className="h-4 w-4" />
          الرئيسية
        </button>
        <button
          onClick={() => navigate({ name: "store" })}
          className="glow-accent-sm inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95"
        >
          <Store className="h-4 w-4" />
          تصفّح المتجر
        </button>
      </div>
    </div>
  );
}
