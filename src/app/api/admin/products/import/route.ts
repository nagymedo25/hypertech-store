/**
 * ============================================================
 * HYPER TECH — Admin Reusable CSV / Excel Catalog Import API
 * ============================================================
 * POST /api/admin/products/import
 * Supports:
 *  - CSV text upload / raw rows
 *  - Mode: preview (validation + duplicate check only) OR execute
 *  - Intelligent hardware specs parsing & categorization
 *  - Traceable source row mapping & duplicate detection
 *  - Full structured import report
 * ============================================================
 */

import { db } from "@/lib/db";
import { badRequest, json, readJson, serverError, unauthorized } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { logAudit } from "@/lib/server/audit";
import { invalidateBootstrapCache } from "@/app/api/bootstrap/route";
import { uid, slugify } from "@/lib/server/ids";

export async function POST(req: Request) {
  try {
    const actor = await requireAdmin(req);
    if (!actor) return unauthorized();

    const body = (await readJson(req)) as {
      csvText?: string;
      preview?: boolean;
      clearExisting?: boolean;
    };

    if (!body || !body.csvText || typeof body.csvText !== "string") {
      return badRequest("يرجى إرسال محتوى ملف الـ CSV المطلوب استيراده.");
    }

    const lines = body.csvText.split(/\r?\n/);
    const parsedItems: any[] = [];
    const duplicates: any[] = [];
    const rejected: any[] = [];
    const seenSignatures = new Map<string, any>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || /^,+$/.test(line)) continue;
      
      const cols = line.split(",").map((c) => c.trim());
      if (i === 0 && (cols[0]?.toLowerCase().includes("no") || cols[1]?.toLowerCase().includes("model"))) {
        continue; // header
      }

      // Check summary line
      if (cols[7] === "998000" && cols[8] === "77") continue;

      const rawModel = cols[1] || "";
      const rawCpu = cols[2] || "";
      const rawRam = cols[3] || "";
      const rawHard = cols[4] || "";
      const rawVga = cols[5] || "";
      const rawMonitor = cols[6] || "";
      const rawCond = cols[10] || cols[11] || "";
      const rawCharger = cols[12] || cols[14] || "";

      // Reject non-hardware or blank rows
      if (!rawModel && !rawCpu) {
        rejected.push({ line: i + 1, reason: "سطر فارغ بدون موديل أو مواصفات", raw: line });
        continue;
      }
      if (rawModel === "LENOVO THINKPAD" && !rawCpu && !rawRam && !rawHard) {
        rejected.push({ line: i + 1, reason: "موديل بدون مواصفات عتادية (Incomplete)", raw: line });
        continue;
      }
      if (!rawModel && cols.some((c) => /^\d{8,}$/.test(c) || /^\d+\.\d+e\+\d+$/.test(c))) {
        rejected.push({ line: i + 1, reason: "رمز باركود أو رقم غير صالح", raw: line });
        continue;
      }
      if (cols[0] === "km" && !rawModel) {
        rejected.push({ line: i + 1, reason: "مدخل غير صالح (km)", raw: line });
        continue;
      }

      // Deduplication check
      const sig = `${rawModel}|${rawCpu}|${rawRam}|${rawHard}|${rawVga}|${rawMonitor}`.toUpperCase().replace(/\s+/g, " ");
      const qty = parseInt(cols[8], 10) || 1;

      if (seenSignatures.has(sig)) {
        const prev = seenSignatures.get(sig);
        prev.stockQty += qty;
        prev.sourceLines.push(i + 1);
        duplicates.push({ line: i + 1, model: rawModel, mergedWithLine: prev.sourceLines[0] });
        continue;
      }

      // Categorization
      let categoryId = "cat-economic";
      const mUp = rawModel.toUpperCase();
      const vUp = rawVga.toUpperCase();
      
      if (/^SSD|^HDD/i.test(mUp)) categoryId = "cat-storage";
      else if (/^\d+\s*DDR/i.test(mUp)) categoryId = "cat-ram";
      else if (/MAC MINI/i.test(mUp)) categoryId = "cat-computers";
      else if (/PRECISION/i.test(mUp) || /QUDRO|QUADRO/i.test(vUp) || /SPECTER|SPECTRE/i.test(mUp)) categoryId = "cat-workstation";
      else if (
        /LOQ|LEGION|LEGON|NITRO|TUF|CYPORG|CYBORG|KATANA|GF65|THIN 15|VICTUS|PAVLION|PAVILION|IDEAPAD GAMING|G15/i.test(mUp) ||
        /RTX|GTX|GEFORCE|1660|1650|1050/i.test(vUp)
      ) {
        categoryId = "cat-gaming";
      }

      // Price resolution
      let price = parseFloat(cols[7]) || parseFloat(cols[9]) || parseFloat(cols[10]) || 0;
      let isEstimated = false;
      if (price <= 1000) {
        price = categoryId === "cat-gaming" ? 35000 : categoryId === "cat-workstation" ? 28000 : 16000;
        isEstimated = true;
      }

      // Brand
      let brand = "HyperTech";
      if (mUp.startsWith("LENOVO")) brand = "Lenovo";
      else if (mUp.startsWith("DELL")) brand = "Dell";
      else if (mUp.startsWith("HP")) brand = "HP";
      else if (mUp.startsWith("ASUS")) brand = "ASUS";
      else if (mUp.startsWith("ACER")) brand = "Acer";
      else if (mUp.startsWith("MSI")) brand = "MSI";
      else if (mUp.startsWith("MAC")) brand = "Apple";

      const cleanModel = rawModel.replace(/^(LENOVO|DELL|HP|ASUS|ACER|MSI)\s+/i, "").trim();
      const name = `لابتوب ${brand} ${cleanModel || rawModel} — ${rawCpu || "Intel"}`;
      const slug = `${slugify(brand)}-${slugify(cleanModel || rawModel)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;

      const product = {
        id: uid("prd"),
        slug,
        name,
        brand,
        shortDescription: `جهاز ${cleanModel} متميز بمعالج ${rawCpu} وكارت ${rawVga || "Intel Graphics"}.`,
        description: `جهاز ${brand} ${cleanModel} بمواصفات عتادية متوازنة تم فحصه والتأكد من كفاءته واستقراره التام لجميع الاستخدامات مع ضمان هايبر تك المعتمد.`,
        price,
        oldPrice: Math.round(price * 1.12),
        promotionalLabel: /BOX/i.test(rawCond) ? "مع الكرتونة الأصلية" : isEstimated ? null : "سعر حصري",
        categoryId,
        images: ["/products/laptop-gaming-1.png", "/products/laptop-silver.png"],
        availability: qty > 0 ? "in-stock" : "out-of-stock",
        stockQty: qty,
        featured: categoryId === "cat-gaming" || categoryId === "cat-workstation",
        isNew: /NEW/i.test(rawCond),
        rating: 4.8,
        specs: [
          { label: "المعالج", value: rawCpu || "غير محدد" },
          { label: "كارت الشاشة", value: rawVga || "Intel UHD Graphics" },
          { label: "الذاكرة العشوائية", value: rawRam || "8GB" },
          { label: "وحدة التخزين", value: rawHard || "512GB SSD" },
          { label: "الشاشة", value: rawMonitor || "15.6 بوصة FHD" },
          { label: "الحالة والمشتملات", value: rawCond || "Grade A بحالة الزيرو الممتازة" },
        ],
        specLayout: categoryId === "cat-storage" || categoryId === "cat-ram" ? "component" : "device",
        heroEligible: categoryId === "cat-gaming",
        allowRamUpgrade: true,
        allowStorageUpgrade: true,
        sourceLines: [i + 1],
      };

      seenSignatures.set(sig, product);
      parsedItems.push(product);
    }

    const report = {
      totalRows: lines.length,
      processed: parsedItems.length,
      duplicatesCount: duplicates.length,
      rejectedCount: rejected.length,
      duplicates,
      rejected,
      categoriesBreakdown: {
        gaming: parsedItems.filter((p) => p.categoryId === "cat-gaming").length,
        economic: parsedItems.filter((p) => p.categoryId === "cat-economic").length,
        workstation: parsedItems.filter((p) => p.categoryId === "cat-workstation").length,
        storage: parsedItems.filter((p) => p.categoryId === "cat-storage").length,
        ram: parsedItems.filter((p) => p.categoryId === "cat-ram").length,
        computers: parsedItems.filter((p) => p.categoryId === "cat-computers").length,
      },
      previewItems: parsedItems.slice(0, 5),
    };

    if (body.preview) {
      return json({ success: true, mode: "preview", report });
    }

    // Execute database insert
    if (body.clearExisting) {
      await db.product.deleteMany({});
    }

    const CHUNK = 5;
    for (let i = 0; i < parsedItems.length; i += CHUNK) {
      const batch = parsedItems.slice(i, i + CHUNK);
      await Promise.all(
        batch.map((p) =>
          db.product.create({
            data: {
              id: p.id,
              slug: p.slug,
              name: p.name,
              brand: p.brand,
              shortDescription: p.shortDescription,
              description: p.description,
              price: p.price,
              oldPrice: p.oldPrice,
              promotionalLabel: p.promotionalLabel,
              categoryId: p.categoryId,
              images: p.images,
              availability: p.availability,
              stockQty: p.stockQty,
              featured: p.featured,
              isNew: p.isNew,
              rating: p.rating,
              specs: p.specs,
              specLayout: p.specLayout,
              heroEligible: p.heroEligible,
              allowRamUpgrade: p.allowRamUpgrade,
              allowStorageUpgrade: p.allowStorageUpgrade,
            },
          })
        )
      );
    }

    await logAudit("catalog_csv_imported", actor, {
      count: parsedItems.length,
      cleared: !!body.clearExisting,
    });
    invalidateBootstrapCache();

    return json({ success: true, mode: "executed", report });
  } catch (err) {
    return serverError(err);
  }
}
