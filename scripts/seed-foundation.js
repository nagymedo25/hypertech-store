const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

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

async function main() {
  console.log("Checking hardware upgrade rates...");
  const rateCount = await db.hardwareUpgradeRate.count();
  if (rateCount === 0) {
    await db.hardwareUpgradeRate.createMany({
      data: DEFAULT_HARDWARE_RATES,
    });
    console.log(`Seeded ${DEFAULT_HARDWARE_RATES.length} HardwareUpgradeRates.`);
  } else {
    console.log(`HardwareUpgradeRates already exist (${rateCount} items).`);
  }

  console.log("Checking site content...");
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
    console.log("Seeded default SiteContent.");
  } else {
    console.log("SiteContent already exists.");
  }

  console.log("Checking discount codes...");
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
    console.log("Seeded default DiscountCode 'HYPER10'.");
  } else {
    console.log(`DiscountCodes already exist (${discountCount} items).`);
  }

  const rates = await db.hardwareUpgradeRate.findMany({ orderBy: { order: "asc" } });
  console.log("Current HardwareUpgradeRates in DB:", rates.map(r => `${r.componentType} ${r.label} (+$${r.priceDelta})`));
  const sc = await db.siteContent.findUnique({ where: { id: "singleton" } });
  console.log("Current SiteContent in DB:", sc ? "Found singleton" : "Missing");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
