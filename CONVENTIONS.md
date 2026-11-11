# HYPER TECH — Frontend Conventions (READ FIRST)

Single-page Arabic RTL dark-mode commerce experience inside ONE Next.js route (`/`).
Hash-based virtual router. GSAP motion. Mock data layer ready for Phase-02 backend swap.

## Language & Tone
- Arabic (Egyptian-friendly, respectful, energetic). NO Lorem Ipsum. NO English UI strings (Latin allowed for brand/tech terms like `RTX 4060`).
- Copy tone: "كلمنا واتساب", "شغّل مستواك التالي", "جاهز للانطلاق ⚡".

## Files & Folders
- Views live in `src/components/<area>/<name>-view.tsx` and are lazy-loaded by `src/components/app/hyper-app.tsx`.
- Shared components: `src/components/store/*` (ProductCard, CategoryCard, SectionHeading, catalog-atoms), `src/components/builds/build-card.tsx`, `src/components/layout/*` (ViewHeader, NotFoundView).
- Motion primitives: `src/components/motion/*` — `Reveal`, `StaggerReveal` (reveal.tsx), `AnimatedNumber`, `Magnetic`, `Tilt`, `Parallax` (micro-interactions.tsx).
- NEVER import from `react` server-only APIs. All views are `"use client"`.

## Data Access (MANDATORY)
- Read catalog reactively: `const products = useMockDB((s) => s.products)` from `@/lib/store/db-store`. Same for `categories`, `builds`, `orders`, `maintenanceRequests`, `settings`.
- Mutations go through async repositories from `@/lib/repositories` (they wrap the store with simulated latency → show pending states): `repositories.products.create(input)`, `repositories.categories.update(id, patch)`, etc.
- Types from `@/types` — NEVER hardcode category names/slugs in UI; always read from the store (dynamic categories mandate).
- Loading states: brief skeleton (`shimmer` class) while repository promises resolve. Simulated latency is intentional.

## Router
```tsx
import { useRouterStore } from "@/lib/router";
const navigate = useRouterStore((s) => s.navigate);
navigate({ name: "store", categorySlug: "laptops" });
navigate({ name: "product", slug: p.slug });
navigate({ name: "build", slug: b.slug });
navigate({ name: "builds" }); navigate({ name: "cart" }); navigate({ name: "checkout" });
navigate({ name: "maintenance" }); navigate({ name: "admin", section: "products" });
```
Bad slug → render `<NotFoundView what="المنتج" />` from `@/components/layout/not-found`.

## Cart
```tsx
import { useCartStore } from "@/lib/store/cart-store";
const add = useCartStore((s) => s.add); const items = useCartStore((s) => s.items);
add(productId, qty);
```
Toast feedback: `import { toast } from "sonner"` → `toast.success("...")`.

## WhatsApp (centralized — never hardcode numbers)
```tsx
import { whatsappUrl } from "@/lib/config"; // generic
import { productWhatsAppUrl, buildWhatsAppUrl, orderWhatsAppUrl, maintenanceWhatsAppUrl } from "@/lib/whatsapp";
```
Opening WhatsApp ≠ order submitted — copy must stay honest ("إتمام الطلب عبر واتساب", NOT "تم إرسال الطلب بنجاح" unless describing the WhatsApp redirect itself).

## Styling Rules
- Tailwind 4 utility classes + design tokens. Colors: `bg-background`, `bg-surface`, `bg-elevated`, `bg-raised`, `text-foreground`, `text-muted-foreground`, `text-faint`, `text-primary`, `border-hair`, `text-amber`, `text-mint`, `text-danger`.
- NO indigo/purple theme colors. Blue accent `#2196F3` (primary) is brand-derived. Category accents come from `category.accent` (data).
- Typography: `font-display` (Changa headlines), `font-ruqaa` (Aref Ruqaa calligraphic accents), `font-sans` (Readex Pro body — default), `font-tech` (Space Grotesk numerals/Latin).
- Metallic display text: class `text-silver`. Electric gradient text: `text-electric`.
- Effects: `glass`, `glow-accent`, `glow-accent-sm`, `bg-grid`, `bg-noise`, `orb-glow`, `hairline-x`, `clip-slant-t`, `img-grade`, `shimmer`.
- Buttons/CTAs: rounded-2xl, `bg-primary text-primary-foreground`, hover `glow-accent-sm`, press `active:scale-95/98`.
- Prices: `<PriceTag price oldPrice size />` from `@/components/store/catalog-atoms`. Availability: `<AvailabilityBadge status />`.
- Section headers: `<SectionHeading kicker title accentWord description />` (word-safe Arabic GSAP reveal).
- Inner page headers: `<ViewHeader kicker title accentWord description accent>`.

## Motion Rules
- GSAP only for complex timelines; CSS transitions for hovers.
- Scroll entrances: wrap in `<Reveal dir="up|start|scale|clip">`; grids: `<StaggerReveal>`.
- Arabic text animation: NEVER split characters — words only (already handled by SectionHeading/ViewHeader via `splitWordsSafe`).
- Always cleanup: `gsap.context(...)` + `ctx.revert()` in effect return.
- Respect reduced motion: primitives handle it; manual timelines must check `prefersReducedMotion()` from `@/lib/motion`.

## Accessibility
- Semantic `main/section/nav/ul`, `aria-label` on icon buttons, visible focus (global focus-visible ring exists), 44px touch targets, `role="dialog"` for custom overlays.
- Images: `alt` in Arabic (product name), `loading="lazy"`.

## Performance
- `<img>` tags are fine for remote URLs (next/image is not used for external OSS URLs). Use `loading="lazy"`.
- Lists: cap initial render, no heavy effects on scroll for mobile (`window.matchMedia("(hover: none)")` guards exist in primitives).

## Mock Data Notes
- Orders & maintenance records contain FICTIONAL demo data — admin UI must show a visible "وضع تجريبي" indicator.
- Products/prices are simulated market data (labeled في الواجهة عند الحاجة).
