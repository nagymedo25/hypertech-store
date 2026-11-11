"use client";

/**
 * SearchPalette — ⌘K / Ctrl+K instant product search.
 * Full-text across name/brand/description with thumbnails,
 * category chips and keyboard navigation (cmdk).
 */

import { useEffect, useMemo, useState } from "react";
import { CommandDialog, CommandInput, CommandList, CommandEmpty } from "@/components/ui/command";
import { Search, CornerDownLeft } from "lucide-react";
import { useUIStore } from "@/lib/store/ui-store";
import { useRouterStore } from "@/lib/router";
import { useMockDB } from "@/lib/store/db-store";
import { formatPriceCompact } from "@/lib/format";

export function SearchPalette() {
  const open = useUIStore((s) => s.searchOpen);
  const setOpen = useUIStore((s) => s.setSearchOpen);
  const navigate = useRouterStore((s) => s.navigate);
  const products = useMockDB((s) => s.products);
  const categories = useMockDB((s) => s.categories);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!useUIStore.getState().searchOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  // Reset the query when the palette closes (via callback, not an effect)
  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) setQuery("");
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 8);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [query, products]);

  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange} className="glass">
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="ابحث عن لابتوب، كارت شاشة، كيبورد…"
        className="font-sans"
      />
      <CommandList className="max-h-[65svh]">
        <CommandEmpty className="py-10 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-faint" aria-hidden />
          <p className="text-sm text-muted-foreground">
            لا توجد نتائج مطابقة لـ «{query}»
          </p>
          <p className="mt-1 text-xs text-faint">جرّب كلمة مختلفة أو تصفح الفئات</p>
        </CommandEmpty>

        {!query && (
          <div className="px-2 pb-2 pt-1">
            <p className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-wider text-faint">
              مقترحات سريعة
            </p>
          </div>
        )}

        {results.map((p) => {
          const cat = catById.get(p.categoryId);
          return (
            <button
              key={p.id}
              onClick={() => {
                setOpen(false);
                navigate({ name: "product", slug: p.slug });
              }}
              className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-right transition-colors hover:bg-foreground/[0.05] aria-selected:bg-foreground/[0.05]"
            >
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-hair bg-elevated">
                { }
                <img
                  src={p.images[0]}
                  alt=""
                  className="h-full w-full object-cover img-grade"
                  loading="lazy"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{p.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {cat?.name} • {p.brand}
                </span>
              </span>
              <span className="shrink-0 font-tech text-sm font-semibold text-primary">
                {formatPriceCompact(p.price)}
                <span className="mr-1 text-[0.65rem] text-muted-foreground">ج.م</span>
              </span>
              <CornerDownLeft className="h-4 w-4 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          );
        })}

        {query && results.length > 0 && (
          <button
            onClick={() => {
              setOpen(false);
              navigate({ name: "store" });
            }}
            className="mt-1 w-full rounded-xl border border-hair px-3 py-2.5 text-center text-xs text-muted-foreground transition-colors hover:bg-foreground/[0.04]"
          >
            عرض كل المنتجات في المتجر ←
          </button>
        )}
      </CommandList>
    </CommandDialog>
  );
}
