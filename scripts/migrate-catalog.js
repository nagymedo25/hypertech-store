const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

function resolveDatabaseUrl() {
  let url = process.env.DATABASE_URL;
  if (!url || !url.startsWith('postgres')) {
    try {
      const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
      const match = envFile.match(/^DATABASE_URL=(.+)$/m);
      const fromFile = match?.[1]?.trim().replace(/^"|"$/g, '');
      if (fromFile && fromFile.startsWith('postgres')) url = fromFile;
    } catch {}
  }
  if (url && url.startsWith('postgres')) {
    if (!url.includes('connection_limit=')) {
      url += (url.includes('?') ? '&' : '?') + 'connection_limit=10';
    }
    if (!url.includes('pool_timeout=')) {
      url += '&pool_timeout=30';
    }
  }
  return url;
}

const db = new PrismaClient({
  datasources: { db: { url: resolveDatabaseUrl() } },
  log: ['error', 'warn']
});

const REQUIRED_CATEGORIES = [
  {
    id: "cat-gaming",
    slug: "gaming",
    name: "جيمنج",
    tagline: "أداء ناري ومعدلات إطارات فائقة ⚡",
    description: "أقوى أجهزة ولابتوبات الألعاب بكروت شاشة منفصلة وشاشات فائقة السرعة وتبريد احترافي لتجربة لعب وبث استثنائية.",
    image: "/atmosphere/cat-builds.jpg",
    accent: "#10b981",
    icon: "Gamepad2",
    order: 0,
    active: true,
  },
  {
    id: "cat-workstation",
    slug: "workstation",
    name: "ورك ستيشن",
    tagline: "قوة وإنتاجية فائقة للأعمال والريندر",
    description: "أجهزة ومحطات عمل احترافية موجهة لمهندسي الريندر، المونتاج، التصميم ثلاثي الأبعاد، والمهام الشاقة بأقصى درجات الاستقرار والاعتمادية.",
    image: "/atmosphere/cat-computers.jpg",
    accent: "#0284c7",
    icon: "Cpu",
    order: 1,
    active: true,
  },
  {
    id: "cat-economic",
    slug: "economic",
    name: "اقتصادي",
    tagline: "أفضل قيمة واعتمادية للدراسة والأعمال",
    description: "أجهزة متوازنة وعملية للطلبة، العمل المكتبي، والتصفح اليومي — تجمع بين سرعة الاستجابة والجودة العالية بأوفر ميزانية.",
    image: "/atmosphere/cat-laptops.jpg",
    accent: "#f59e0b",
    icon: "Coins",
    order: 2,
    active: true,
  },
  {
    id: "cat-storage",
    slug: "storage",
    name: "تخزين - SSD & HDD",
    tagline: "أقراص NVMe و SATA وهاردات تخزين سريعة",
    description: "أقراص M.2 NVMe فائقة السرعة وهاردات تخزين داخلية وخارجية بأعلى درجات الموثوقية لحفظ ألعابك وملفاتك الكبيرة.",
    image: "/atmosphere/cat-computers.jpg",
    accent: "#5c6b7a",
    icon: "HardDrive",
    order: 3,
    active: true,
  },
  {
    id: "cat-ram",
    slug: "ram",
    name: "رامات - RAM",
    tagline: "ذاكرة عشوائية DDR4 و DDR5 فائقة السرعة",
    description: "شرائح ذاكرة عشوائية DDR4 و DDR5 بسرعات وتوقيتات استثنائية لترقية أجهزة اللابتوب والكمبيوتر المكتبي.",
    image: "/atmosphere/cat-computers.jpg",
    accent: "#a8703c",
    icon: "MemoryStick",
    order: 4,
    active: true,
  },
  {
    id: "cat-computers",
    slug: "computers",
    name: "أجهزة مكتبية وميني PC",
    tagline: "أجهزة كمبيوتر ومحطات مصغرة مدمجة",
    description: "أجهزة ماك ميني وكمبيوترات مكتبية مدمجة بأداء فائق وتصميم يوفر المساحة بأعلى كفاءة في استهلاك الطاقة.",
    image: "/atmosphere/cat-computers.jpg",
    accent: "#8c4a52",
    icon: "Cpu",
    order: 5,
    active: true,
  }
];

async function migrate() {
  console.log("=== STARTING CATALOG MIGRATION & SAFE INVENTORY REPLACEMENT ===");

  // 1. Back up existing products
  const backupDir = path.join(__dirname, '../data/backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const existingProducts = await db.product.findMany();
  const backupFile = path.join(backupDir, `products-backup-${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(existingProducts, null, 2), 'utf8');
  console.log(`[Backup] Backed up ${existingProducts.length} existing products to: ${backupFile}`);

  // 2. Ensure all required categories exist
  console.log("[Categories] Synchronizing categories...");
  for (const cat of REQUIRED_CATEGORIES) {
    const existing = await db.category.findUnique({ where: { slug: cat.slug } });
    if (!existing) {
      await db.category.create({ data: cat });
      console.log(`  + Created category: ${cat.slug} (${cat.name})`);
    } else {
      await db.category.update({
        where: { slug: cat.slug },
        data: {
          name: cat.name,
          tagline: cat.tagline,
          description: cat.description,
          accent: cat.accent,
          icon: cat.icon,
          order: cat.order,
          active: true
        }
      });
      console.log(`  ~ Updated category: ${cat.slug} (${cat.name})`);
    }
  }

  // 3. Load normalized catalog
  const catalogPath = path.join(__dirname, '../data/catalog-products.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  console.log(`[Catalog] Loaded ${catalog.length} normalized products to import.`);

  // 4. Safely clear old products
  console.log("[Products] Replacing old catalog records...");
  await db.product.deleteMany({});
  console.log("  - Cleared old product records safely.");

  // 5. Insert in parallel chunks of 5
  const CHUNK_SIZE = 5;
  let inserted = 0;

  for (let i = 0; i < catalog.length; i += CHUNK_SIZE) {
    const chunk = catalog.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map((p) =>
        db.product.create({
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
            images: p.images,
            availability: p.availability,
            stockQty: p.stockQty,
            featured: p.featured,
            isNew: p.isNew,
            rating: p.rating,
            specs: p.specs,
            specLayout: p.specLayout,
            heroEligible: p.heroEligible,
            baseRam: p.baseRam ?? null,
            baseStorage: p.baseStorage ?? null,
            allowRamUpgrade: p.allowRamUpgrade,
            allowStorageUpgrade: p.allowStorageUpgrade,
          }
        })
      )
    );
    inserted += chunk.length;
    console.log(`  + Inserted ${inserted}/${catalog.length} products...`);
  }

  // 6. Verification
  const [totalInDb, gamingCount, econCount, workCount, storageCount, ramCount, compCount] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { categoryId: 'cat-gaming' } }),
    db.product.count({ where: { categoryId: 'cat-economic' } }),
    db.product.count({ where: { categoryId: 'cat-workstation' } }),
    db.product.count({ where: { categoryId: 'cat-storage' } }),
    db.product.count({ where: { categoryId: 'cat-ram' } }),
    db.product.count({ where: { categoryId: 'cat-computers' } })
  ]);

  console.log("=== MIGRATION VERIFICATION ===");
  console.log(`Total Products in Database: ${totalInDb}`);
  console.log(`  - Gaming Laptops: ${gamingCount}`);
  console.log(`  - Economy & Business Laptops: ${econCount}`);
  console.log(`  - Workstation Devices: ${workCount}`);
  console.log(`  - Storage Products (SSDs/HDDs): ${storageCount}`);
  console.log(`  - RAM Modules: ${ramCount}`);
  console.log(`  - Desktop / Mini PC: ${compCount}`);

  // Create audit log
  await db.auditLog.create({
    data: {
      action: "catalog_migration_completed",
      actor: "system_migration",
      details: {
        totalProducts: totalInDb,
        gamingCount,
        econCount,
        workCount,
        storageCount,
        ramCount,
        compCount,
        source: "data/source-inventory.csv"
      }
    }
  });

  console.log("✅ Catalog Migration Completed Successfully!");
}

migrate()
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
