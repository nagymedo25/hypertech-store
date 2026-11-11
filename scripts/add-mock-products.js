const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

// Pool of high quality images
const IMAGES = {
  laptops: [
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794261774/hypertech/store/laptop-tough-0.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794261775/hypertech/store/laptop-gaming-1-0.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794261776/hypertech/store/laptop-silver-0.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794261776/hypertech/store/laptop-business-0.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794261777/hypertech/store/laptop-gaming-2-0.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794261778/hypertech/store/laptop-gaming-3-0.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794261778/hypertech/store/laptop-used-0.jpg',
    '/products/laptop-gaming-1.png',
    '/products/laptop-gaming-2.png',
    '/products/laptop-silver.png',
    '/products/laptop-tough.png'
  ],
  gpu: [
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794261775/hypertech/store/gpu-1-1.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272129/hypertech/store/gpu-2-3.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272130/hypertech/store/eadfd85932bd-8.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272130/hypertech/store/26a16b31b6ab-9.png',
    '/products/gpu-1.png',
    '/products/gpu-2.png'
  ],
  cpu: [
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272130/hypertech/store/861f0b323f60-5.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272130/hypertech/store/4d1ee3183d6e-6.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272130/hypertech/store/f7e536a2054f-7.jpg',
  ],
  motherboard: [
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794268525/hypertech/store/motherboard-4.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272131/hypertech/store/ab5762f8726d-10.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272131/hypertech/store/cb6f9c27e4e6-11.jpg',
    '/products/motherboard.png'
  ],
  cooler: [
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272130/hypertech/store/cooler-aio-6.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272131/hypertech/store/bbd23e5de43b-12.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272131/hypertech/store/c95269e9ceb1-12.jpg',
    '/products/cooler-aio.png'
  ],
  ram: [
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272131/hypertech/store/145eadf5235c-13.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272131/hypertech/store/9c971904f89c-13.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272131/hypertech/store/24292445dfaf-14.png',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272132/hypertech/store/37b7abf8a8fa-14.jpg'
  ],
  storage: [
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794261777/hypertech/store/78a882a1b9b1-11.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272132/hypertech/store/472e9b876596-19.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272132/hypertech/store/3838ff706b2e-20.png',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272132/hypertech/store/4bb2aa8d59cb-21.jpg'
  ],
  keyboards: [
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272131/hypertech/store/keyboard-15.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272133/hypertech/store/b6893dc84aeb-25.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272133/hypertech/store/ec7814ac7dfd-26.jpg',
    '/products/keyboard.png'
  ],
  mice: [
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794268527/hypertech/store/4ff2036dc58e-23.png',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794268525/hypertech/store/d7210a25a485-14.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272133/hypertech/store/1b10a492b16e-23.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272133/hypertech/store/f8bc9768e014-24.jpg'
  ],
  headphones: [
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272132/hypertech/store/headset-21.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272134/hypertech/store/88ceb6be93ca-29.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272134/hypertech/store/1d1dc9a8b4e4-30.jpg',
    '/products/headset.png'
  ],
  monitors: [
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272133/hypertech/store/monitor-26.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272134/hypertech/store/bac5a1b4daf5-27.png',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272134/hypertech/store/fbec6f543233-28.jpg',
    '/products/monitor.png'
  ],
  controllers: [
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272132/hypertech/store/controller-22.jpg',
    '/products/controller.png'
  ],
  accessories: [
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272132/hypertech/store/usb-hub-23.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272133/hypertech/store/cooler-pad-24.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272133/hypertech/store/router-25.jpg',
    '/products/usb-hub.png',
    '/products/cooler-pad.png',
    '/products/router.png'
  ],
  builds: [
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272135/hypertech/store/build-legend-33.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794268528/hypertech/store/build-dragon-31.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794268530/hypertech/store/build-studio-45.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272135/hypertech/store/build-starter-32.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272137/hypertech/store/23da8dacffe1-41.jpg',
    'https://res.cloudinary.com/ojtymdlg/image/upload/v1794272137/hypertech/store/56ced705e2d6-42.jpeg',
    '/products/build-legend.png',
    '/products/build-dragon.png',
    '/products/build-studio.png',
    '/products/build-starter.png'
  ]
};

const newProducts = [
  /* ====================== LAPTOPS (10) ====================== */
  {
    id: "prd-501",
    slug: "dell-xps-15-oled-rtx4070",
    name: "لابتوب Dell XPS 15 9530 — OLED 3.5K / RTX 4070",
    brand: "Dell",
    shortDescription: "قمة الفخامة والأداء للمصممين والمحترفين بشاشة OLED مبهرة ومعالج i9 الجيل 13.",
    description: "Dell XPS 15 هو تحفة هندسية تجمع بين هيكل الألومنيوم المقاوم وألياف الكربون، مع شاشة لمس OLED بدقة 3.5K وتدرج ألوان DCI-P3 بنسبة 100%. مزود بمعالج Core i9-13900H وكارت RTX 4070 بقوة تلبي أصعب مشاريع المونتاج والتصميم الثلاثي الأبعاد.",
    price: 78500,
    oldPrice: 84000,
    promotionalLabel: "إصدار النخبة",
    categoryId: "cat-laptops",
    images: [IMAGES.laptops[2], IMAGES.laptops[5]],
    availability: "in-stock",
    stockQty: 3,
    featured: true,
    isNew: true,
    rating: 4.9,
    specs: [
      { label: "المعالج", value: "Intel Core i9-13900H (14-Core)" },
      { label: "كارت الشاشة", value: "NVIDIA RTX 4070 8GB GDDR6" },
      { label: "الذاكرة", value: "32GB DDR5 5200MHz" },
      { label: "التخزين", value: "1TB NVMe PCIe 4.0 SSD" },
      { label: "الشاشة", value: "15.6\" OLED 3.5K Touch 400 nits" },
      { label: "البطارية", value: "86Wh مع شحن سريع 130W Type-C" }
    ],
    specLayout: "device",
    createdAt: daysAgo(2)
  },
  {
    id: "prd-502",
    slug: "asus-rog-strix-scar-16-rtx4080",
    name: "لابتوب ASUS ROG Strix SCAR 16 — RTX 4080 / Nebula HDR",
    brand: "ASUS",
    shortDescription: "وحش كاسر للألعاب التنافسية بشاشة Mini-LED 240Hz ومعالج i9-14900HX.",
    description: "إن كنت تبحث عن الأداء الأقصى بلا أي تنازلات، فهذا هو Strix SCAR 16: معالج الجيل 14 الخارق i9-14900HX مع كارت شاشة RTX 4080 بقدرة 175W TGP وتبريد معدني سائل Conductonaut Extreme ثلاثي المراوح. شاشة ROG Nebula HDR بمعدل 240Hz وإضاءة 1100 nits.",
    price: 94000,
    oldPrice: 99500,
    promotionalLabel: "أداء خارق",
    categoryId: "cat-laptops",
    images: [IMAGES.laptops[0], IMAGES.laptops[1]],
    availability: "in-stock",
    stockQty: 2,
    featured: true,
    isNew: true,
    rating: 5.0,
    specs: [
      { label: "المعالج", value: "Intel Core i9-14900HX (24-Core, 5.8GHz)" },
      { label: "كارت الشاشة", value: "NVIDIA GeForce RTX 4080 12GB (175W)" },
      { label: "الذاكرة", value: "32GB DDR5 5600MHz" },
      { label: "التخزين", value: "2TB PCIe 4.0 NVMe (RAID 0)" },
      { label: "الشاشة", value: "16\" QHD+ 240Hz Mini-LED Nebula HDR" }
    ],
    specLayout: "device",
    createdAt: daysAgo(1)
  },
  {
    id: "prd-503",
    slug: "lenovo-legion-pro-5-ryzen7",
    name: "لابتوب Lenovo Legion Pro 5 Gen 8 — Ryzen 7 / RTX 4070",
    brand: "Lenovo",
    shortDescription: "أفضل قيمة في فئة الـ High-End بمحرك الذكاء الاصطناعي Legion AI Engine+.",
    description: "يمنحك Legion Pro 5 ثباتاً حرارياً أسطورياً بفضل تبريد Legion Coldfront 5.0 وغرفة البخار المحسنة. معالج Ryzen 7 7745HX بثمانية أنوية قوية متكاملة مع RTX 4070 وشاشة 16 بوصة بدقة 2560x1600 ومعدل تحديث 240Hz مع دعم كامل لـ G-Sync.",
    price: 52900,
    oldPrice: 56000,
    promotionalLabel: "الأكثر طلباً",
    categoryId: "cat-laptops",
    images: [IMAGES.laptops[4], IMAGES.laptops[1]],
    availability: "in-stock",
    stockQty: 5,
    featured: false,
    isNew: true,
    rating: 4.8,
    specs: [
      { label: "المعالج", value: "AMD Ryzen 7 7745HX (8-Core / 16-Thread)" },
      { label: "كارت الشاشة", value: "NVIDIA RTX 4070 8GB (140W)" },
      { label: "الذاكرة", value: "16GB DDR5 5200MHz (Dual Channel)" },
      { label: "التخزين", value: "1TB SSD M.2 NVMe" },
      { label: "الشاشة", value: "16\" WQXGA 240Hz IPS 500 nits" }
    ],
    specLayout: "device",
    createdAt: daysAgo(4)
  },
  {
    id: "prd-504",
    slug: "macbook-pro-16-m3-pro",
    name: "لابتوب Apple MacBook Pro 16 — شريحة M3 Pro (Space Black)",
    brand: "Apple",
    shortDescription: "اللون الأسود الفضائي الجديد مع قوة M3 Pro وبطارية تدوم حتى 22 ساعة.",
    description: "MacBook Pro 16 بتصميمه الجديد المقاوم لبصمات الأصابع بلون Space Black، شريحة M3 Pro بمعمارية 3 نانومتر مع تسريع عتادي لتتبع الأشعة Ray Tracing، وشاشة Liquid Retina XDR بسطوع مستمر 1000 nits وصوت محيطي من 6 سماعات ذات جودة استوديو.",
    price: 98000,
    oldPrice: 104000,
    promotionalLabel: "ضمان محلي معتمد",
    categoryId: "cat-laptops",
    images: [IMAGES.laptops[2], IMAGES.laptops[3]],
    availability: "in-stock",
    stockQty: 4,
    featured: true,
    isNew: true,
    rating: 4.9,
    specs: [
      { label: "المعالج", value: "Apple M3 Pro (12-Core CPU, 18-Core GPU)" },
      { label: "الذاكرة", value: "18GB Unified Memory" },
      { label: "التخزين", value: "512GB High-Speed SSD" },
      { label: "الشاشة", value: "16.2\" Liquid Retina XDR 120Hz ProMotion" },
      { label: "البطارية", value: "حتى 22 ساعة مع شاحن MagSafe 3 بقوة 140W" }
    ],
    specLayout: "device",
    createdAt: daysAgo(6)
  },
  {
    id: "prd-505",
    slug: "acer-predator-helios-neo-16",
    name: "لابتوب Acer Predator Helios Neo 16 — RTX 4060",
    brand: "Acer",
    shortDescription: "قوة بريداتور المعهودة بتبريد مراوح AeroBlade المعدنية وشاشة 165Hz.",
    description: "لابتوب متين جاهز لأثقل جلسات اللعب المستمرة. يتميز بتبريد مروحي معدني من الجيل الخامس وشاشة WUXGA سريعة الاستجابة 3ms، مع إضاءة RGB مخصصة لكل مفتاح ومنافذ كاملة تتضمن Thunderbolt 4.",
    price: 41900,
    oldPrice: 44500,
    promotionalLabel: "عرض محدود",
    categoryId: "cat-laptops",
    images: [IMAGES.laptops[5], IMAGES.laptops[4]],
    availability: "in-stock",
    stockQty: 6,
    featured: false,
    isNew: false,
    rating: 4.6,
    specs: [
      { label: "المعالج", value: "Intel Core i7-13700HX" },
      { label: "كارت الشاشة", value: "NVIDIA RTX 4060 8GB (140W)" },
      { label: "الذاكرة", value: "16GB DDR5 4800MHz" },
      { label: "التخزين", value: "1TB NVMe Gen4 SSD" },
      { label: "الشاشة", value: "16\" 165Hz sRGB 100%" }
    ],
    specLayout: "device",
    createdAt: daysAgo(10)
  },
  {
    id: "prd-506",
    slug: "hp-omen-16-rtx4070",
    name: "لابتوب HP OMEN 16 — Core i7 / RTX 4070",
    brand: "HP",
    shortDescription: "تصميم أنيق وبسيط يخفي بداخله أداء جيمنج احترافي ومكبرات صوت Bang & Olufsen.",
    description: "HP OMEN 16 يكسر القالب التقليدي للابتوبات الألعاب بمظهر هادئ أسود غير لامع يناسب الاجتماعات وقاعات المحاضرات، بينما يقدم داخلياً أداء RTX 4070 الجبار مع شاشة QHD 240Hz سريعة للغاية.",
    price: 49800,
    categoryId: "cat-laptops",
    images: [IMAGES.laptops[4], IMAGES.laptops[1]],
    availability: "in-stock",
    stockQty: 4,
    featured: false,
    isNew: true,
    rating: 4.7,
    specs: [
      { label: "المعالج", value: "Intel Core i7-13700H" },
      { label: "كارت الشاشة", value: "NVIDIA RTX 4070 8GB" },
      { label: "الذاكرة", value: "16GB DDR5" },
      { label: "التخزين", value: "1TB PCIe Gen4 SSD" },
      { label: "الشاشة", value: "16.1\" QHD 240Hz 3ms" }
    ],
    specLayout: "device",
    createdAt: daysAgo(12)
  },
  {
    id: "prd-507",
    slug: "msi-cyborg-15-rtx4050",
    name: "لابتوب MSI Cyborg 15 — تصميم Cyberpunk نصف شفاف",
    brand: "MSI",
    shortDescription: "خفيف الوزن 1.98 كجم بتصميم عصري شفاف وسعر ممتاز لدخول الجيمنج الحديث.",
    description: "MSI Cyborg 15 بتصميم مستوحى من عالم السايبربانك بأجزاء نصف شفافة من الهيكل وأزرار WASD نيون مميزة. يأتي بوزن خفيف جداً يسهل حمله في حقيبة الظهر مع كارت RTX 4050 الموفر للطاقة.",
    price: 32500,
    oldPrice: 34900,
    promotionalLabel: "سعر اقتصادي",
    categoryId: "cat-laptops",
    images: [IMAGES.laptops[1], IMAGES.laptops[0]],
    availability: "in-stock",
    stockQty: 7,
    featured: false,
    isNew: false,
    rating: 4.4,
    specs: [
      { label: "المعالج", value: "Intel Core i5-12450H" },
      { label: "كارت الشاشة", value: "NVIDIA RTX 4050 6GB GDDR6" },
      { label: "الذاكرة", value: "16GB DDR5" },
      { label: "التخزين", value: "512GB NVMe SSD" },
      { label: "الشاشة", value: "15.6\" FHD 144Hz IPS" }
    ],
    specLayout: "device",
    createdAt: daysAgo(16)
  },
  {
    id: "prd-508",
    slug: "asus-zenbook-14-oled-ultra7",
    name: "لابتوب ASUS Zenbook 14 OLED — معالج Intel Core Ultra 7",
    brand: "ASUS",
    shortDescription: "نحافة فائقة مع وحدة معالجة عصبية NPU للذكاء الاصطناعي وبطارية 75Wh.",
    description: "الجيل الجديد من أجهزة الألترا بوك المدعومة بالذكاء الاصطناعي معالج Core Ultra 7 155H الجديد كلياً. شاشة ASUS Lumina OLED بدقة 3K مع معدل 120Hz، ووزن 1.2 كجم فقط بهيكل معدني جذاب باللون الأزرق الداكن.",
    price: 54000,
    categoryId: "cat-laptops",
    images: [IMAGES.laptops[2], IMAGES.laptops[3]],
    availability: "in-stock",
    stockQty: 3,
    featured: true,
    isNew: true,
    rating: 4.8,
    specs: [
      { label: "المعالج", value: "Intel Core Ultra 7 155H (16-Core / Intel AI Boost NPU)" },
      { label: "كارت الشاشة", value: "Intel Arc Graphics مدمج فائق القوة" },
      { label: "الذاكرة", value: "16GB LPDDR5X 7467MHz" },
      { label: "التخزين", value: "1TB M.2 NVMe PCIe 4.0" },
      { label: "الشاشة", value: "14\" 3K (2880 x 1800) OLED 120Hz 0.2ms" }
    ],
    specLayout: "device",
    createdAt: daysAgo(5)
  },
  {
    id: "prd-509",
    slug: "razer-blade-14-mercury",
    name: "لابتوب Razer Blade 14 — Mercury White / RTX 4070",
    brand: "Razer",
    shortDescription: "هيكل ألومنيوم CNC قطعة واحدة بلون ميركوري أبيض جذاب وشاشة QHD+ 240Hz.",
    description: "أصغر وحش جيمنج من ريزر: يجمع بين مقاس 14 بوصة شديد الحمل وقوة معالج Ryzen 9 7940HS مع RTX 4070. جودة بناء استثنائية تنافس أبل مع لوحة لمس زجاجية رحبة وصوت THX Spatial Audio.",
    price: 76000,
    oldPrice: 82000,
    promotionalLabel: "إصدار نادر",
    categoryId: "cat-laptops",
    images: [IMAGES.laptops[2], IMAGES.laptops[0]],
    availability: "low-stock",
    stockQty: 1,
    featured: false,
    isNew: true,
    rating: 4.9,
    specs: [
      { label: "المعالج", value: "AMD Ryzen 9 7940HS (8-Core / 16-Thread)" },
      { label: "كارت الشاشة", value: "NVIDIA RTX 4070 8GB (140W)" },
      { label: "الذاكرة", value: "16GB DDR5 5600MHz" },
      { label: "التخزين", value: "1TB PCIe Gen4 NVMe" },
      { label: "الشاشة", value: "14\" QHD+ 240Hz 16:10" }
    ],
    specLayout: "device",
    createdAt: daysAgo(7)
  },
  {
    id: "prd-510",
    slug: "dell-g15-5530-rtx3050",
    name: "لابتوب Dell G15 5530 — Core i5 / RTX 3050 6GB",
    brand: "Dell",
    shortDescription: "جهاز عملي ومتين للطلاب واللاعبين بميزانية مدروسة وضمان متجر هايبر تك.",
    description: "Dell G15 5530 بهيكل مستوحى من Alienware ونظام تبريد بمروحتين ومنافذ تهوية متعددة. كارت RTX 3050 بنسخة 6GB المحدثة يشغل ألعاب الـ eSports مثل Valorant و CS2 و Fortnite بسلاسة تفوق 144 إطار في الثانية.",
    price: 28900,
    oldPrice: 31000,
    promotionalLabel: "الأفضل للطلاب",
    categoryId: "cat-laptops",
    images: [IMAGES.laptops[4], IMAGES.laptops[6]],
    availability: "in-stock",
    stockQty: 8,
    featured: false,
    isNew: false,
    rating: 4.3,
    specs: [
      { label: "المعالج", value: "Intel Core i5-13450HX" },
      { label: "كارت الشاشة", value: "NVIDIA RTX 3050 6GB GDDR6" },
      { label: "الذاكرة", value: "16GB DDR5 4800MHz" },
      { label: "التخزين", value: "512GB SSD NVMe" },
      { label: "الشاشة", value: "15.6\" FHD 120Hz" }
    ],
    specLayout: "device",
    createdAt: daysAgo(20)
  },

  /* ====================== PARTS & HARDWARE (15) ====================== */
  {
    id: "prd-511",
    slug: "msi-rtx-4080-super-gaming-x-slim",
    name: "كارت شاشة MSI GeForce RTX 4080 SUPER Gaming X Slim — 16GB",
    brand: "MSI",
    shortDescription: "أداء 4K خيالي مع تقنية DLSS 3.5 وتصميم Slim ثلاثي المراوح يناسب جميع الكيسات.",
    description: "كارت MSI RTX 4080 SUPER Gaming X Slim يقدم تجربة 4K لا مثيل لها بأقصى إعدادات رسومية وتتبع أشعة، مع بنية TRI FROZR 3 ومراوح TORX FAN 5.0 الهادئة جداً. سمك أنحف لا يشغل مساحة مفرطة في صندوق جهازك.",
    price: 49500,
    oldPrice: 53000,
    promotionalLabel: "خصم 3,500 ج",
    categoryId: "cat-parts",
    images: [IMAGES.gpu[0], IMAGES.gpu[1]],
    availability: "in-stock",
    stockQty: 3,
    featured: true,
    isNew: true,
    rating: 4.9,
    specs: [
      { label: "المعمارية", value: "Ada Lovelace (10240 CUDA Cores)" },
      { label: "الذاكرة", value: "16GB GDDR6X (256-bit)" },
      { label: "التردد الأقصى", value: "2610 MHz (Boost)" },
      { label: "المخارج", value: "DisplayPort 1.4a x 3, HDMI 2.1a x 1" },
      { label: "الطاقة المطلوبة", value: "750W - 850W (16-pin 12VHPWR)" }
    ],
    specLayout: "component",
    createdAt: daysAgo(3)
  },
  {
    id: "prd-512",
    slug: "sapphire-nitro-rx-7900-xtx-24gb",
    name: "كارت شاشة Sapphire Nitro+ Radeon RX 7900 XTX Vapor-X — 24GB",
    brand: "Sapphire",
    shortDescription: "عملاق AMD بذاكرة 24 جيجا وغرفة بخار Vapor-X لأثقل الأحمال ومونتاج الفيديو.",
    description: "كارت الشاشة الرائد من شركة Sapphire الحائز على أعلى الجوائز: غرفة بخار Vapor-X مبتكرة ملحومة مباشرة على المعالج الرسومي، وهيكل من الألمنيوم المصبوب مع شريط إضاءة ARGB يحيط بالكارت بالكامل.",
    price: 47900,
    categoryId: "cat-parts",
    images: [IMAGES.gpu[1], IMAGES.gpu[2]],
    availability: "in-stock",
    stockQty: 2,
    featured: false,
    isNew: true,
    rating: 4.8,
    specs: [
      { label: "المعمارية", value: "RDNA 3 (6144 Stream Processors)" },
      { label: "الذاكرة", value: "24GB GDDR6 (384-bit)" },
      { label: "الكاش الداخلي", value: "96MB Infinity Cache" },
      { label: "المخارج", value: "DisplayPort 2.1 x 2, HDMI 2.1 x 2" }
    ],
    specLayout: "component",
    createdAt: daysAgo(8)
  },
  {
    id: "prd-513",
    slug: "asus-rog-strix-rtx-4070-ti-super",
    name: "كارت شاشة ASUS ROG Strix GeForce RTX 4070 Ti SUPER OC — 16GB",
    brand: "ASUS",
    shortDescription: "فخر صناعة ROG Strix بتبريد ضخم ومروحتين خارجيتين تدوران بعكس الوسطى لتشتيت أعلى.",
    description: "كارت يجمع بين جمالية تصاميم Republic of Gamers والكسر المصنعي العنيف للسرعة. ترقية إلى 16GB VRAM و 256-bit ناقل تضمن لك سلاسة لعب مطلقة لسنوات قادمة على دقة 2K و 4K.",
    price: 43500,
    oldPrice: 46000,
    promotionalLabel: "نسخة OC مصنعية",
    categoryId: "cat-parts",
    images: [IMAGES.gpu[0], IMAGES.gpu[3]],
    availability: "in-stock",
    stockQty: 4,
    featured: true,
    isNew: true,
    rating: 4.9,
    specs: [
      { label: "المعمارية", value: "NVIDIA Ada Lovelace" },
      { label: "الذاكرة", value: "16GB GDDR6X (256-bit)" },
      { label: "تردد الكسر", value: "2700 MHz (OC Mode)" },
      { label: "نظام التبريد", value: "3.15 Slot MaxContact Design" }
    ],
    specLayout: "component",
    createdAt: daysAgo(5)
  },
  {
    id: "prd-514",
    slug: "zotac-gaming-rtx-4060-ti-twin-edge",
    name: "كارت شاشة ZOTAC GAMING GeForce RTX 4060 Ti Twin Edge — 8GB",
    brand: "ZOTAC",
    shortDescription: "حجم مدمج يركب في أصغر الكيسات مع دعم كامل لـ DLSS 3 وتوليد الإطارات.",
    description: "خيار رائع لتحديث أجهزة الكمبيوتر القديمة أو التجميعات الاقتصادية دون الحاجة لتغيير الكيس أو مزود الطاقة. أداء 1080p و 1440p ممتاز مع استهلاك طاقة لا يتجاوز 160W.",
    price: 19800,
    categoryId: "cat-parts",
    images: [IMAGES.gpu[2], IMAGES.gpu[1]],
    availability: "in-stock",
    stockQty: 6,
    featured: false,
    isNew: false,
    rating: 4.5,
    specs: [
      { label: "الذاكرة", value: "8GB GDDR6 (128-bit)" },
      { label: "التبريد", value: "IceStorm 2.0 بمروحتين" },
      { label: "الطاقة", value: "160W (وصلة 8-pin واحدة)" }
    ],
    specLayout: "component",
    createdAt: daysAgo(14)
  },
  {
    id: "prd-515",
    slug: "intel-core-i9-14900k",
    name: "معالج Intel Core i9-14900K — 24 نواة / 6.0GHz",
    brand: "Intel",
    shortDescription: "أقوى معالجات إنتل المكتبية بتردد يصل إلى 6.0 جيجاهرتز لأقصى إنتاجية ولعب.",
    description: "معالج Intel الرائد بـ 24 نواة (8 أنوية أداء P-cores و 16 نواة كفاءة E-cores) و 32 خيط معالجة. دعم كامل لرامات DDR5 وقنوات PCIe 5.0 ومفتوح بالكامل لكسر السرعة.",
    price: 24500,
    oldPrice: 26500,
    promotionalLabel: "تردد 6.0GHz",
    categoryId: "cat-parts",
    images: [IMAGES.cpu[0], IMAGES.cpu[1]],
    availability: "in-stock",
    stockQty: 4,
    featured: true,
    isNew: true,
    rating: 4.8,
    specs: [
      { label: "عدد الأنوية / الخيوط", value: "24 نواة / 32 خيط" },
      { label: "التردد الأقصى", value: "6.0 GHz (Intel Thermal Velocity Boost)" },
      { label: "الكاش الذكي", value: "36MB Intel Smart Cache" },
      { label: "السوكِت", value: "LGA 1700" }
    ],
    specLayout: "component",
    createdAt: daysAgo(4)
  },
  {
    id: "prd-516",
    slug: "intel-core-i7-14700k",
    name: "معالج Intel Core i7-14700K — 20 نواة / 28 خيط",
    brand: "Intel",
    shortDescription: "ترقية كبيرة بـ 4 أنوية كفاءة إضافية تجعله يقترب جداً من أداء i9 بسعر أقل.",
    description: "المعالج الأذكى للشراء في الجيل 14: حصل على ترقية حقيقية في العتاد بزيادة أنوية الكفاءة إلى 16 نواة ليكون المجموع 20 نواة، مما يمنحه قفزة هائلة في الرندرة والمهام المتعددة.",
    price: 18900,
    categoryId: "cat-parts",
    images: [IMAGES.cpu[1], IMAGES.cpu[2]],
    availability: "in-stock",
    stockQty: 6,
    featured: false,
    isNew: true,
    rating: 4.8,
    specs: [
      { label: "الأنوية / الخيوط", value: "20 نواة / 28 خيط" },
      { label: "التردد الأقصى", value: "5.6 GHz" },
      { label: "الكاش الذكي", value: "33MB" },
      { label: "السوكِت", value: "LGA 1700" }
    ],
    specLayout: "component",
    createdAt: daysAgo(9)
  },
  {
    id: "prd-517",
    slug: "intel-core-i5-14600k",
    name: "معالج Intel Core i5-14600K — 14 نواة",
    brand: "Intel",
    shortDescription: "بطل الفئة المتوسطة للألعاب وتطبيقات صناعة المحتوى اليومية.",
    description: "يقدم Core i5-14600K توازناً مثالياً في استهلاك الطاقة والسعر مع 14 نواة وتردد يصل لـ 5.3 جيجاهرتز، مما يضمن تشغيل كافة الكروت الحديثة حتى RTX 4080 دون أي عنق زجاجة.",
    price: 13500,
    categoryId: "cat-parts",
    images: [IMAGES.cpu[2], IMAGES.cpu[0]],
    availability: "in-stock",
    stockQty: 8,
    featured: false,
    isNew: false,
    rating: 4.7,
    specs: [
      { label: "الأنوية / الخيوط", value: "14 نواة (6P + 8E) / 20 خيط" },
      { label: "التردد الأقصى", value: "5.3 GHz" },
      { label: "الكاش", value: "24MB" },
      { label: "السوكِت", value: "LGA 1700" }
    ],
    specLayout: "component",
    createdAt: daysAgo(15)
  },
  {
    id: "prd-518",
    slug: "amd-ryzen-9-7950x3d",
    name: "معالج AMD Ryzen 9 7950X3D — 16 نواة بتقنية 3D V-Cache",
    brand: "AMD",
    shortDescription: "الجمع الأسطوري بين قوة 16 نواة للمحترفين وسرعة كاش 3D للألعاب الخارقة.",
    description: "المعالج الذي ينهي الحيرة بين أداء الألعاب والتطبيقات الإنتاجية الثقيلة: شريحة 3D V-Cache مكدسة بإجمالي كاش 144MB تمنحك أعلى معدل إطارات ممكن، مع 16 نواة كاملة للرندر والبث المباشر بأعلى كفاءة طاقة.",
    price: 28500,
    oldPrice: 31000,
    promotionalLabel: "قمة تقنيات AMD",
    categoryId: "cat-parts",
    images: [IMAGES.cpu[0], IMAGES.cpu[1]],
    availability: "in-stock",
    stockQty: 3,
    featured: true,
    isNew: true,
    rating: 5.0,
    specs: [
      { label: "الأنوية / الخيوط", value: "16 نوى / 32 خيط" },
      { label: "الكاش الإجمالي", value: "144MB (L2+L3 3D V-Cache)" },
      { label: "التردد الأقصى", value: "5.7 GHz" },
      { label: "السوكِت", value: "AM5 (مع دعم حتى 2027)" }
    ],
    specLayout: "component",
    createdAt: daysAgo(4)
  },
  {
    id: "prd-519",
    slug: "amd-ryzen-5-7600x",
    name: "معالج AMD Ryzen 5 7600X — 6 نوى AM5",
    brand: "AMD",
    shortDescription: "بوابة الدخول لمنصة AM5 الحديثة ودعم DDR5 و PCIe 5.0.",
    description: "معالج سداسي النوى بمعمارية Zen 4 وتردد يصل لـ 5.3 جيجاهرتز. يقدم أداء ألعاب مذهل يتفوق على معالجات الجيل السابق الرائدة، مع دعم المنصة المستقبلية المستمرة لسنوات.",
    price: 8900,
    categoryId: "cat-parts",
    images: [IMAGES.cpu[1], IMAGES.cpu[2]],
    availability: "in-stock",
    stockQty: 10,
    featured: false,
    isNew: false,
    rating: 4.6,
    specs: [
      { label: "الأنوية / الخيوط", value: "6 نوى / 12 خيط" },
      { label: "التردد الأقصى", value: "5.3 GHz" },
      { label: "الكاش", value: "38MB إجمالي" },
      { label: "السوكِت", value: "AM5" }
    ],
    specLayout: "component",
    createdAt: daysAgo(19)
  },
  {
    id: "prd-520",
    slug: "asus-rog-maximus-z790-dark-hero",
    name: "لوحة أم ASUS ROG MAXIMUS Z790 DARK HERO",
    brand: "ASUS",
    shortDescription: "لوحة الأحلام لمحترفي كسر السرعة مع شبكة Wi-Fi 7 و 5 منافذ M.2 SSD.",
    description: "ASUS ROG Maximus Z790 Dark Hero: لوحة أم فاخرة بتصميم مظلم وشاشة Polymo Lighting متطورة، مراحل طاقة 20+1+2 بقدرة 90A، شبكة الجيل القادم Wi-Fi 7، ومنفذي Thunderbolt 4 مدمجين باللوحة الخلفية.",
    price: 32000,
    categoryId: "cat-parts",
    images: [IMAGES.motherboard[0], IMAGES.motherboard[1]],
    availability: "in-stock",
    stockQty: 2,
    featured: false,
    isNew: true,
    rating: 4.9,
    specs: [
      { label: "الشريحة", value: "Intel Z790 Chipset" },
      { label: "السوكِت", value: "LGA 1700 (الجيل 12 و 13 و 14)" },
      { label: "مراحل الطاقة", value: "20+1+2 Power Stages (90A)" },
      { label: "الشبكات", value: "Wi-Fi 7 + Intel 2.5Gb Ethernet" },
      { label: "منافذ التخزين", value: "5x M.2 (بما فيها PCIe 5.0)" }
    ],
    specLayout: "component",
    createdAt: daysAgo(7)
  },
  {
    id: "prd-521",
    slug: "msi-mag-b650-tomahawk-wifi",
    name: "لوحة أم MSI MAG B650 TOMAHAWK WIFI",
    brand: "MSI",
    shortDescription: "اللوحة الأكثر شعبية لمعالجات Ryzen 7000/8000 بتبريد ضخم ومكونات عسكرية متينة.",
    description: "سلسلة Tomahawk المشهورة بجودة دوائر الطاقة وتبريد الـ VRM الممتاز، توفر كل ما تحتاجه لتشغيل معالجات Ryzen 7800X3D و 7950X بأعلى استقرار، مع واي فاي 6E مدمج و 3 منافذ M.2 مغطاة بمشتتات Shield Frozr.",
    price: 11200,
    categoryId: "cat-parts",
    images: [IMAGES.motherboard[1], IMAGES.motherboard[0]],
    availability: "in-stock",
    stockQty: 7,
    featured: false,
    isNew: false,
    rating: 4.7,
    specs: [
      { label: "الشريحة", value: "AMD B650" },
      { label: "السوكِت", value: "AM5" },
      { label: "دوائر الطاقة", value: "14+2+1 Duet Rail Power System" },
      { label: "الذاكرة", value: "4x DDR5 حتى 7600+ MHz (OC)" }
    ],
    specLayout: "component",
    createdAt: daysAgo(11)
  },
  {
    id: "prd-522",
    slug: "nzxt-kraken-elite-360-rgb",
    name: "مبرد مائي NZXT Kraken Elite 360 RGB — شاشة LCD عريضة",
    brand: "NZXT",
    shortDescription: "شاشة زاهية 2.36 بوصة تعرض حرارة الجهاز وصور GIF ومراوح RGB قوية وهادئة.",
    description: "مبرد NZXT الرائد بمضخة Asetek من الجيل السابع تقدم تبريداً استثنائياً لأقوى المعالجات. الشاشة المدمجة تتيح لك تخصيص صور متحركة أو إحصائيات النظام بدقة 640x640 ومعدل تحديث 60 إطار في الثانية.",
    price: 13900,
    oldPrice: 15200,
    promotionalLabel: "شاشة LCD",
    categoryId: "cat-parts",
    images: [IMAGES.cooler[0], IMAGES.cooler[1]],
    availability: "in-stock",
    stockQty: 4,
    featured: true,
    isNew: true,
    rating: 4.9,
    specs: [
      { label: "حجم الرادياتير", value: "360mm (Aluminum)" },
      { label: "المراوح", value: "3x F120 RGB Core Fans (500-1800 RPM)" },
      { label: "الشاشة", value: "2.36\" Wide-Angle LCD 60Hz 690 nits" },
      { label: "التوافق", value: "Intel LGA 1700/1200/115X و AMD AM5/AM4" }
    ],
    specLayout: "component",
    createdAt: daysAgo(8)
  },
  {
    id: "prd-523",
    slug: "lian-li-o11-dynamic-evo-rgb",
    name: "كيس كمبيوتر Lian Li O11 Dynamic EVO RGB — زجاج بانورامي",
    brand: "Lian Li",
    shortDescription: "الكيس الأيقوني المفضل لهواة التجميعات مع إمكانية عكس اتجاه اللوحة وشرائط ARGB مزدوجة.",
    description: "يقدم O11D EVO RGB رؤية بانورامية مذهلة بدون عمود زاوية فاصل، مع شريطي إضاءة منتشرة في الأعلى والأسفل. يدعم حتى 3 رادياتيرات 360mm في نفس الوقت ومساحة عملاقة لترتيب الكابلات في الغرفة الخلفية.",
    price: 9800,
    categoryId: "cat-parts",
    images: [IMAGES.builds[4], IMAGES.builds[5]],
    availability: "in-stock",
    stockQty: 5,
    featured: false,
    isNew: true,
    rating: 4.8,
    specs: [
      { label: "النوع", value: "Dual-Chamber Mid-Tower Chassis" },
      { label: "المواد", value: "4mm Tempered Glass, Aluminum, Steel" },
      { label: "توافق اللوحات", value: "E-ATX, ATX, Micro-ATX, Mini-ITX" },
      { label: "أقصى طول لكارت الشاشة", value: "455 mm" }
    ],
    specLayout: "component",
    createdAt: daysAgo(13)
  },
  {
    id: "prd-524",
    slug: "corsair-rm1000e-gold-atx3",
    name: "مزود طاقة Corsair RM1000e 1000W — 80+ Gold معتمد ATX 3.0",
    brand: "Corsair",
    shortDescription: "طاقة مستقرة 1000 واط مع وصلة PCIe 5.0 12VHPWR مخصصة لكروت RTX 40 الحديثة.",
    description: "باور سبلاي Corsair RM1000e المعياري بالكامل Modular، يتميز بمكثفات يابانية عالية التحمل تتحمل حرارة 105C، وشهادة كفاءة 80 PLUS Gold ومروحة هادئة مع وضع الصفر RPM عند الأحمال المنخفضة.",
    price: 9200,
    categoryId: "cat-parts",
    images: [IMAGES.accessories[0], IMAGES.gpu[0]],
    availability: "in-stock",
    stockQty: 6,
    featured: false,
    isNew: false,
    rating: 4.7,
    specs: [
      { label: "القدرة", value: "1000 Watts Continuous" },
      { label: "شهادة الكفاءة", value: "80 PLUS Gold Certified" },
      { label: "المعيار", value: "ATX 3.0 & PCIe 5.0 Compliant" },
      { label: "الكيابل", value: "Fully Modular Flat Black Cables" }
    ],
    specLayout: "component",
    createdAt: daysAgo(17)
  },
  {
    id: "prd-525",
    slug: "deepcool-ak620-digital",
    name: "مشتت هوائي DeepCool AK620 DIGITAL — شاشة حرارة رقمية",
    brand: "DeepCool",
    shortDescription: "تبريد هوائي مزدوج الأبراج ينافس المبردات المائية مع شاشة رقمية تقرأ درجات الحرارة.",
    description: "DeepCool AK620 Digital يجمع بين 6 أنابيب حرارية نحاسية وبرجين من الزعانف مع مروحتين FDB هادئتين. يعرض على الغطاء العلوي درجة حرارة المعالج ونسبة استهلاكه بشكل لحظي عبر برنامج DeepCool الخفيف.",
    price: 4300,
    categoryId: "cat-parts",
    images: [IMAGES.cooler[1], IMAGES.cooler[0]],
    availability: "in-stock",
    stockQty: 9,
    featured: false,
    isNew: false,
    rating: 4.6,
    specs: [
      { label: "القدرة الحرارية TDP", value: "حتى 260W" },
      { label: "الأنابيب الحرارية", value: "6x 6mm Copper Heatpipes" },
      { label: "المراوح", value: "2x 120mm PWM Fluid Dynamic Bearing" },
      { label: "الشاشة", value: "Digital Real-Time Status Display" }
    ],
    specLayout: "component",
    createdAt: daysAgo(22)
  },

  /* ====================== STORAGE (8) ====================== */
  {
    id: "prd-526",
    slug: "samsung-990-pro-2tb-heatsink",
    name: "قرص تخزين Samsung 990 PRO NVMe M.2 SSD — 2TB بمشتت حراري",
    brand: "Samsung",
    shortDescription: "سرعة قراءة خيالية 7450 ميجابايت/ثانية بمشتت حراري مدمج متوافق مع PS5 والكمبيوتر.",
    description: "أسرع قرص PCIe 4.0 من سامسونج: يمنحك سرعات تحميل لحظية في أثقل الألعاب وتطبيقات تعديل الفيديو بدقة 8K، مع مشتت حراري بتصميم نحيف يحافظ على ثبات السرعة دون انخفاض في الأداء تحت الضغط المستمر.",
    price: 9600,
    oldPrice: 10500,
    promotionalLabel: "متوافق مع PS5",
    categoryId: "cat-storage",
    images: [IMAGES.storage[0], IMAGES.storage[1]],
    availability: "in-stock",
    stockQty: 8,
    featured: true,
    isNew: true,
    rating: 4.9,
    specs: [
      { label: "السعة", value: "2TB (2000GB)" },
      { label: "سرعة القراءة المتتابعة", value: "حتى 7,450 MB/s" },
      { label: "سرعة الكتابة المتتابعة", value: "حتى 6,900 MB/s" },
      { label: "الواجهة", value: "PCIe Gen 4.0 x4, NVMe 2.0" },
      { label: "التحمل TBW", value: "1200 Terabytes Written" }
    ],
    specLayout: "component",
    createdAt: daysAgo(3)
  },
  {
    id: "prd-527",
    slug: "wd-black-sn850x-1tb",
    name: "قرص تخزين WD_BLACK SN850X NVMe SSD — 1TB",
    brand: "Western Digital",
    shortDescription: "مخصص للألعاب الاحترافية مع وضع Game Mode 2.0 في لوحة تحكم WD_BLACK.",
    description: "أداء نقي للألعاب بدون تأخير: سرعات قراءة تصل إلى 7300 ميجابايت/ثانية وزمن وصول منخفض للغاية بفضل معمارية فلاش BiCS5 ثلاثية الأبعاد.",
    price: 4950,
    categoryId: "cat-storage",
    images: [IMAGES.storage[1], IMAGES.storage[2]],
    availability: "in-stock",
    stockQty: 12,
    featured: false,
    isNew: false,
    rating: 4.8,
    specs: [
      { label: "السعة", value: "1TB" },
      { label: "سرعة القراءة", value: "حتى 7,300 MB/s" },
      { label: "سرعة الكتابة", value: "حتى 6,300 MB/s" },
      { label: "الواجهة", value: "PCIe Gen4 x4" }
    ],
    specLayout: "component",
    createdAt: daysAgo(9)
  },
  {
    id: "prd-528",
    slug: "crucial-t700-gen5-1tb",
    name: "قرص تخزين Crucial T700 PCIe Gen5 NVMe — 1TB (سرعة 12400MB/s)",
    brand: "Crucial",
    shortDescription: "الجيل الخامس الخارق PCIe 5.0 بسرعة تفوق الضعف مقارنة بأسرع أقراص Gen4.",
    description: "للمستخدمين الباحثين عن تقنيات المستقبل: Crucial T700 بمتحكم Phison E26 وذاكرة Micron 232-layer 3D TLC، يصل لسرعة قراءة مهولة 12400 ميجابايت في الثانية للتعامل الفوري مع البيانات الضخمة ونماذج الذكاء الاصطناعي.",
    price: 9900,
    oldPrice: 11200,
    promotionalLabel: "تقنية PCIe 5.0",
    categoryId: "cat-storage",
    images: [IMAGES.storage[0], IMAGES.storage[3]],
    availability: "low-stock",
    stockQty: 2,
    featured: true,
    isNew: true,
    rating: 4.8,
    specs: [
      { label: "الواجهة", value: "PCIe Gen 5.0 x4 NVMe 2.0" },
      { label: "سرعة القراءة", value: "12,400 MB/s" },
      { label: "سرعة الكتابة", value: "11,800 MB/s" },
      { label: "التحمل", value: "600 TBW" }
    ],
    specLayout: "component",
    createdAt: daysAgo(5)
  },
  {
    id: "prd-529",
    slug: "kingston-kc3000-2tb",
    name: "قرص تخزين Kingston KC3000 PCIe 4.0 NVMe M.2 — 2TB",
    brand: "Kingston",
    shortDescription: "قيمة ممتازة وسرعة 7000 ميجابايت/ثانية مع موزع حرارة من الجرافين والألمنيوم.",
    description: "Kingston KC3000 يقدم سرعات استثنائية وثباتاً يدوم طويلاً بفضل المشتت الحراري من مركب الجرافين النحيف الذي يناسب أجهزة اللابتوب واللوحات الأم على حد سواء.",
    price: 8400,
    categoryId: "cat-storage",
    images: [IMAGES.storage[2], IMAGES.storage[0]],
    availability: "in-stock",
    stockQty: 7,
    featured: false,
    isNew: false,
    rating: 4.7,
    specs: [
      { label: "السعة", value: "2048 GB" },
      { label: "سرعة القراءة", value: "7,000 MB/s" },
      { label: "سرعة الكتابة", value: "7,000 MB/s" },
      { label: "مشتت الحرارة", value: "Graphene Aluminum Low-Profile" }
    ],
    specLayout: "component",
    createdAt: daysAgo(14)
  },
  {
    id: "prd-530",
    slug: "sandisk-extreme-pro-portable-ssd-1tb",
    name: "قرص SSD خارجي محمول SanDisk Extreme PRO — 1TB Type-C",
    brand: "SanDisk",
    shortDescription: "سرعة 2000 ميجابايت/ثانية وهيكل سيليكون متين مقاوم للصدمات والماء والغبار IP65.",
    description: "الرفيق الأساسي لصناع المحتوى والمصورين أثناء التنقل: سرعات NVMe متطورة عبر منفذ USB 3.2 Gen 2x2 وهيكل من الألومنيوم يشتت الحرارة مغلف بطبقة سيليكون ممتصة للصدمات لحماية بياناتك.",
    price: 5800,
    categoryId: "cat-storage",
    images: [IMAGES.storage[3], IMAGES.storage[1]],
    availability: "in-stock",
    stockQty: 6,
    featured: false,
    isNew: false,
    rating: 4.8,
    specs: [
      { label: "السعة", value: "1TB" },
      { label: "سرعة النقل", value: "حتى 2000 MB/s (USB 3.2 Gen 2x2)" },
      { label: "الحماية", value: "مقاومة السقوط حتى مترين ومعيار IP65" },
      { label: "التوصيل", value: "USB-C to USB-C + محول USB-A" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(10)
  },
  {
    id: "prd-531",
    slug: "seagate-barracuda-4tb-hdd",
    name: "هارد تخزين داخلي Seagate BarraCuda — 4TB HDD 5400RPM",
    brand: "Seagate",
    shortDescription: "سعة تخزينية ضخمة 4 تيرابايت للأرشيف ومكتبة الألعاب الكبيرة والفيديوهات.",
    description: "هارد داخلي موثوق بحجم 3.5 بوصة يوفر لك مساحة رحبة لتخزين مكتبة ألعابك الكاملة وملفات الوسائط المتعددة دون أن تشغل مساحة أقراص SSD الثمينة.",
    price: 4600,
    categoryId: "cat-storage",
    images: [IMAGES.storage[1], IMAGES.storage[0]],
    availability: "in-stock",
    stockQty: 11,
    featured: false,
    isNew: false,
    rating: 4.5,
    specs: [
      { label: "السعة", value: "4TB (4000GB)" },
      { label: "سرعة الدوران", value: "5400 RPM" },
      { label: "الكاش", value: "256MB" },
      { label: "الواجهة", value: "SATA 6Gb/s" }
    ],
    specLayout: "component",
    createdAt: daysAgo(25)
  },
  {
    id: "prd-532",
    slug: "lexar-nm790-2tb-nvme",
    name: "قرص تخزين Lexar NM790 NVMe M.2 SSD — 2TB",
    brand: "Lexar",
    shortDescription: "أفضل قيمة وأداء Gen4 في السوق بسرعة 7400 ميجابايت/ثانية واستهلاك طاقة منخفض.",
    description: "بمتحكم Maxiotech المبتكر بدون DRAM ولكن بتقنية HMB متطورة، يقدم Lexar NM790 كفاءة طاقة استثنائية وحرارة منخفضة جداً مع سرعات تنافس أثمن الأقراص في السوق.",
    price: 7200,
    categoryId: "cat-storage",
    images: [IMAGES.storage[0], IMAGES.storage[2]],
    availability: "in-stock",
    stockQty: 9,
    featured: false,
    isNew: true,
    rating: 4.8,
    specs: [
      { label: "السعة", value: "2TB" },
      { label: "سرعة القراءة", value: "7,400 MB/s" },
      { label: "سرعة الكتابة", value: "6,500 MB/s" },
      { label: "التحمل", value: "1500 TBW" }
    ],
    specLayout: "component",
    createdAt: daysAgo(7)
  },
  {
    id: "prd-533",
    slug: "crucial-p3-plus-1tb",
    name: "قرص تخزين Crucial P3 Plus PCIe 4.0 NVMe — 1TB",
    brand: "Crucial",
    shortDescription: "ترقية سهلة وسريعة بسعر اقتصادي للمكتب والألعاب اليومية.",
    description: "Crucial P3 Plus يوفر سرعات تفوق أقراص SATA بما يصل إلى 8 مرات، ويعد الخيار الأنسب لترقية سعة اللابتوب أو تثبيت نظام التشغيل وألعابك المفضلة.",
    price: 3600,
    categoryId: "cat-storage",
    images: [IMAGES.storage[2], IMAGES.storage[3]],
    availability: "in-stock",
    stockQty: 14,
    featured: false,
    isNew: false,
    rating: 4.6,
    specs: [
      { label: "السعة", value: "1000GB" },
      { label: "سرعة القراءة", value: "حتى 5,000 MB/s" },
      { label: "سرعة الكتابة", value: "حتى 4,200 MB/s" },
      { label: "الواجهة", value: "PCIe 4.0 NVMe M.2" }
    ],
    specLayout: "component",
    createdAt: daysAgo(18)
  },

  /* ====================== RAM (8) ====================== */
  {
    id: "prd-534",
    slug: "corsair-dominator-titanium-rgb-32gb-ddr5",
    name: "رامات Corsair Dominator Titanium RGB — 32GB (2x16GB) DDR5 6000MHz",
    brand: "Corsair",
    shortDescription: "أيقونة رامات DDR5 الفاخرة بإضاءة 11 مصباح Capellix RGB وأعلى جودة تصنيع.",
    description: "Dominator Titanium هي النخبة من كورسير: شرائح ذاكرة مختارة يدوياً بدقة فائقة، موزع حرارة من الألمنيوم النقي مع أغطية علوية قابلة للتغيير وتبريد DHX المبتكر، متوافقة مع ملفات Intel XMP 3.0 و AMD EXPO.",
    price: 8800,
    oldPrice: 9600,
    promotionalLabel: "فئة فاخرة",
    categoryId: "cat-ram",
    images: [IMAGES.ram[0], IMAGES.ram[1]],
    availability: "in-stock",
    stockQty: 4,
    featured: true,
    isNew: true,
    rating: 4.9,
    specs: [
      { label: "السعة", value: "32GB (2 × 16GB Kit)" },
      { label: "التردد", value: "6000 MHz" },
      { label: "التوقيت", value: "CL30-36-36-76" },
      { label: "الجهد", value: "1.40V" },
      { label: "دعم كسر السرعة", value: "Intel XMP 3.0 & AMD EXPO" }
    ],
    specLayout: "component",
    createdAt: daysAgo(6)
  },
  {
    id: "prd-535",
    slug: "gskill-trident-z5-rgb-32gb-ddr5",
    name: "رامات G.SKILL Trident Z5 RGB — 32GB (2x16GB) DDR5 6400MHz",
    brand: "G.SKILL",
    shortDescription: "سرعة خارقة 6400MHz وتصميم سهمي فضي مع شريط إضاءة كريستالي بانورامي.",
    description: "مصممة خصيصاً لكسر أرقام الأداء القياسية في معالجات الجيل 13 و 14 من إنتل ومعالجات AM5. موزع حرارة من الألمنيوم المصقول الفاخر مع دعم تخصيص الإضاءة عبر كافة برامج اللوحات الأم.",
    price: 7900,
    categoryId: "cat-ram",
    images: [IMAGES.ram[1], IMAGES.ram[2]],
    availability: "in-stock",
    stockQty: 5,
    featured: false,
    isNew: true,
    rating: 4.8,
    specs: [
      { label: "السعة", value: "32GB (2x16GB)" },
      { label: "السرعة", value: "DDR5-6400" },
      { label: "التوقيت", value: "CL32-39-39-102" },
      { label: "اللون", value: "Metallic Silver / Black" }
    ],
    specLayout: "component",
    createdAt: daysAgo(8)
  },
  {
    id: "prd-536",
    slug: "teamgroup-tforce-delta-rgb-white-32gb",
    name: "رامات TeamGroup T-Force Delta RGB White — 32GB (2x16GB) DDR5 6000MHz",
    brand: "TeamGroup",
    shortDescription: "الخيار الأجمل للتجميعات البيضاء بتصميم مستوحى من طائرات الشبح وزاوية إضاءة 120 درجة.",
    description: "إذا كنت تبني تجميعة باللون الأبيض الناصع، فإن رامات T-Force Delta RGB تقدم إضاءة بانورامية فائقة التوهج مع استقرار كامل ودعم لملفات AMD EXPO لتحقيق أقصى تردد بنقرة واحدة من الـ BIOS.",
    price: 6600,
    oldPrice: 7200,
    promotionalLabel: "مثالية للتجميعات البيضاء",
    categoryId: "cat-ram",
    images: [IMAGES.ram[2], IMAGES.ram[0]],
    availability: "in-stock",
    stockQty: 6,
    featured: true,
    isNew: true,
    rating: 4.8,
    specs: [
      { label: "السعة", value: "32GB (2x16GB Kit)" },
      { label: "التردد", value: "DDR5 6000MHz (CL30)" },
      { label: "اللون", value: "Pure White" },
      { label: "دعم المنصات", value: "Intel XMP 3.0 & AMD EXPO" }
    ],
    specLayout: "component",
    createdAt: daysAgo(5)
  },
  {
    id: "prd-537",
    slug: "kingston-fury-beast-rgb-32gb-ddr5",
    name: "رامات Kingston Fury Beast RGB — 32GB (2x16GB) DDR5 5600MHz",
    brand: "Kingston",
    shortDescription: "ثبات وجودة كينغستون الموثوقة مع تقنية Kingston Infrared Sync المبتكرة.",
    description: "تزامن إضاءة الـ RGB بالأشعة تحت الحمراء بين الوحدات دون الحاجة لكابلات إضافية. توفر أداء موثوقاً وسرعة استجابة مذهلة مع شهادة اعتماد لكافة اللوحات الأم العالمية.",
    price: 5900,
    categoryId: "cat-ram",
    images: [IMAGES.ram[3], IMAGES.ram[1]],
    availability: "in-stock",
    stockQty: 8,
    featured: false,
    isNew: false,
    rating: 4.7,
    specs: [
      { label: "السعة", value: "32GB (Kit of 2)" },
      { label: "التردد", value: "5600 MHz" },
      { label: "التوقيت", value: "CL36" },
      { label: "المشتت", value: "Low-Profile Heat Spreader" }
    ],
    specLayout: "component",
    createdAt: daysAgo(12)
  },
  {
    id: "prd-538",
    slug: "corsair-vengeance-rgb-pro-32gb-ddr4",
    name: "رامات Corsair Vengeance RGB PRO — 32GB (2x16GB) DDR4 3600MHz",
    brand: "Corsair",
    shortDescription: "ترقية DDR4 المثالية بأقوى إضاءة RGB مبرمجة عبر برنامج iCUE.",
    description: "الخيار الأفضل على الإطلاق لترقية أجهزة الجيل السابق ومنصة AM4 و LGA 1200: سعة 32 جيجا تمنح جهازك متنفساً واسعاً للألعاب الحديثة وبرامج المونتاج مع سرعة 3600MHz وتوقيت ممتاز.",
    price: 4800,
    categoryId: "cat-ram",
    images: [IMAGES.ram[0], IMAGES.ram[3]],
    availability: "in-stock",
    stockQty: 10,
    featured: false,
    isNew: false,
    rating: 4.7,
    specs: [
      { label: "النوع", value: "DDR4" },
      { label: "السعة", value: "32GB (2x16GB)" },
      { label: "التردد", value: "3600 MHz" },
      { label: "التوقيت", value: "CL18-22-22-42" }
    ],
    specLayout: "component",
    createdAt: daysAgo(21)
  },
  {
    id: "prd-539",
    slug: "gskill-ripjaws-v-16gb-ddr4",
    name: "رامات G.SKILL Ripjaws V — 16GB (2x8GB) DDR4 3200MHz",
    brand: "G.SKILL",
    shortDescription: "الخيار الاقتصادي الأكثر مبيعاً بدون بهرجة إضاءة — أداء نقي وسعر لا يُنافس.",
    description: "تعتبر Ripjaws V المعيار الذهبي للرامات الاقتصادية: موزع حرارة كلاسيكي أنيق باللون الأسود بارتفاع منخفض يناسب أضخم المشتتات الهوائية بدون أي تعارض في التركيب.",
    price: 2350,
    categoryId: "cat-ram",
    images: [IMAGES.ram[1], IMAGES.ram[3]],
    availability: "in-stock",
    stockQty: 15,
    featured: false,
    isNew: false,
    rating: 4.6,
    specs: [
      { label: "النوع", value: "DDR4" },
      { label: "السعة", value: "16GB (2 x 8GB Kit)" },
      { label: "السرعة", value: "3200 MHz" },
      { label: "التوقيت", value: "CL16-18-18-38" }
    ],
    specLayout: "component",
    createdAt: daysAgo(30)
  },
  {
    id: "prd-540",
    slug: "corsair-vengeance-lpx-16gb-ddr4",
    name: "رامات Corsair Vengeance LPX — 16GB (2x8GB) DDR4 3200MHz",
    brand: "Corsair",
    shortDescription: "تصميم منخفض الارتفاع متوافق مع كافة الكيسات والمبردات الهوائية الكبيرة.",
    description: "شهرة كورسير العريقة في الاستقرار: ألومنيوم نقي لتشتيت أسرع للحرارة وتوافق كامل مثبت مع لوحات إنتل و AMD على حد سواء.",
    price: 2200,
    categoryId: "cat-ram",
    images: [IMAGES.ram[3], IMAGES.ram[0]],
    availability: "in-stock",
    stockQty: 12,
    featured: false,
    isNew: false,
    rating: 4.5,
    specs: [
      { label: "السعة", value: "16GB (2x8GB)" },
      { label: "التردد", value: "3200 MHz" },
      { label: "التوقيت", value: "CL16" }
    ],
    specLayout: "component",
    createdAt: daysAgo(28)
  },
  {
    id: "prd-541",
    slug: "crucial-pro-64gb-ddr5-kit",
    name: "رامات Crucial Pro — 64GB (2x32GB) DDR5 5600MHz لمصممي المحتوى",
    brand: "Crucial",
    shortDescription: "سعة عملاقة 64 جيجابايت لأصحاب محطات العمل والرندرة والمحاكاة ثلاثية الأبعاد.",
    description: "لا مزيد من مشاكل نفاد الذاكرة في مشاريع After Effects أو Premiere 4K أو بيئات التطوير الافتراضية Docker. توفر رامات Crucial Pro ثباتاً استثنائياً بمعايير الذاكرة القياسية JEDEC مع دعم إضافي لـ XMP 3.0 و EXPO.",
    price: 11500,
    oldPrice: 12800,
    promotionalLabel: "سعة 64 جيجا",
    categoryId: "cat-ram",
    images: [IMAGES.ram[2], IMAGES.ram[1]],
    availability: "in-stock",
    stockQty: 3,
    featured: true,
    isNew: true,
    rating: 4.9,
    specs: [
      { label: "السعة", value: "64GB (2 × 32GB)" },
      { label: "السرعة", value: "DDR5-5600" },
      { label: "التوقيت", value: "CL46" },
      { label: "الجهد", value: "1.1V الموفر للطاقة" }
    ],
    specLayout: "component",
    createdAt: daysAgo(4)
  },

  /* ====================== KEYBOARDS (8) ====================== */
  {
    id: "prd-542",
    slug: "steelseries-apex-pro-tkl-gen3",
    name: "لوحة مفاتيح SteelSeries Apex Pro TKL (Gen 3) — أسرع كيبورد في العالم",
    brand: "SteelSeries",
    shortDescription: "سويتشات مغناطيسية OmniPoint 3.0 بتعديل مسافة الضغطة من 0.1mm إلى 4.0mm مع خاصية Rapid Trigger.",
    description: "الكيبورد المفضل للاعبي الـ Esports التنافسيين: خاصية Rapid Trigger تتيح إعادة الضغط الفوري على المفتاح بمجرد رفعه بجزء من المليمتر لتحركات خاطفة في Counter-Strike و Valorant. شاشة OLED ذكية لعرض الإشعارات والتحكم المباشر.",
    price: 11900,
    oldPrice: 13200,
    promotionalLabel: "سويتشات مغناطيسية",
    categoryId: "cat-keyboards",
    images: [IMAGES.keyboards[0], IMAGES.keyboards[1]],
    availability: "in-stock",
    stockQty: 4,
    featured: true,
    isNew: true,
    rating: 5.0,
    specs: [
      { label: "نوع السويتش", value: "OmniPoint 3.0 Adjustable HyperMagnetic" },
      { label: "حجم اللوحة", value: "TKL (80% Tenkeyless)" },
      { label: "نقطة التفعيل", value: "قابلة للتعديل من 0.1 مم حتى 4.0 مم" },
      { label: "الشاشة", value: "OLED Smart Display مدمجة" },
      { label: "أغطية المفاتيح", value: "Double Shot PBT عالية المتانة" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(2)
  },
  {
    id: "prd-543",
    slug: "razer-huntsman-v3-pro-tenkeyless",
    name: "لوحة مفاتيح Razer Huntsman V3 Pro TKL — سويتشات تناظرية",
    brand: "Razer",
    shortDescription: "سويتشات Gen-2 Analog Optical مع سرعة استجابة فورية وتحكم كامل بمسار الحركة.",
    description: "الجيل الثالث من سلسلة Huntsman الرائدة: مستشعرات ضوئية تناظرية توفر دقة تفعيل تصل لـ 0.1 مم، وعجلة تحكم رقمية متعددة الوظائف مع مؤشرات LED مصفوفية، ومسند معصم جلدي مغناطيسي مريح.",
    price: 10800,
    categoryId: "cat-keyboards",
    images: [IMAGES.keyboards[1], IMAGES.keyboards[2]],
    availability: "in-stock",
    stockQty: 5,
    featured: false,
    isNew: true,
    rating: 4.8,
    specs: [
      { label: "السويتشات", value: "Razer Gen-2 Analog Optical Switch" },
      { label: "معدل الاستجابة", value: "حتى 1000Hz مع تقنية Snap Tap" },
      { label: "اللوحة العلوية", value: "Brushed Aluminum 5052" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(5)
  },
  {
    id: "prd-544",
    slug: "logitech-g-pro-x-tkl-lightspeed",
    name: "لوحة مفاتيح Logitech G Pro X TKL Lightspeed Wireless — باللون الوردي الماجنتا",
    brand: "Logitech",
    shortDescription: "اتصال لاسلكي Lightspeed فائق السرعة وبطارية تدوم 50 ساعة مع حقيبة تنقل فاخرة.",
    description: "صممت بالتعاون مع مئات من محترفي الرياضات الإلكترونية حول العالم: تقدم تقنية Lightspeed اللاسلكية المعتمدة في بطولات العالم، مع سويتشات GX Brown الميكانيكية اللمسية وحقيبة حمل صلبة لحمايتها أثناء البطولات.",
    price: 9900,
    oldPrice: 11000,
    promotionalLabel: "إصدار Magenta المميز",
    categoryId: "cat-keyboards",
    images: [IMAGES.keyboards[2], IMAGES.keyboards[0]],
    availability: "in-stock",
    stockQty: 3,
    featured: true,
    isNew: true,
    rating: 4.9,
    specs: [
      { label: "الاتصال", value: "Lightspeed اللاسلكي + Bluetooth + Type-C" },
      { label: "السويتشات", value: "GX Tactile Switches" },
      { label: "البطارية", value: "حتى 50 ساعة لعب متواصل" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(7)
  },
  {
    id: "prd-545",
    slug: "asus-rog-azoth-75-custom-wireless",
    name: "لوحة مفاتيح ASUS ROG Azoth 75% Custom Gaming Keyboard",
    brand: "ASUS",
    shortDescription: "كيبورد كاستم جاهز بعزل صوتي من 3 طبقات سيليكون وسويتشات مشحمة مسبقاً وشاشة OLED.",
    description: "كيبورد يجمع متعة الكيبوردات الكاستم مع سهولة الجيمنج: مزود بسويتشات ROG NX ميكانيكية مشحمة من المصنع Krytox، وشاشة OLED لعرض الرسومات أو حالة النظام، مع مقبض تحكم جانبي ثلاثي الاتجاهات وحقيبة أدوات تشحيم كاملة مرفقة.",
    price: 12500,
    categoryId: "cat-keyboards",
    images: [IMAGES.keyboards[0], IMAGES.keyboards[2]],
    availability: "low-stock",
    stockQty: 2,
    featured: false,
    isNew: true,
    rating: 4.9,
    specs: [
      { label: "التصميم", value: "75% Form Factor مع Gasket Mount" },
      { label: "السويتشات", value: "ROG NX Red Linear (Hot-Swappable قابلة للتبديل)" },
      { label: "الاتصال", value: "ROG SpeedNova 2.4GHz + BT + USB" },
      { label: "البطارية", value: "أكثر من 2000 ساعة (مع إطفاء الشاشة والإضاءة)" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(11)
  },
  {
    id: "prd-546",
    slug: "keychron-q1-pro-qmk-wireless",
    name: "لوحة مفاتيح Keychron Q1 Pro QMK Custom Bluetooth Mechanical",
    brand: "Keychron",
    shortDescription: "هيكل ألومنيوم CNC ثقيل بالكامل ومقبض صوت روتاري ودعم كامل لنظامي Mac و Windows.",
    description: "كيبورد عشاق الكتابة والبرمجة الأول: وزن يصل لـ 1.7 كجم يثبت كالخرسانة على المكتب، عزل Gasket مزدوج يمنحك صوت نقرات عميق Thock، مع برمجة مفتوحة المصدر QMK/VIA لأي تخصيص تتخيله.",
    price: 9400,
    categoryId: "cat-keyboards",
    images: [IMAGES.keyboards[1], IMAGES.keyboards[0]],
    availability: "in-stock",
    stockQty: 4,
    featured: false,
    isNew: false,
    rating: 4.8,
    specs: [
      { label: "الهيكل", value: "Full CNC Machined 6063 Aluminum" },
      { label: "السويتشات", value: "Keychron K Pro Red Mechanical" },
      { label: "البرمجة", value: "QMK / VIA Web App" },
      { label: "التوافق", value: "Mac, Windows, Linux بنقرة زر" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(15)
  },
  {
    id: "prd-547",
    slug: "redragon-k552-kumara-rgb",
    name: "لوحة مفاتيح Redragon K552 Kumara RGB — ميكانيكية اقتصادية",
    brand: "Redragon",
    shortDescription: "الكيبورد الأكثر مبيعاً في مصر: ميكانيكي بالكامل بإضاءة RGB وهيكل معدني مقاوم للصدمات.",
    description: "المدخل الأكثر ثقة للمبتدئين في عالم الكيبوردات الميكانيكية: سويتشات زرقاء بنقرة صوتية واضحة Clicky، تصميم مدمج TKL يوفر مساحة واسعة للماوس على المكتب، ومقاوم لانسكاب السوائل الخفيف.",
    price: 1850,
    oldPrice: 2100,
    promotionalLabel: "أفضل مبيعاً",
    categoryId: "cat-keyboards",
    images: [IMAGES.keyboards[2], IMAGES.keyboards[1]],
    availability: "in-stock",
    stockQty: 20,
    featured: false,
    isNew: false,
    rating: 4.5,
    specs: [
      { label: "النوع", value: "Mechanical TKL (87 Keys)" },
      { label: "السويتشات", value: "Outemu Blue Clicky Switches" },
      { label: "الإضاءة", value: "RGB بأوضاع متعددة" },
      { label: "التوصيل", value: "USB مع موصل مطلي بالذهب" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(25)
  },
  {
    id: "prd-548",
    slug: "corsair-k70-rgb-pro",
    name: "لوحة مفاتيح Corsair K70 RGB PRO — سويتشات Cherry MX Red",
    brand: "Corsair",
    shortDescription: "معالجة فائقة السرعة بمعيار AXON 8000Hz ومفتاح البطولة Tournament Switch المخصص.",
    description: "سلسلة K70 الأسطورية تأتي بإطار من الألومنيوم المصقول، ومعدل استجابة 8000Hz ينقل ضغطاتك أسرع 8 مرات من الكيبوردات القياسية، مع مسند معصم مريح وأزرار تحكم كاملة بالوسائط مع بكرة صوت من الألومنيوم.",
    price: 7400,
    categoryId: "cat-keyboards",
    images: [IMAGES.keyboards[0], IMAGES.keyboards[1]],
    availability: "in-stock",
    stockQty: 6,
    featured: false,
    isNew: false,
    rating: 4.7,
    specs: [
      { label: "السويتشات", value: "CHERRY MX Red Linear الأصيلة" },
      { label: "معدل الاقتراع", value: "Hyper-Polling حتى 8,000Hz" },
      { label: "أغطية المفاتيح", value: "Precision-molded PBT Double-Shot" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(18)
  },
  {
    id: "prd-549",
    slug: "ducky-one-3-mini-rgb-60",
    name: "لوحة مفاتيح Ducky One 3 Mini — 60% Quack Mechanics",
    brand: "Ducky",
    shortDescription: "حجم صغير 60% بأعلى معايير Quack Mechanics وتبديل ساخن للسويتشات بدون لحام.",
    description: "العلامة التايوانية الشهيرة Ducky تقدم One 3 Mini بتوزيع وزن مثالي وطبقات عزل صوتي متطورة EVA foam تمنح كل ضغطة صوتاً نظيفاً وخالياً من الرنين، مع كابل Type-C مجدول قابل للفصل.",
    price: 5200,
    categoryId: "cat-keyboards",
    images: [IMAGES.keyboards[1], IMAGES.keyboards[2]],
    availability: "in-stock",
    stockQty: 5,
    featured: false,
    isNew: false,
    rating: 4.7,
    specs: [
      { label: "الحجم", value: "60% Ultra-Compact" },
      { label: "السويتشات", value: "Cherry MX Brown Tactile (Hot-Swap)" },
      { label: "أغطية المفاتيح", value: "Ducky True PBT Seamless" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(20)
  },

  /* ====================== MICE (8) ====================== */
  {
    id: "prd-550",
    slug: "logitech-g-pro-x-superlight-2",
    name: "ماوس Logitech G PRO X SUPERLIGHT 2 — وزن 60 جرام فقط",
    brand: "Logitech",
    shortDescription: "سيد ماوسات الرياضات الإلكترونية: حساس HERO 2 بدقة 32,000 DPI ومعدل 4000Hz لاسلكي.",
    description: "الماوس الأكثر استخداماً بين أبطال بطولات CS2 و Apex Legends و Valorant حول العالم: سويتشات هجينة LIGHTFORCE تجمع بين سرعة الاستجابة الضوئية وإحساس النقرة الميكانيكية الأصيل، مع شحن عبر منفذ Type-C وبطارية تدوم 95 ساعة.",
    price: 7800,
    oldPrice: 8500,
    promotionalLabel: "اختيار المحترفين",
    categoryId: "cat-mice",
    images: [IMAGES.mice[0], IMAGES.mice[1]],
    availability: "in-stock",
    stockQty: 7,
    featured: true,
    isNew: true,
    rating: 4.9,
    specs: [
      { label: "الوزن", value: "60 جرام فقط" },
      { label: "المستشعر", value: "HERO 2 (حتى 32,000 DPI / 500+ IPS)" },
      { label: "معدل التحديث", value: "4000Hz Polling Rate" },
      { label: "السويتشات", value: "Lightforce Optical-Mechanical" },
      { label: "عمر البطارية", value: "حتى 95 ساعة حركة مستمرة" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(3)
  },
  {
    id: "prd-551",
    slug: "razer-deathadder-v3-pro-wireless",
    name: "ماوس Razer DeathAdder V3 Pro Wireless — تصميم إرجونوميك مريح",
    brand: "Razer",
    shortDescription: "شكل DeathAdder الأسطوري بوزن ريشة 63 جرام ومستشعر Focus Pro 30K البصري.",
    description: "إذا كنت تفضل قبضة اليد الكاملة Palm Grip فإن DeathAdder V3 Pro هو الخيار المريح بلا منازع لساعات اللعب الطويلة دون أي إجهاد لعضلات اليد. سويتشات بصرية من الجيل الثالث بعمر 90 مليون نقرة خالية من مشاكل الـ Double Click.",
    price: 6900,
    oldPrice: 7500,
    promotionalLabel: "أقصى راحة لليد",
    categoryId: "cat-mice",
    images: [IMAGES.mice[1], IMAGES.mice[2]],
    availability: "in-stock",
    stockQty: 6,
    featured: false,
    isNew: true,
    rating: 4.8,
    specs: [
      { label: "الوزن", value: "63 جرام" },
      { label: "المستشعر", value: "Focus Pro 30K Optical Sensor" },
      { label: "البطارية", value: "حتى 90 ساعة مع Type-C" },
      { label: "التوصيل", value: "Razer HyperSpeed Wireless" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(7)
  },
  {
    id: "prd-552",
    slug: "razer-viper-v3-pro-ultra-lightweight",
    name: "ماوس Razer Viper V3 Pro — وزن 54 جرام ومعدل 8000Hz حقيقي",
    brand: "Razer",
    shortDescription: "التحفة الأحدث من ريزر: خفة متناهية 54 جرام مع دونجل 8000Hz اللاسلكي مرفق في العلبة.",
    description: "تمت إعادة هندسة شكل الفايبر بالكامل بتعاون مباشر مع نجوم بطولات VCT للألعاب التنافسية. ملمس ناعم كالحرير لا يحتاج لشريط مسك إضافي، مع مستشعر Focus Pro من الجيل الثاني الأكثر دقة في تاريخ الألعاب.",
    price: 8900,
    categoryId: "cat-mice",
    images: [IMAGES.mice[2], IMAGES.mice[0]],
    availability: "in-stock",
    stockQty: 4,
    featured: true,
    isNew: true,
    rating: 5.0,
    specs: [
      { label: "الوزن", value: "54 جرام خفة قياسية" },
      { label: "معدل الاقتراع", value: "8,000Hz HyperPolling دونجل مرفق" },
      { label: "المستشعر", value: "Gen-2 Focus Pro 35K" },
      { label: "أقدام الماوس", value: "100% Virgin Grade PTFE" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(2)
  },
  {
    id: "prd-553",
    slug: "logitech-mx-master-3s-performance",
    name: "ماوس Logitech MX Master 3S — ملك الإنتاجية والمونتاج",
    brand: "Logitech",
    shortDescription: "نقرات صامتة تماماً Quiet Clicks، عجلة MagSpeed الكهرومغناطيسية، ومستشعر 8K يعمل على الزجاج.",
    description: "الماوس المفضل عالمياً للمبرمجين والمصممين والمونتيرين: عجلة تمرير كهرومغناطيسية تتنقل بسرعة 1000 سطر في الثانية بنقرة واحدة، وعجلة إبهام جانبية للتنقل الأفقي في جداول Excel أو مسار التايم لاين لبرامج المونتاج.",
    price: 5600,
    oldPrice: 6200,
    promotionalLabel: "أفضل ماوس عمل ومونتاج",
    categoryId: "cat-mice",
    images: [IMAGES.mice[3], IMAGES.mice[1]],
    availability: "in-stock",
    stockQty: 8,
    featured: true,
    isNew: false,
    rating: 4.9,
    specs: [
      { label: "المستشعر", value: "Darkfield 8,000 DPI (يعمل حتى على الزجاج)" },
      { label: "النقرات", value: "Quiet Clicks صامتة بنسبة 90%" },
      { label: "عجلة التمرير", value: "MagSpeed SmartShift الكهرومغناطيسية" },
      { label: "البطارية", value: "حتى 70 يوماً بشحنة واحدة" },
      { label: "التوصيل", value: "Logi Bolt + Bluetooth حتى 3 أجهزة" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(10)
  },
  {
    id: "prd-554",
    slug: "steelseries-aerox-3-wireless",
    name: "ماوس SteelSeries Aerox 3 Wireless — تصميم خلية النحل خفيف الوزن",
    brand: "SteelSeries",
    shortDescription: "وزن 68 جرام بتصميم شبكي مفرغ مع معيار الحماية IP54 ضد الماء والأتربة وإضاءة RGB رائعة.",
    description: "أول ماوس جيمنج مفرغ بشهادة حماية AquaBarrier لحماية الدوائر الإلكترونية الداخلية من العرق والسوائل. بطارية تدوم حتى 200 ساعة وشحن سريع عبر منفذ USB-C.",
    price: 3800,
    categoryId: "cat-mice",
    images: [IMAGES.mice[0], IMAGES.mice[3]],
    availability: "in-stock",
    stockQty: 9,
    featured: false,
    isNew: false,
    rating: 4.6,
    specs: [
      { label: "الوزن", value: "68 جرام" },
      { label: "الحماية", value: "AquaBarrier IP54 مقاوم للغبار والماء" },
      { label: "المستشعر", value: "TrueMove Air 18,000 CPI" },
      { label: "الاتصال", value: "Quantum 2.0 Wireless + Bluetooth 5.0" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(14)
  },
  {
    id: "prd-555",
    slug: "pulsar-x2-v2-wireless-mini",
    name: "ماوس Pulsar X2 V2 Wireless Mini — وزن 51 جرام",
    brand: "Pulsar",
    shortDescription: "تصميم متناظر فائق النقاء بقبضة Claw Grip مثالية وسويتشات بصرية خالية من التأخير.",
    description: "العلامة الكورية المحبوبة في مجتمع محترفي الماوسات: بنية صلبة للغاية بلا ثقوب رغم وزنه الخيالي 51 جرام فقط، مع بكرة مشفرة Pulsar Blue Encoder وسوفت وير فائق الخفة بدون تثبيت.",
    price: 4900,
    categoryId: "cat-mice",
    images: [IMAGES.mice[1], IMAGES.mice[2]],
    availability: "in-stock",
    stockQty: 5,
    featured: false,
    isNew: true,
    rating: 4.8,
    specs: [
      { label: "الوزن", value: "51 جرام Ultra-lightweight" },
      { label: "المستشعر", value: "PAW3395 (26,000 DPI / 650 IPS)" },
      { label: "السويتشات", value: "Optical Switches سريعة" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(9)
  },
  {
    id: "prd-556",
    slug: "hyperx-pulsefire-haste-2-wireless",
    name: "ماوس HyperX Pulsefire Haste 2 Wireless — أسود",
    brand: "HyperX",
    shortDescription: "هيكل مصمت متين بوزن 61 جرام وبطارية مذهلة تدوم حتى 100 ساعة متواصلة.",
    description: "تطوير ضخم للجيل السابق: هيكل كامل بدون فتحات لتجنب تراكم الغبار مع الحفاظ على خفة الوزن 61 جرام، وسنسور HyperX 26K عالي الاستجابة وسويتشات مخصصة تدوم حتى 100 مليون ضغطة.",
    price: 3600,
    categoryId: "cat-mice",
    images: [IMAGES.mice[2], IMAGES.mice[1]],
    availability: "in-stock",
    stockQty: 10,
    featured: false,
    isNew: false,
    rating: 4.7,
    specs: [
      { label: "الوزن", value: "61g Solid Shell" },
      { label: "المستشعر", value: "HyperX 26K Sensor (up to 26,000 DPI)" },
      { label: "البطارية", value: "حتى 100 ساعة" },
      { label: "الكيبل", value: "HyperFlex 2 مرن جداً للشحن أثناء اللعب" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(18)
  },
  {
    id: "prd-557",
    slug: "razer-basilisk-v3-customizable",
    name: "ماوس Razer Basilisk V3 — 11 زر قابل للبرمجة مع إضاءة Chroma سفلي",
    brand: "Razer",
    shortDescription: "الماوس المفضل لألعاب الـ RPG والـ Battle Royale مع عجلة ذكية Tilt Wheel و 11 منطقة إضاءة.",
    description: "يقدم راحة قصوى مع مسند الإبهام وزر القناص Sniper Button المخصص لخفض الحساسية فورياً أثناء التصويب. عجلة HyperScroll الذكية تتحول تلقائياً من وضع التكة التكتيكي إلى الدوران الحر السريع.",
    price: 3100,
    categoryId: "cat-mice",
    images: [IMAGES.mice[3], IMAGES.mice[0]],
    availability: "in-stock",
    stockQty: 12,
    featured: false,
    isNew: false,
    rating: 4.6,
    specs: [
      { label: "الأزرار", value: "11 زر قابلة للتخصيص عبر Synapse" },
      { label: "المستشعر", value: "Focus+ 26K DPI Optical" },
      { label: "العجلة", value: "Razer HyperScroll Tilt Wheel" },
      { label: "الإضاءة", value: "11 Razer Chroma RGB Zones مع توهج سفلي Underglow" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(24)
  },

  /* ====================== ACCESSORIES, MONITORS & AUDIO (12) ====================== */
  {
    id: "prd-558",
    slug: "asus-rog-swift-oled-pg27aqdm",
    name: "شاشة ألعاب ASUS ROG Swift OLED PG27AQDM — 27 بوصة 240Hz 2K",
    brand: "ASUS",
    shortDescription: "لوحة OLED بدقة 1440p ومعدل تحديث 240Hz وزمن استجابة خيالي 0.03ms مع تبريد ذكي مخصص.",
    description: "شاشة الأحلام لجمهور ألعاب الشوتر والرياضات الإلكترونية: وضوح ألوان وتباين لا نهائي تقدمه تقنية OLED مع أسرع زمن استجابة في السوق 0.03ms GTG يمحو أي أثر للظلال والتغبيش. مجهزة بمشتت حراري مخصص وغطاء خلفي يمنع احتراق الشاشة Burn-in.",
    price: 44000,
    oldPrice: 48500,
    promotionalLabel: "شاشة OLED خارقة",
    categoryId: "cat-accessories",
    images: [IMAGES.monitors[0], IMAGES.monitors[1]],
    availability: "in-stock",
    stockQty: 3,
    featured: true,
    isNew: true,
    rating: 5.0,
    specs: [
      { label: "المقاس والدقة", value: "26.5\" QHD (2560 x 1440) OLED" },
      { label: "معدل التحديث", value: "240 Hz" },
      { label: "زمن الاستجابة", value: "0.03ms (Gray to Gray)" },
      { label: "السطوع وتدرج الألوان", value: "1000 nits (Peak HDR) / DCI-P3 99%" },
      { label: "المزامنة", value: "NVIDIA G-SYNC Compatible & AMD FreeSync Premium" }
    ],
    specLayout: "device",
    createdAt: daysAgo(3)
  },
  {
    id: "prd-559",
    slug: "samsung-odyssey-g7-32-curved-240hz",
    name: "شاشة ألعاب Samsung Odyssey G7 — 32 بوصة منحنية 1000R 240Hz 2K",
    brand: "Samsung",
    shortDescription: "انحناء عميق 1000R يغمر مجال رؤيتك بالكامل مع لوحة QLED بدقة 2560x1440 ومعدل 240Hz.",
    description: "تجمع شاشة Odyssey G7 بين وضوح ألوان QLED والتباين العالي لتقنية VA مع معدل تحديث تنافسي 240Hz وزمن استجابة 1ms. انحناء 1000R مطابق تماماً لمجال رؤية العين البشرية لتقليل إجهاد النظر.",
    price: 29500,
    oldPrice: 32000,
    promotionalLabel: "انحناء 1000R",
    categoryId: "cat-accessories",
    images: [IMAGES.monitors[1], IMAGES.monitors[2]],
    availability: "in-stock",
    stockQty: 4,
    featured: true,
    isNew: false,
    rating: 4.8,
    specs: [
      { label: "المقاس والشكل", value: "31.5\" Curved 1000R" },
      { label: "الدقة ومعدل التحديث", value: "WQHD (2560 x 1440) @ 240Hz" },
      { label: "تقنية اللوحة", value: "Quantum Dot QLED VA" },
      { label: "دعم HDR", value: "VESA DisplayHDR 600" }
    ],
    specLayout: "device",
    createdAt: daysAgo(8)
  },
  {
    id: "prd-560",
    slug: "msi-mag-274qrf-qd-e2",
    name: "شاشة ألعاب MSI MAG 274QRF QD E2 — 27 بوصة Rapid IPS 180Hz 2K",
    brand: "MSI",
    shortDescription: "تقنية Quantum Dot ونطاق ألوان فائق الاتساع Adobe RGB 98% مناسب للألعاب ومونتاج الفيديو بدقة عالية.",
    description: "أفضل توازن ممكن بين السعر ودقة الألوان للألعاب الاحترافية وصناعة المحتوى مع لوحة Rapid IPS سريعة الاستجابة ومنفذ Type-C يدعم شحن الأجهزة بقدرة 65W وعرض الفيديو في نفس الوقت.",
    price: 18500,
    categoryId: "cat-accessories",
    images: [IMAGES.monitors[2], IMAGES.monitors[0]],
    availability: "in-stock",
    stockQty: 6,
    featured: false,
    isNew: true,
    rating: 4.7,
    specs: [
      { label: "المقاس والدقة", value: "27\" WQHD (2560 x 1440)" },
      { label: "معدل التحديث والزمن", value: "180Hz / 1ms GtG" },
      { label: "الألوان", value: "Quantum Dot (Adobe RGB 98% / DCI-P3 94%)" },
      { label: "المنافذ", value: "USB Type-C (65W PD) + 2x HDMI 2.0b + DisplayPort 1.4a" }
    ],
    specLayout: "device",
    createdAt: daysAgo(11)
  },
  {
    id: "prd-561",
    slug: "hyperx-cloud-iii-wireless",
    name: "سماعة HyperX Cloud III Wireless Gaming Headset — بطارية 120 ساعة",
    brand: "HyperX",
    shortDescription: "خليفة أسطورة الراحة Cloud II مع بطارية خارقة تدوم حتى 120 ساعة ومايك مطور 10mm.",
    description: "HyperX تعيد تعريف الراحة في جلسات اللعب الماراثونية: وسائد أذن من الفوم الميموري الفاخر مغطاة بجلد ناعم، مشغلات صوتية 53mm مائلة مصممة خصيصاً لتحديد مواقع خطوات الأعداء بدقة، واتصال 2.4GHz مستقر للغاية.",
    price: 7600,
    oldPrice: 8300,
    promotionalLabel: "بطارية 120 ساعة",
    categoryId: "cat-accessories",
    images: [IMAGES.headphones[0], IMAGES.headphones[1]],
    availability: "in-stock",
    stockQty: 8,
    featured: true,
    isNew: true,
    rating: 4.9,
    specs: [
      { label: "المشغلات الصوتية", value: "Re-engineered 53mm Angled Drivers" },
      { label: "البطارية", value: "حتى 120 ساعة بشحنة واحدة" },
      { label: "الميكروفون", value: "10mm Ultra-clear مع مؤشر LED لكتم الصوت" },
      { label: "الصوت المحيطي", value: "DTS Headphone:X Spatial Audio مع تفعيل دائم" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(5)
  },
  {
    id: "prd-562",
    slug: "steelseries-arctis-nova-pro-wireless",
    name: "سماعة SteelSeries Arctis Nova Pro Wireless — نظام بطاريتين قابلتين للتبديل",
    brand: "SteelSeries",
    shortDescription: "سماعة الألعاب اللاسلكية الأرقى: عزل ضوضاء نشط ANC ونظام Infinity Power Swap لبطارية لا تنتهي أبداً.",
    description: "قمة الصوتيات في عالم الألعاب: تأتي مع وحدة تحكم خارجية OLED Base Station يمكنك توصيلها بجهازين (PC + PlayStation) والتبديل بينهما بلمسة زر، مع نظام بطاريتين يتم شحن إحداهما داخل المحطة بينما تستخدم الأخرى لتستمتع بلعب غير منقطع.",
    price: 18900,
    oldPrice: 20500,
    promotionalLabel: "عزل ضوضاء ANC",
    categoryId: "cat-accessories",
    images: [IMAGES.headphones[1], IMAGES.headphones[2]],
    availability: "in-stock",
    stockQty: 4,
    featured: true,
    isNew: true,
    rating: 4.9,
    specs: [
      { label: "الصوت", value: "Hi-Res Audio Certified مع مشغلات نيووديميوم متميزة" },
      { label: "عزل الضوضاء", value: "4-mic Hybrid Active Noise Cancellation" },
      { label: "النظام اللاسلكي", value: "2.4GHz بدون تأخير + اتصال Bluetooth متزامن" },
      { label: "البطاريات", value: "2x بطاريات ليثيوم قابلة للتبديل السريع" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(4)
  },
  {
    id: "prd-563",
    slug: "razer-blackshark-v2-pro-2023",
    name: "سماعة Razer BlackShark V2 Pro (نسخة 2023) — صوت بطولات الـ Esports",
    brand: "Razer",
    shortDescription: "مايكروفون خارق Razer HyperClear Super Wideband وبطارية تدوم 70 ساعة وضبط صوتي احترافي.",
    description: "تم تحسين نسخة 2023 بميكروفون يضاهي جودة مايكات الاستوديو الاحترافية ينقل دفء وتفاصيل صوتك الحقيقي، مع مشغلات TriForce Titanium 50mm لعزل نغمات الباس والميد والهاي بشكل منفصل ونقي.",
    price: 9800,
    categoryId: "cat-accessories",
    images: [IMAGES.headphones[2], IMAGES.headphones[0]],
    availability: "in-stock",
    stockQty: 5,
    featured: false,
    isNew: true,
    rating: 4.8,
    specs: [
      { label: "الميكروفون", value: "Razer HyperClear Super Wideband 32kHz" },
      { label: "المشغلات", value: "TriForce Titanium 50mm" },
      { label: "البطارية", value: "حتى 70 ساعة (15 دقيقة شحن = 6 ساعات لعب)" },
      { label: "الاتصال", value: "HyperSpeed Wireless + Bluetooth 5.2" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(9)
  },
  {
    id: "prd-564",
    slug: "shure-mv7-podcast-microphone",
    name: "مايكروفون Shure MV7 USB/XLR Podcast Microphone — أسود",
    brand: "Shure",
    shortDescription: "الميكروفون الديناميكي الأكثر شعبية للستريمرز والبودكاست بمخرج USB و XLR مدمجين معاً.",
    description: "مستوحى من الأسطورة SM7B: يركز الميكروفون على صوتك فقط ويتجاهل ضوضاء الغرفة ونقرات الكيبورد بفضل تقنية Voice Isolation. مخرج USB يتيح توصيله مباشرة بالكمبيوتر مع لوحة لمس للتحكم بالصوت وبرنامج ShurePlus MOTIV الذكي.",
    price: 13500,
    oldPrice: 14800,
    promotionalLabel: "صوت استوديو إذاعي",
    categoryId: "cat-accessories",
    images: [IMAGES.accessories[1], IMAGES.accessories[0]],
    availability: "in-stock",
    stockQty: 4,
    featured: true,
    isNew: false,
    rating: 4.9,
    specs: [
      { label: "النوع", value: "Dynamic (Cardioid)" },
      { label: "المخارج", value: "Dual USB-C and XLR Outputs" },
      { label: "دقة التسجيل", value: "24-bit / 48kHz" },
      { label: "المعالجة الداخلية", value: "Auto-Level Mode مع ضاغط ومحدد صوت مدمج DSP" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(7)
  },
  {
    id: "prd-565",
    slug: "hyperx-quadcast-s-rgb",
    name: "مايكروفون HyperX QuadCast S RGB USB Condenser",
    brand: "HyperX",
    shortDescription: "إضاءة RGB ديناميكية مذهلة مع حامل مضاد للصدمات مدمج وزر كتم صوت باللمس.",
    description: "المايكروفون الأكثر جاذبية في ستب الستريمرز وصناع المحتوى: 4 أنماط قطبية قابلة للتبديل (ستيريو، شامل الاتجاهات، قلبي، ثنائي)، مع فلتر هواء داخلي يمنع أصوات التنفس المزعجة وحامل صدمات يمتص اهتزازات المكتب.",
    price: 7800,
    categoryId: "cat-accessories",
    images: [IMAGES.accessories[0], IMAGES.accessories[1]],
    availability: "in-stock",
    stockQty: 6,
    featured: false,
    isNew: false,
    rating: 4.8,
    specs: [
      { label: "النوع", value: "Condenser مع 3 كبسولات 14mm" },
      { label: "الأنماط القطبية", value: "Stereo, Omnidirectional, Cardioid, Bidirectional" },
      { label: "الإضاءة", value: "RGB مخصصة عبر برنامج HyperX NGENUITY" },
      { label: "التحكم", value: "مستشعر كتم صوت باللمس Tap-to-Mute مع مؤشر LED" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(12)
  },
  {
    id: "prd-566",
    slug: "xbox-wireless-controller-carbon-black",
    name: "ذراع تحكم Microsoft Xbox Wireless Controller — Carbon Black",
    brand: "Microsoft",
    shortDescription: "يد التحكم القياسية المتوافقة تلقائياً مع Windows وأجهزة Xbox والهواتف الذكية عبر البلوتوث.",
    description: "تصميم مريح مع قبضة منقوشة مانعة للانزلاق على الأزرار والزناد والمصدات، وزر مشاركة Share مخصص لالتقاط لقطات الشاشة وتسجيل لقطات اللعب الرائعة.",
    price: 3300,
    oldPrice: 3600,
    promotionalLabel: "الأفضل للـ PC",
    categoryId: "cat-accessories",
    images: [IMAGES.controllers[0], IMAGES.controllers[1]],
    availability: "in-stock",
    stockQty: 12,
    featured: false,
    isNew: false,
    rating: 4.8,
    specs: [
      { label: "التوافق", value: "Windows 10/11, Xbox Series X|S, Xbox One, Android, iOS" },
      { label: "الاتصال", value: "Xbox Wireless + Bluetooth + Type-C" },
      { label: "منفذ الصوت", value: "مقبس سماعة رأس ستيريو 3.5 مم" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(15)
  },
  {
    id: "prd-567",
    slug: "sony-dualsense-wireless-midnight-black",
    name: "ذراع تحكم Sony PlayStation DualSense Wireless — Midnight Black",
    brand: "Sony",
    shortDescription: "ردود الفعل اللمسية المتقدمة Haptic Feedback وزنادات التكيف التفاعلية Adaptive Triggers.",
    description: "عش تجربة انغماس لا مثيل لها في ألعاب الـ PC المدعومة (مثل Spider-Man و Cyberpunk 2077 و Horizon): تشعر بقوة ارتداد السلاح ومقاومة الفرامل وأثر الأسطح تحت أصابعك مباشرة.",
    price: 3650,
    categoryId: "cat-accessories",
    images: [IMAGES.controllers[1], IMAGES.controllers[0]],
    availability: "in-stock",
    stockQty: 10,
    featured: false,
    isNew: false,
    rating: 4.8,
    specs: [
      { label: "الميزات المتقدمة", value: "Haptic Feedback & Adaptive Triggers" },
      { label: "الميكروفون", value: "ميكروفون ومكبر صوت مدمجان مع زر كتم" },
      { label: "البطارية", value: "بطارية مدمجة قابلة للشحن عبر USB-C" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(19)
  },
  {
    id: "prd-568",
    slug: "steelseries-qck-heavy-xxl-mousepad",
    name: "ماوس باد ألعاب SteelSeries QcK Heavy XXL — سماكة 6 ملم",
    brand: "SteelSeries",
    shortDescription: "مقاس عملاق 900x400 مم بسماكة إضافية 6 ملم تعوض عدم استواء الأسطح وتمنح حركة ماوس حريرية.",
    description: "القماش الأكثر تتويجاً في بطولات الجيمنج الاحترافية لأكثر من 15 عاماً: سطح من نسيج دقيق محكم يحسن دقة التتبع البصري والليزر، وقاعدة مطاطية ثقيلة تمنع أي انزلاق مهما كانت حركات يدك سريعة.",
    price: 1650,
    categoryId: "cat-accessories",
    images: [IMAGES.accessories[1], IMAGES.accessories[2]],
    availability: "in-stock",
    stockQty: 15,
    featured: false,
    isNew: false,
    rating: 4.8,
    specs: [
      { label: "الأبعاد", value: "900 mm × 400 mm" },
      { label: "السماكة", value: "6 mm Extra Thick Cushion" },
      { label: "القاعدة", value: "Non-slip Rubber Base" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(22)
  },
  {
    id: "prd-569",
    slug: "elgato-stream-deck-mk2-black",
    name: "وحدة تحكم الستريمرز Elgato Stream Deck MK.2 — 15 مفتاح LCD تفاعلي",
    brand: "Elgato",
    shortDescription: "تحكم فوري ببرامج البث OBS و Twitch و Discord و Spotify بنقرة زر واحدة على مفاتيح LCD ملونة.",
    description: "الأداة الأولى لكل صانع محتوى وستريمر ومبرمج: يمكنك برمجة كل زر لتشغيل مشاهد معينة، كتم الصوت، تشغيل مؤثرات صوتية، أو تشغيل أوامر برمجية معقدة عبر ضغطة واحدة، مع واجهات وتطبيقات لا نهائية في متجر Elgato.",
    price: 7900,
    oldPrice: 8700,
    promotionalLabel: "جهاز الستريمر الأساسي",
    categoryId: "cat-accessories",
    images: [IMAGES.accessories[0], IMAGES.accessories[2]],
    availability: "in-stock",
    stockQty: 5,
    featured: true,
    isNew: false,
    rating: 4.9,
    specs: [
      { label: "المفاتيح", value: "15 مفتاح LCD قابلة للتخصيص بالكامل" },
      { label: "الحامل", value: "حامل مكتبي بزاوية 45 درجة قابل للفصل" },
      { label: "التوصيل", value: "كابل USB-C to USB-A قابل للفصل" }
    ],
    specLayout: "accessory",
    createdAt: daysAgo(10)
  }
];

const newBuilds = [
  {
    id: "bld-005",
    slug: "monster-4k-i9-rtx4090",
    title: "تجميعة الوحش الأسطوري Monster 4K — Core i9 + RTX 4090",
    type: "gaming",
    description: "قمة ما وصل إليه عالم الكمبيوتر في العالم: تجميعة لا تعرف معنى المستحيل. تشغل أي لعبة في تاريخ الصناعة على دقة 4K بأقصى إعدادات ممكنة مع Ray Tracing و DLSS 3 بأكثر من 120 إطار في الثانية.",
    images: [
      IMAGES.builds[0],
      IMAGES.builds[4],
      IMAGES.builds[6]
    ],
    components: [
      { id: "c1", role: "معالج", name: "Intel Core i9-14900K", spec: "24 نواة / 6.0GHz", qty: 1, price: 24500 },
      { id: "c2", role: "كارت شاشة", name: "ASUS ROG Strix GeForce RTX 4090 OC", spec: "24GB GDDR6X", qty: 1, price: 98000 },
      { id: "c3", role: "لوحة أم", name: "ASUS ROG MAXIMUS Z790 DARK HERO", spec: "Wi-Fi 7 / PCIe 5.0", qty: 1, price: 32000 },
      { id: "c4", role: "ذاكرة", name: "Corsair Dominator Titanium RGB 64GB", spec: "2x32GB DDR5 6000MHz", qty: 1, price: 16500 },
      { id: "c5", role: "تخزين", name: "Samsung 990 PRO 2TB NVMe M.2", spec: "7450 MB/s Heatsink", qty: 2, price: 19200 },
      { id: "c6", role: "تبريد", name: "NZXT Kraken Elite 360 RGB LCD", spec: "360mm AIO Cooler", qty: 1, price: 13900 },
      { id: "c7", role: "باور سبلاي", name: "Corsair HX1200 Platinum ATX 3.0", spec: "1200W 80+ Platinum", qty: 1, price: 14500 },
      { id: "c8", role: "صندوق", name: "Lian Li O11 Dynamic EVO RGB Black", spec: "Dual Chamber Glass", qty: 1, price: 9800 }
    ],
    totalPrice: 228400,
    availability: "in-stock",
    performance: [
      { label: "ألعاب 4K Ultra", score: 100 },
      { label: "صناعة ورندرة 3D", score: 99 },
      { label: "الذكاء الاصطناعي LLM", score: 98 }
    ],
    featured: true
  },
  {
    id: "bld-006",
    slug: "esports-pro-240hz-7800x3d",
    title: "تجميعة Esports Pro 240Hz — Ryzen 7 7800X3D + RTX 4070 Ti SUPER",
    type: "gaming",
    description: "السلاح السري للاعبي البطولات: أسرع معالج ألعاب في الكوكب Ryzen 7 7800X3D مع كارت RTX 4070 Ti Super بذاكرة 16GB، صممت خصيصاً لتقديم ثبات إطارات أسطوري على شاشات الـ 240Hz والـ 360Hz.",
    images: [
      IMAGES.builds[1],
      IMAGES.builds[5],
      IMAGES.builds[7]
    ],
    components: [
      { id: "c1", role: "معالج", name: "AMD Ryzen 7 7800X3D", spec: "8-Core 3D V-Cache", qty: 1, price: 21900 },
      { id: "c2", role: "كارت شاشة", name: "MSI GeForce RTX 4070 Ti SUPER 16GB Ventus 3X", spec: "16GB GDDR6X", qty: 1, price: 42500 },
      { id: "c3", role: "لوحة أم", name: "MSI MAG B650 TOMAHAWK WIFI", spec: "AM5 DDR5", qty: 1, price: 11200 },
      { id: "c4", role: "ذاكرة", name: "G.SKILL Flare X5 32GB (2x16GB)", spec: "DDR5 6000MHz CL30 EXPO", qty: 1, price: 6800 },
      { id: "c5", role: "تخزين", name: "Kingston KC3000 1TB NVMe M.2", spec: "7000 MB/s", qty: 1, price: 4800 },
      { id: "c6", role: "تبريد", name: "Thermalright Peerless Assassin 120 SE ARGB", spec: "Dual Tower Cooler", qty: 1, price: 2900 },
      { id: "c7", role: "باور سبلاي", name: "MSI MAG A850GL 850W PCIe 5.0", spec: "80+ Gold Modular", qty: 1, price: 6400 },
      { id: "c8", role: "صندوق", name: "NZXT H6 Flow RGB Black", spec: "Dual Chamber Panoramic", qty: 1, price: 6500 }
    ],
    totalPrice: 103000,
    availability: "in-stock",
    performance: [
      { label: "ألعاب Esports 240Hz", score: 98 },
      { label: "ألعاب 2K QHD Max", score: 94 },
      { label: "استقرار وثبات الحرارة", score: 96 }
    ],
    featured: true
  },
  {
    id: "bld-007",
    slug: "pure-snow-white-rgb",
    title: "تجميعة الثلج الأبيض Pure Snow RGB — Ryzen 5 + RTX 4060 Ti White",
    type: "gaming",
    description: "جمالية بيضاء نقية تأسر الأنظار: كل قطعة تم اختيارها بعناية لتكون باللون الأبيض الناصع مع إضاءة ARGB متناغمة تعطي ستبك طابعاً مستقبلياً ساحراً.",
    images: [
      IMAGES.builds[2],
      IMAGES.builds[4],
      IMAGES.builds[6]
    ],
    components: [
      { id: "c1", role: "معالج", name: "AMD Ryzen 5 7600X", spec: "6-Core AM5 5.3GHz", qty: 1, price: 8900 },
      { id: "c2", role: "كارت شاشة", name: "Gigabyte GeForce RTX 4060 Ti AERO OC White", spec: "8GB GDDR6", qty: 1, price: 21500 },
      { id: "c3", role: "لوحة أم", name: "ASUS ROG STRIX B650-A GAMING WIFI White", spec: "White Theme AM5", qty: 1, price: 13500 },
      { id: "c4", role: "ذاكرة", name: "TeamGroup T-Force Delta RGB White 32GB", spec: "2x16GB DDR5 6000MHz", qty: 1, price: 6600 },
      { id: "c5", role: "تخزين", name: "Lexar NM790 1TB NVMe", spec: "7400 MB/s", qty: 1, price: 4200 },
      { id: "c6", role: "تبريد", name: "DeepCool LS520 SE WH 240mm White", spec: "White AIO Liquid", qty: 1, price: 4500 },
      { id: "c7", role: "باور سبلاي", name: "Corsair RM750e White 750W", spec: "80+ Gold Modular", qty: 1, price: 5800 },
      { id: "c8", role: "صندوق", name: "Lian Li O11 Vision White", spec: "Triple-Glass Seamless", qty: 1, price: 8900 }
    ],
    totalPrice: 73900,
    availability: "in-stock",
    performance: [
      { label: "ألعاب 1080p & 1440p", score: 88 },
      { label: "جمالية التصميم الأبيض", score: 100 },
      { label: "كفاءة التبريد والهدوء", score: 92 }
    ],
    featured: false
  },
  {
    id: "bld-008",
    slug: "creator-studio-pro-i7-14700k",
    title: "تجميعة الاستوديو والمبدعين Creator Studio Pro — Core i7 + 64GB RAM",
    type: "creator",
    description: "محطة عمل متكاملة لمحرري الفيديو 4K/8K، صناع المؤثرات البصرية 3D، ومهندسي الصوتيات. مجهزة بـ 64 جيجا رام وقرصين NVMe فائقين لمعالجة التايم لاين الثقيل بسلاسة فورية.",
    images: [
      IMAGES.builds[3],
      IMAGES.builds[0],
      IMAGES.builds[7]
    ],
    components: [
      { id: "c1", role: "معالج", name: "Intel Core i7-14700K", spec: "20 نواة / 28 خيط", qty: 1, price: 18900 },
      { id: "c2", role: "كارت شاشة", name: "ASUS ProArt GeForce RTX 4070 SUPER OC", spec: "12GB GDDR6X", qty: 1, price: 36500 },
      { id: "c3", role: "لوحة أم", name: "ASUS ProArt Z790-CREATOR WIFI", spec: "Thunderbolt 4 / 10G LAN", qty: 1, price: 22000 },
      { id: "c4", role: "ذاكرة", name: "Crucial Pro 64GB Kit (2x32GB)", spec: "DDR5 5600MHz", qty: 1, price: 11500 },
      { id: "c5", role: "تخزين", name: "Samsung 990 PRO 2TB NVMe M.2", spec: "System & Cache Drive", qty: 1, price: 9600 },
      { id: "c6", role: "تخزين إضافي", name: "Crucial P3 Plus 2TB M.2", spec: "Project Storage", qty: 1, price: 5800 },
      { id: "c7", role: "تبريد", name: "DeepCool LT720 360mm High-Performance", spec: "Multi-dimensional Infinity Mirror", qty: 1, price: 5400 },
      { id: "c8", role: "باور سبلاي", name: "Corsair RM850x 850W Gold", spec: "80+ Gold Silent", qty: 1, price: 7200 },
      { id: "c9", role: "صندوق", name: "Fractal Design North Charcoal Black", spec: "Real Walnut Front Panel", qty: 1, price: 8200 }
    ],
    totalPrice: 125100,
    availability: "in-stock",
    performance: [
      { label: "رندرة Premiere & DaVinci", score: 97 },
      { label: "تصميم 3D Blender/Maya", score: 95 },
      { label: "تعدد المهام وسعة الذاكرة", score: 98 }
    ],
    featured: true
  }
];

async function main() {
  console.log("Checking database...");
  const initialProductsCount = await prisma.product.count();
  const initialBuildsCount = await prisma.pCBuild.count();
  console.log(`Current DB: ${initialProductsCount} products, ${initialBuildsCount} builds`);

  console.log(`\nAdding ${newProducts.length} new high-quality products...`);
  let addedProducts = 0;
  for (const p of newProducts) {
    const exists = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (exists) {
      console.log(`- Product with slug ${p.slug} already exists, skipping.`);
      continue;
    }
    await prisma.product.create({
      data: {
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        shortDescription: p.shortDescription,
        description: p.description,
        price: p.price,
        oldPrice: p.oldPrice || null,
        promotionalLabel: p.promotionalLabel || null,
        categoryId: p.categoryId,
        images: p.images,
        availability: p.availability,
        stockQty: p.stockQty,
        featured: p.featured,
        isNew: p.isNew,
        rating: p.rating,
        specs: p.specs,
        specLayout: p.specLayout,
        heroEligible: true,
        createdAt: p.createdAt
      }
    });
    addedProducts++;
  }
  console.log(`Successfully added ${addedProducts} products!`);

  console.log(`\nAdding ${newBuilds.length} new PC builds...`);
  let addedBuilds = 0;
  for (const b of newBuilds) {
    const exists = await prisma.pCBuild.findUnique({ where: { slug: b.slug } });
    if (exists) {
      console.log(`- Build with slug ${b.slug} already exists, skipping.`);
      continue;
    }
    await prisma.pCBuild.create({
      data: {
        id: b.id,
        slug: b.slug,
        title: b.title,
        type: b.type,
        description: b.description,
        images: b.images,
        components: b.components,
        totalPrice: b.totalPrice,
        availability: b.availability,
        performance: b.performance,
        featured: b.featured
      }
    });
    addedBuilds++;
  }
  console.log(`Successfully added ${addedBuilds} builds!`);

  const finalProductsCount = await prisma.product.count();
  const finalBuildsCount = await prisma.pCBuild.count();
  console.log(`\n========================================`);
  console.log(`Database updated successfully!`);
  console.log(`Total Products: ${finalProductsCount} (was ${initialProductsCount})`);
  console.log(`Total PC Builds: ${finalBuildsCount} (was ${initialBuildsCount})`);
  console.log(`========================================`);
}

main()
  .catch((err) => {
    console.error("Error adding mock data:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
