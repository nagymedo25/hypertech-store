/**
 * ============================================================
 * HYPER TECH — Production Seeder (Neon + Cloudinary)
 * ============================================================
 * One-time migration script (run: `bun scripts/seed-neon.ts`):
 *   1. Collects every image URL referenced by the Phase-01 seed
 *      (remote searched photos + local generated studio shots).
 *   2. Uploads the actual bytes to THIS store's Cloudinary account
 *      (folder hypertech/store) — our own permanent copies.
 *   3. Inserts categories / products / builds / settings into Neon
 *      with the Cloudinary URLs, preserving Phase-01 ids.
 *   4. Provisions the initial administrator from env vars.
 *
 * Fictional demo orders & maintenance records are intentionally
 * NOT migrated (documented in PHASE_02_BACKEND_HANDOFF.md §3).
 *
 * Idempotent: skips when the catalog already exists (use --force
 * to wipe operational tables and re-seed).
 * ============================================================
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { createHash, randomBytes, scryptSync } from "crypto";
import { readFile, stat } from "fs/promises";
import path from "path";
import { seedCategories, seedProducts, seedBuilds, seedSettings } from "../src/lib/data/seed";

const db = new PrismaClient();

/* ------------------------- Cloudinary helpers ------------------------- */

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME!;
const KEY = process.env.CLOUDINARY_API_KEY!;
const SECRET = process.env.CLOUDINARY_API_SECRET!;

function signature(params: Record<string, string>): string {
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  return createHash("sha1").update(`${toSign}${SECRET}`).digest("hex");
}

async function cloudinaryUpload(
  bytes: Buffer,
  folder: string,
  publicId: string
): Promise<string | null> {
  const params: Record<string, string> = {
    folder,
    overwrite: "true",
    public_id: publicId,
    timestamp: String(Math.floor(Date.now() / 1000)),
  };
  const sig = signature(params);

  const form = new FormData();
  const ext = publicId.endsWith(".webp") ? "webp" : publicId.endsWith(".png") ? "png" : "jpg";
  form.append("file", new Blob([new Uint8Array(bytes)], { type: `image/${ext}` }), `${publicId}.${ext}`);
  form.append("api_key", KEY);
  for (const [k, v] of Object.entries(params)) form.append(k, v);
  form.append("signature", sig);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      console.warn(`  ! cloudinary ${res.status} for ${publicId}`);
      return null;
    }
    const data = (await res.json()) as { secure_url?: string };
    return data.secure_url ?? null;
  } catch (err) {
    console.warn(`  ! cloudinary upload failed for ${publicId}:`, err);
    return null;
  }
}

/* ------------------------- Source URL collection ------------------------- */

const PUB = path.resolve(__dirname, "../public");

async function loadBytes(url: string): Promise<Buffer | null> {
  try {
    if (url.startsWith("/")) {
      const p = path.join(PUB, url);
      if (!(await stat(p))) return null;
      return await readFile(p);
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function publicIdFor(url: string, i: number): string {
  const base = url.split("/").pop()?.split("?")[0]?.replace(/\.[^.]+$/, "") ?? "asset";
  return `${base}-${i}`.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 90);
}

/* ------------------------------- Main ------------------------------- */

async function main() {
  const force = process.argv.includes("--force");

  const existing = await db.product.count();
  if (existing > 0 && !force) {
    console.log(`Seed skipped — ${existing} products already in Neon (use --force to re-seed).`);
    await ensureAdmin();
    return;
  }

  if (force) {
    console.log("--force: wiping operational tables…");
    await db.product.deleteMany();
    await db.category.deleteMany();
    await db.pCBuild.deleteMany();
    await db.storeSettings.deleteMany();
  }

  /* 1. Collect every referenced image URL */
  const urlSet = new Set<string>();
  seedProducts.forEach((p) => p.images.forEach((u) => urlSet.add(u)));
  seedBuilds.forEach((b) => b.images.forEach((u) => urlSet.add(u)));
  seedCategories.forEach((c) => c.image && urlSet.add(c.image));

  const urls = [...urlSet];
  console.log(`Collecting ${urls.length} unique image URLs → Cloudinary…`);

  /* 2. Upload each to Cloudinary (concurrency 5) */
  const map = new Map<string, string>();
  const failed: string[] = [];
  let done = 0;

  const worker = async (queue: string[]) => {
    for (const url of queue) {
      const bytes = await loadBytes(url);
      const pid = publicIdFor(url, done);
      const uploaded = bytes ? await cloudinaryUpload(bytes, "hypertech/store", pid) : null;
      if (uploaded) map.set(url, uploaded);
      else failed.push(url);
      done++;
      if (done % 10 === 0) console.log(`  …${done}/${urls.length}`);
    }
  };

  const queues = Array.from({ length: 5 }, (_, i) => urls.filter((_, j) => j % 5 === i));
  await Promise.all(queues.map(worker));

  console.log(`Cloudinary migration: ${map.size}/${urls.length} uploaded, ${failed.length} kept as-is.`);
  if (failed.length) console.log("  kept original:", failed.slice(0, 10));

  const remap = (arr: string[]) => arr.map((u) => map.get(u) ?? u);

  /* 3. Insert into Neon */
  console.log("Inserting categories…");
  for (const c of seedCategories) {
    await db.category.create({
      data: {
        id: c.id,
        slug: c.slug,
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        image: map.get(c.image) ?? c.image,
        accent: c.accent,
        icon: c.icon,
        order: c.order,
        active: c.active ?? true,
      },
    });
  }

  console.log("Inserting products…");
  for (const p of seedProducts) {
    await db.product.create({
      data: {
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        shortDescription: p.shortDescription,
        description: p.description,
        price: p.price,
        oldPrice: p.oldPrice ?? null,
        promotionalLabel: p.promotionalLabel ?? null,
        categoryId: p.categoryId,
        images: remap(p.images) as unknown as Prisma.InputJsonValue,
        availability: p.availability,
        stockQty: p.stockQty,
        featured: p.featured,
        isNew: p.isNew,
        rating: p.rating,
        specs: p.specs as unknown as Prisma.InputJsonValue,
        specLayout: p.specLayout,
        createdAt: new Date(p.createdAt),
      },
    });
  }

  console.log("Inserting builds…");
  for (const b of seedBuilds) {
    await db.pCBuild.create({
      data: {
        id: b.id,
        slug: b.slug,
        title: b.title,
        type: b.type,
        description: b.description,
        images: remap(b.images) as unknown as Prisma.InputJsonValue,
        components: b.components as unknown as Prisma.InputJsonValue,
        totalPrice: b.totalPrice,
        availability: b.availability,
        performance: b.performance as unknown as Prisma.InputJsonValue,
        featured: b.featured,
      },
    });
  }

  console.log("Inserting settings…");
  await db.storeSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      storeName: seedSettings.storeName,
      tagline: seedSettings.tagline,
      whatsappNumber: seedSettings.whatsappNumber,
      whatsappDisplay: seedSettings.whatsappDisplay,
      facebookUrl: seedSettings.facebookUrl,
      tiktokUrl: seedSettings.tiktokUrl,
      address: seedSettings.address,
      businessDescription: seedSettings.businessDescription,
      logoUrl: seedSettings.logoUrl ?? null,
      showBuildsCategory: seedSettings.showBuildsCategory ?? true,
    },
    update: {
      storeName: seedSettings.storeName,
      tagline: seedSettings.tagline,
      whatsappNumber: seedSettings.whatsappNumber,
      whatsappDisplay: seedSettings.whatsappDisplay,
      facebookUrl: seedSettings.facebookUrl,
      tiktokUrl: seedSettings.tiktokUrl,
      address: seedSettings.address,
      businessDescription: seedSettings.businessDescription,
      logoUrl: seedSettings.logoUrl ?? null,
      showBuildsCategory: seedSettings.showBuildsCategory ?? true,
    },
  });

  await ensureAdmin();

  console.log(
    `\nSeeded → ${seedCategories.length} categories, ${seedProducts.length} products, ${seedBuilds.length} builds, settings singleton.`
  );
}

async function ensureAdmin() {
  const username = process.env.ADMIN_INITIAL_USERNAME?.trim();
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!username || !password) {
    console.warn("ADMIN_INITIAL_* env missing — no admin provisioned.");
    return;
  }
  const exists = await db.adminUser.findUnique({ where: { username } });
  if (exists) {
    console.log(`Admin already exists: ${username}`);
    return;
  }
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  await db.adminUser.create({
    data: { username, passwordHash: `scrypt$${salt.toString("hex")}$${hash.toString("hex")}` },
  });
  console.log(`Initial administrator provisioned: ${username}`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
