/**
 * ============================================================
 * HYPER TECH — Public Bootstrap (GET /api/bootstrap)
 * ============================================================
 * Single hydration endpoint for the storefront: products,
 * categories, builds, store settings and the intelligent hero
 * pick. Also provisions the initial admin once per process.
 *
 * Performance:
 * In-memory server cache with 60-second TTL + instant invalidation
 * on mutations, eliminating Neon latency for client navigation.
 * ============================================================
 */

import { db } from "@/lib/db";
import { json, serverError } from "@/lib/server/http";
import { ensureAuthBooted } from "@/lib/server/auth";
import { toProduct, toCategory, toBuild, toSettings, pickHeroProduct } from "@/lib/server/serializers";

interface CachedPayload {
  data: any;
  timestamp: number;
}

let cachedBootstrap: CachedPayload | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export function invalidateBootstrapCache() {
  cachedBootstrap = null;
}

export async function GET() {
  try {
    // If cache is fresh, return immediately
    if (cachedBootstrap && Date.now() - cachedBootstrap.timestamp < CACHE_TTL_MS) {
      return json(cachedBootstrap.data, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          "X-Cache": "HIT",
        },
      });
    }

    await ensureAuthBooted();

    const [productRows, categoryRows, buildRows, settingsRow] = await Promise.all([
      db.product.findMany({ orderBy: { createdAt: "desc" } }),
      db.category.findMany({ orderBy: { order: "asc" } }),
      db.pCBuild.findMany({ orderBy: { createdAt: "desc" } }),
      db.storeSettings.findUnique({ where: { id: "singleton" } }),
    ]);

    const products = productRows.map(toProduct);
    const categories = categoryRows.map(toCategory);

    // Storefront hides inactive categories' products (builds category obeys settings)
    const activeCatIds = new Set(categories.filter((c) => c.active !== false).map((c) => c.id));
    const publicProducts = products.filter((p) => activeCatIds.has(p.categoryId));

    const payload = {
      products: publicProducts,
      categories,
      builds: buildRows.map(toBuild),
      settings: settingsRow ? toSettings(settingsRow) : null,
      hero: pickHeroProduct(publicProducts),
      serverTime: new Date().toISOString(),
    };

    cachedBootstrap = {
      data: payload,
      timestamp: Date.now(),
    };

    return json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    return serverError(err);
  }
}
