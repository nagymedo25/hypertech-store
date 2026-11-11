"use client";

/**
 * ============================================================
 * BRANDS — "سجلّ الماركات" · the trusted register band.
 * ============================================================
 * A full-bleed editorial band between Best Sellers and Trust:
 *
 *   • Warm raised surface + drafting grid + hairline frame — the
 *     only "band" on the page, so it reads as a distinct register,
 *     not another floating card grid.
 *   • The big three (HP · Dell · ASUS — by catalog priority) become
 *     display plates with authentic TYPOGRAPHIC wordmarks, not faked
 *     logos: HP's round badge, Dell's tilted E that straightens on
 *     hover, ASUS's tracked caps that focus on hover. Monochrome
 *     charcoal — restrained, no saturation.
 *   • Remaining brands live in a typographic ledger row; every
 *     entry is real (derived live from the catalog counts).
 *   • GSAP choreography: plates rise staggered, the register
 *     hairline draws itself right-to-left, product counts count up
 *     in Arabic-Indic numerals, a ghost wordmark drifts in, and a
 *     sheen sweeps each plate on hover. Reduced-motion respected.
 * ============================================================
 */

import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowLeft, Apple } from "lucide-react";
import { SectionHeading } from "@/components/store/section-heading";
import { useMockDB } from "@/lib/store/db-store";
import { useRouterStore } from "@/lib/router";
import { EASE, prefersReducedMotion } from "@/lib/motion";

/** Brands explicitly requested for the storefront, then by catalog presence */
const PRIORITY_BRANDS = ["HP", "Dell", "ASUS", "Lenovo", "Apple", "Acer", "Logitech", "Kingston", "Razer", "Corsair"];

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const arDigits = (n: number) => String(n).replace(/\d/g, (d) => AR_DIGITS[Number(d)]);
const countWord = (n: number) => (n === 1 ? "منتج" : n === 2 ? "منتجان" : "منتجات");

type Brand = { name: string; count: number };

export function BrandsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const products = useMockDB((s) => s.products);
  const navigate = useRouterStore((s) => s.navigate);

  const { featured, rest } = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1));
    const priority = PRIORITY_BRANDS.filter((b) => counts.has(b));
    const others = [...counts.keys()]
      .filter((b) => !PRIORITY_BRANDS.includes(b))
      .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0));
    const all: Brand[] = [...priority, ...others]
      .slice(0, 10)
      .map((b) => ({ name: b, count: counts.get(b) ?? 0 }));
    return { featured: all.slice(0, 3), rest: all.slice(3) };
  }, [products]);

  /* ------------------- GSAP choreography ------------------- */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);

    const counters = Array.from(el.querySelectorAll<HTMLElement>("[data-brand-count]"));
    const setCountersFinal = () =>
      counters.forEach((c) => {
        c.textContent = arDigits(Number(c.dataset.target ?? 0));
      });

    if (prefersReducedMotion()) {
      setCountersFinal();
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: "top 76%", toggleActions: "play none none none" },
      });

      tl
        // Ghost wordmark drifts in — the register's watermark
        .fromTo(
          "[data-brand-ghost]",
          { xPercent: 5, opacity: 0 },
          { xPercent: 0, opacity: 1, duration: 1.6, ease: "power2.out" },
          0
        )
        // Display plates rise with a settle
        .fromTo(
          "[data-brand-plate]",
          { y: 54, opacity: 0, scale: 0.955 },
          { y: 0, opacity: 1, scale: 1, duration: 0.85, stagger: 0.11, ease: EASE.expo },
          0.08
        )
        // The register hairline draws itself (RTL: from the right)
        .fromTo(
          "[data-brand-rule]",
          { scaleX: 0 },
          { scaleX: 1, duration: 1.0, ease: "power3.inOut" },
          0.55
        )
        // Ledger entries settle in
        .fromTo(
          "[data-brand-ledger-item]",
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: EASE.out },
          0.78
        )
        // Product counts count up (Arabic-Indic numerals)
        .fromTo(
          counters,
          { textContent: 0 },
          {
            textContent: (_i, t) => Number((t as HTMLElement).dataset.target ?? 0),
            duration: 1.3,
            ease: "power2.out",
            snap: { textContent: 1 },
            onUpdate: function () {
              counters.forEach((c) => {
                const n = Number(c.textContent?.replace(/[^\d]/g, "") ?? 0);
                c.textContent = arDigits(n);
              });
            },
          },
          0.5
        );
    }, el);

    return () => ctx.revert();
  }, [featured, rest]);

  if (featured.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="brands"
      aria-labelledby="brands-title"
      className="relative overflow-hidden border-y border-hair bg-raised"
    >
      {/* Drafting grid — faded toward the edges so it never fights the type */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid-fine opacity-70 [mask-image:radial-gradient(ellipse_78%_72%_at_50%_42%,black_30%,transparent_100%)]"
      />
      {/* Ghost watermark — the register's seal, bled intentionally
          off the band's top edge (editorial crop, never clipped mid-glyph
          by the ledger below) */}
      <span
        data-brand-ghost
        aria-hidden
        dir="ltr"
        className="pointer-events-none absolute -top-[1.5vw] left-[2%] select-none whitespace-nowrap font-tech text-[13vw] font-bold uppercase leading-none tracking-tighter text-foreground/[0.035]"
      >
        Trusted
      </span>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
        <SectionHeading
          titleId="brands-title"
          kicker="العلامات التجارية"
          title="ماركات"
          accentWord="نثق فيها"
          description="أقوى أسماء التقنية اللي بنتعامل معاها فعليًا — كل ماركة هنا ليها منتجات متوفرة في المتجر، اضغط عليها وتصفّح مخصّص ليها."
        />

        {/* ============ The big three — display plates ============ */}
        {/* Mobile: snap carousel whose peek dissolves through a left-edge
            fade mask (RTL scroll direction) instead of hard-clipping text */}
        <div
          role="list"
          aria-label="أبرز الماركات"
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [mask-image:linear-gradient(to_left,black_88%,transparent_100%)] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 sm:[mask-image:none] lg:gap-6 [&::-webkit-scrollbar]:hidden"
        >
          {featured.map((b, i) => (
            <div role="listitem" key={b.name} className="w-[78%] shrink-0 snap-center sm:w-auto">
              <button
                data-brand-plate
                onClick={() => navigate({ name: "store", brand: b.name })}
                className="group relative flex w-full flex-col overflow-hidden rounded-[1.6rem] border border-hair bg-elevated text-right shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/35 hover:shadow-card-lg"
                aria-label={`تصفح منتجات ${b.name}`}
              >
                {/* Gallery sheen — sweeps the plate on hover (RTL direction).
                    Warm-dark gloss, visible against the white plate. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -right-1/3 z-10 w-1/3 -skew-x-12 bg-gradient-to-l from-transparent via-foreground/[0.07] to-transparent opacity-0 transition-all duration-700 ease-out group-hover:-translate-x-[420%] group-hover:opacity-100"
                />

                {/* Register index — editorial numeral, ties the trio
                    into one system and anchors the corner */}
                <span
                  aria-hidden
                  dir="ltr"
                  className="absolute right-5 top-3.5 font-tech text-xl font-bold tabular-nums text-foreground/[0.08] transition-colors duration-500 group-hover:text-primary/25"
                >
                  0{i + 1}
                </span>

                {/* Wordmark stage */}
                <span className="relative grid min-h-[7rem] flex-1 place-items-center px-6 pb-6 pt-10 sm:min-h-[7.75rem]">
                  <BigWordmark name={b.name} />
                </span>

                {/* Meta bar — count + browse affordance */}
                <span className="relative flex items-center justify-between border-t border-hair/70 bg-surface/70 px-5 py-4">
                  <span className="flex items-center gap-1.5">
                    <span
                      data-brand-count
                      data-target={b.count}
                      className="font-tech text-lg font-bold tabular-nums leading-none text-foreground"
                    >
                      {arDigits(b.count)}
                    </span>
                    <span className="text-xs font-medium leading-none text-muted-foreground">{countWord(b.count)}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[0.8rem] font-bold text-primary">
                    تصفح
                    <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                  </span>
                </span>
              </button>
            </div>
          ))}
        </div>

        {/* ============ The register — remaining brands ============ */}
        {rest.length > 0 && (
          <>
            <div data-brand-rule aria-hidden className="hairline-x mt-12 origin-right sm:mt-14" />
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:mt-8">
              {rest.map((b) => (
                <button
                  key={b.name}
                  data-brand-ledger-item
                  onClick={() => navigate({ name: "store", brand: b.name })}
                  className="group inline-flex items-center gap-3"
                  aria-label={`تصفح منتجات ${b.name}`}
                >
                  <LedgerWordmark name={b.name} />
                  <span className="whitespace-nowrap rounded-full border border-hair bg-elevated px-2.5 py-0.5 text-[0.62rem] font-semibold tabular-nums text-faint transition-colors duration-300 group-hover:border-primary/30 group-hover:text-primary">
                    {arDigits(b.count)} {countWord(b.count)}
                  </span>
                </button>
              ))}
            </div>

            {/* Quiet closing link — completes the band's rhythm */}
            <div className="mt-10 sm:mt-12">
              <div aria-hidden className="hairline-x mx-auto max-w-xs opacity-60" />
              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate({ name: "store" })}
                  className="group inline-flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-foreground"
                >
                  كل الماركات في الكتالوج
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ================================================================
 * Wordmarks — authentic typographic treatments, monochrome.
 * These evoke each brand's typographic identity without faking
 * logos: HP's round badge, Dell's tilted E, ASUS's tracked caps,
 * Acer's lowercase, Apple's glyph. All hover states resolve to
 * the refined cobalt brand accent.
 * ================================================================ */

function BigWordmark({ name }: { name: string }) {
  switch (name) {
    // HP — the round badge (outlined at rest, ignites on hover so it
    //     weighs the same as the bare Dell/ASUS wordmarks)
    case "HP":
      return (
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border-[1.5px] border-foreground/55 bg-transparent text-foreground transition-[background-color,border-color,color] duration-500 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground sm:h-16 sm:w-16">
          <span className="font-tech text-[1.2rem] font-bold lowercase leading-none tracking-tight sm:text-[1.35rem]" dir="ltr">
            hp
          </span>
        </span>
      );

    // Dell — D + tilted E + LL; the E straightens on hover
    case "Dell":
      return (
        <span
          className="font-tech text-[1.75rem] font-bold uppercase tracking-[0.05em] text-foreground/85 transition-colors duration-500 group-hover:text-primary sm:text-[2.05rem]"
          dir="ltr"
        >
          D
          <span className="inline-block origin-bottom rotate-[12deg] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-0">
            E
          </span>
          LL
        </span>
      );

    // ASUS — tracked caps that focus on hover
    case "ASUS":
      return (
        <span
          className="font-tech text-[1.9rem] font-bold uppercase text-foreground/85 tracking-[0.22em] transition-[letter-spacing,color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:tracking-[0.08em] group-hover:text-primary sm:text-[2.25rem]"
          dir="ltr"
        >
          ASUS
        </span>
      );

    // Apple — glyph + wordmark
    case "Apple":
      return (
        <span className="inline-flex items-center gap-3 text-foreground/85 transition-colors duration-500 group-hover:text-primary" dir="ltr">
          <Apple className="h-9 w-9" strokeWidth={1.5} aria-hidden />
          <span className="font-tech text-[1.9rem] font-bold leading-none sm:text-[2.2rem]">Apple</span>
        </span>
      );

    // Default display wordmark
    default:
      return (
        <span
          className="font-tech text-[1.75rem] font-bold text-foreground/85 transition-colors duration-500 group-hover:text-primary sm:text-[2.1rem]"
          dir="ltr"
        >
          {name}
        </span>
      );
  }
}

function LedgerWordmark({ name }: { name: string }) {
  if (name === "Apple") {
    return (
      <span className="inline-flex items-center gap-1.5 text-foreground/70 transition-colors duration-300 group-hover:text-primary" dir="ltr">
        <Apple className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        <span className="font-tech text-[0.95rem] font-bold">Apple</span>
      </span>
    );
  }
  if (name === "Acer") {
    return (
      <span className="font-tech text-[0.95rem] font-bold lowercase text-foreground/70 transition-colors duration-300 group-hover:text-primary" dir="ltr">
        acer
      </span>
    );
  }
  if (name === "Razer" || name === "Corsair" || name === "Kingston" || name === "Western Digital" || name === "HyperX") {
    return (
      <span
        className="font-tech text-[0.78rem] font-bold uppercase tracking-[0.13em] text-foreground/70 transition-colors duration-300 group-hover:text-primary"
        dir="ltr"
      >
        {name}
      </span>
    );
  }
  return (
    <span className="font-tech text-[0.95rem] font-bold text-foreground/70 transition-colors duration-300 group-hover:text-primary" dir="ltr">
      {name}
    </span>
  );
}
