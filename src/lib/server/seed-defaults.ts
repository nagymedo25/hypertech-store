import { db } from "@/lib/db";

const DEFAULT_HARDWARE_RATES = [
  { componentType: "ram", label: "8GB", capacityGb: 8, priceDelta: 0, order: 0, active: true },
  { componentType: "ram", label: "16GB", capacityGb: 16, priceDelta: 1200, order: 1, active: true },
  { componentType: "ram", label: "32GB", capacityGb: 32, priceDelta: 2500, order: 2, active: true },
  { componentType: "ram", label: "64GB", capacityGb: 64, priceDelta: 5000, order: 3, active: true },
  { componentType: "storage", label: "256GB SSD", capacityGb: 256, priceDelta: 0, order: 0, active: true },
  { componentType: "storage", label: "512GB SSD", capacityGb: 512, priceDelta: 900, order: 1, active: true },
  { componentType: "storage", label: "1TB SSD", capacityGb: 1024, priceDelta: 1800, order: 2, active: true },
  { componentType: "storage", label: "2TB SSD", capacityGb: 2048, priceDelta: 3600, order: 3, active: true },
];

const DEFAULT_SITE_CONTENT = {
  banner: {
    enabled: true,
    text: "عروض هايبر تك الحصرية في المنصورة — ترقيات عتاد فورية وضمان شامل على كل الأجهزة! ⚡",
    link: "/#products",
  },
  announcement: {
    enabled: false,
    text: "",
  },
  heroHighlight: "مستواك التالي يبدأ هنا",
  promoNotice: "توصيل واستلام فوري داخل المنصورة ومحافظات الدلتا",
};

const DEFAULT_WORLDS_CATEGORIES = [
  {
    id: "cat-workstation",
    slug: "workstation",
    name: "ورك ستيشن",
    tagline: "قوة وإنتاجية فائقة للأعمال والريندر",
    description:
      "أجهزة ومحطات عمل احترافية موجهة لمهندسي الريندر، المونتاج، التصميم ثلاثي الأبعاد، والمهام الشاقة بأقصى درجات الاستقرار والاعتمادية.",
    image: "/atmosphere/cat-computers.jpg",
    accent: "#0284c7",
    icon: "Cpu",
    order: 0,
    active: true,
  },
  {
    id: "cat-gaming",
    slug: "gaming",
    name: "جيمنج",
    tagline: "أداء ناري ومعدلات إطارات فائقة ⚡",
    description:
      "أقوى أجهزة ولابتوبات الألعاب بكروت شاشة منفصلة وشاشات فائقة السرعة وتبريد احترافي لتجربة لعب وبث استثنائية.",
    image: "/atmosphere/cat-builds.jpg",
    accent: "#10b981",
    icon: "Gamepad2",
    order: 1,
    active: true,
  },
  {
    id: "cat-economic",
    slug: "economic",
    name: "اقتصادي",
    tagline: "أفضل قيمة واعتمادية للدراسة والأعمال",
    description:
      "أجهزة متوازنة وعملية للطلبة، العمل المكتبي، والتصفح اليومي — تجمع بين سرعة الاستجابة والجودة العالية بأوفر ميزانية.",
    image: "/atmosphere/cat-laptops.jpg",
    accent: "#f59e0b",
    icon: "Coins",
    order: 2,
    active: true,
  },
];

let defaultsBooted = false;

export async function ensureBootstrapDefaults(): Promise<void> {
  if (defaultsBooted) return;
  defaultsBooted = true;

  try {
    // 1. Ensure the 3 default worlds categories exist
    for (const cat of DEFAULT_WORLDS_CATEGORIES) {
      const exists = await db.category.findUnique({
        where: { slug: cat.slug },
      });
      if (!exists) {
        await db.category.create({
          data: cat,
        });
        console.log(`[seed] Category '${cat.slug}' seeded successfully.`);
      }
    }

    // 2. Ensure products are assigned to worlds if unassigned
    const gamingProducts = await db.product.count({ where: { categoryId: "cat-gaming" } });
    if (gamingProducts === 0) {
      await db.product.updateMany({
        where: {
          id: {
            in: [
              "prd-001", "prd-002", "prd-003", "prd-006",
              "prd-502", "prd-503", "prd-505", "prd-506", "prd-507", "prd-509",
            ],
          },
        },
        data: { categoryId: "cat-gaming" },
      });
      await db.product.updateMany({
        where: {
          id: {
            in: ["prd-004", "prd-007", "prd-501", "prd-504", "prd-508"],
          },
        },
        data: { categoryId: "cat-workstation" },
      });
      await db.product.updateMany({
        where: {
          id: {
            in: ["prd-005", "prd-510"],
          },
        },
        data: { categoryId: "cat-economic" },
      });
      console.log("[seed] Distributed sample products into default worlds.");
    }

    const rateCount = await db.hardwareUpgradeRate.count();
    if (rateCount === 0) {
      await db.hardwareUpgradeRate.createMany({
        data: DEFAULT_HARDWARE_RATES,
      });
      console.log("[seed] Default HardwareUpgradeRates seeded successfully.");
    }

    // 3. Ensure laptop / workstation products have upgrade options enabled
    const upgradeableCount = await db.product.count({ where: { allowRamUpgrade: true } });
    if (upgradeableCount === 0) {
      await db.product.updateMany({
        where: {
          OR: [
            { categoryId: { in: ["cat-gaming", "cat-workstation", "cat-economic"] } },
            { name: { contains: "Laptop", mode: "insensitive" } },
            { name: { contains: "لابتوب" } },
            { name: { contains: "Legion", mode: "insensitive" } },
            { name: { contains: "ThinkPad", mode: "insensitive" } },
            { name: { contains: "Dell", mode: "insensitive" } },
          ],
        },
        data: {
          allowRamUpgrade: true,
          allowStorageUpgrade: true,
          baseRam: "8GB",
          baseStorage: "512GB SSD",
        },
      });
      console.log("[seed] Enabled hardware upgrades on default laptop products.");
    }

    const siteContent = await db.siteContent.findUnique({
      where: { id: "singleton" },
    });
    if (!siteContent) {
      await db.siteContent.create({
        data: {
          id: "singleton",
          data: DEFAULT_SITE_CONTENT,
        },
      });
      console.log("[seed] Default SiteContent seeded successfully.");
    }

    // Optional sample discount code if none exist
    const discountCount = await db.discountCode.count();
    if (discountCount === 0) {
      await db.discountCode.create({
        data: {
          code: "HYPER10",
          discountType: "percentage",
          discountValue: 10,
          minOrderAmount: 1000,
          maxDiscountAmount: 500,
          isActive: true,
        },
      });
      console.log("[seed] Default DiscountCode 'HYPER10' seeded successfully.");
    }
  } catch (err) {
    defaultsBooted = false;
    console.error("[seed] ensureBootstrapDefaults failed:", err);
  }
}
