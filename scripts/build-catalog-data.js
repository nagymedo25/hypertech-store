const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../data/source-inventory.csv');
const raw = fs.readFileSync(csvPath, 'utf8');
const lines = raw.split(/\r?\n/);

// Model visual profile and image map
const MODEL_IMAGES = {
  // Lenovo Gaming
  'loq': ['/products/laptop-gaming-3.png', '/products/laptop-tough.png'],
  'ideapad-gaming': ['/products/laptop-gaming-1.png', '/products/laptop-tough.png'],
  'legion': ['/products/laptop-gaming-1.png', '/products/laptop-gaming-3.png'],
  
  // Acer Gaming
  'nitro': ['/products/laptop-gaming-2.png', '/products/laptop-tough.png'],
  'travelmate': ['/products/laptop-business.png', '/products/laptop-silver.png'],
  
  // Dell Gaming & Workstation
  'dell-g15': ['/products/laptop-gaming-3.png', '/products/laptop-gaming-1.png'],
  'precision': ['/products/laptop-tough.png', '/products/laptop-business.png'],
  'latitude': ['/products/laptop-business.png', '/products/laptop-used.png'],
  'vostro': ['/products/laptop-business.png', '/products/laptop-silver.png'],
  'inspiron': ['/products/laptop-silver.png', '/products/laptop-business.png'],
  
  // HP
  'victus': ['/products/laptop-gaming-2.png', '/products/laptop-gaming-3.png'],
  'pavilion': ['/products/laptop-gaming-1.png', '/products/laptop-silver.png'],
  'spectre': ['/products/laptop-silver.png', '/products/laptop-tough.png'],
  'elitebook': ['/products/laptop-silver.png', '/products/laptop-business.png'],
  'probook': ['/products/laptop-silver.png', '/products/laptop-business.png'],
  'hp-250': ['/products/laptop-business.png', '/products/laptop-used.png'],
  'hp-15': ['/products/laptop-silver.png', '/products/laptop-used.png'],
  
  // Asus
  'tuf': ['/products/laptop-tough.png', '/products/laptop-gaming-1.png'],
  'vivobook': ['/products/laptop-silver.png', '/products/laptop-business.png'],
  
  // MSI
  'msi': ['/products/laptop-gaming-2.png', '/products/laptop-gaming-1.png'],
  
  // Lenovo Business / Everyday
  'thinkpad': ['/products/laptop-business.png', '/products/laptop-used.png'],
  'thinkbook': ['/products/laptop-silver.png', '/products/laptop-business.png'],
  'yoga': ['/products/laptop-silver.png', '/products/laptop-used.png'],
  'ideapad': ['/products/laptop-silver.png', '/products/laptop-business.png'],
  'slim': ['/products/laptop-silver.png', '/products/laptop-used.png'],
  
  // Apple
  'macbook': ['/products/laptop-silver.png'],
  'mac-mini': ['/products/usb-hub.png'], // desktop/mini placeholder
  
  // Components
  'ssd': ['/products/motherboard.png'],
  'hdd': ['/products/cooler-pad.png'],
  'ram': ['/products/gpu-1.png']
};

function getImagesForModel(modelName, category) {
  const m = modelName.toLowerCase();
  if (category === 'cat-storage') {
    if (m.includes('ssd')) return ['https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/78a882a1b9b1.jpg', 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/472e9b876596.jpg'];
    return ['https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/3838ff706b2e.png'];
  }
  if (category === 'cat-ram') {
    return ['https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/145eadf5235c.jpg', 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/9c971904f89c.jpg'];
  }
  if (category === 'cat-computers') {
    return ['https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/303fdafa8a63.jpeg', 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/419b10f3e8ec.jpg'];
  }

  // Laptop matching
  if (m.includes('loq')) return MODEL_IMAGES['loq'];
  if (m.includes('ideapad gaming')) return MODEL_IMAGES['ideapad-gaming'];
  if (m.includes('legion') || m.includes('legon')) return MODEL_IMAGES['legion'];
  if (m.includes('nitro')) return MODEL_IMAGES['nitro'];
  if (m.includes('travel')) return MODEL_IMAGES['travelmate'];
  if (m.includes('g15')) return MODEL_IMAGES['dell-g15'];
  if (m.includes('precision')) return MODEL_IMAGES['precision'];
  if (m.includes('latitude')) return MODEL_IMAGES['latitude'];
  if (m.includes('vostro')) return MODEL_IMAGES['vostro'];
  if (m.includes('inspiron')) return MODEL_IMAGES['inspiron'];
  if (m.includes('victus')) return MODEL_IMAGES['victus'];
  if (m.includes('pavlion') || m.includes('pavilion')) return MODEL_IMAGES['pavilion'];
  if (m.includes('specter') || m.includes('spectre')) return MODEL_IMAGES['spectre'];
  if (m.includes('elitebook')) return MODEL_IMAGES['elitebook'];
  if (m.includes('probook')) return MODEL_IMAGES['probook'];
  if (m.includes('250 g7')) return MODEL_IMAGES['hp-250'];
  if (m.includes('hp 15')) return MODEL_IMAGES['hp-15'];
  if (m.includes('tuf')) return MODEL_IMAGES['tuf'];
  if (m.includes('vivo')) return MODEL_IMAGES['vivobook'];
  if (m.includes('msi') || m.includes('cyborg') || m.includes('cyporg') || m.includes('katana') || m.includes('gf65')) return MODEL_IMAGES['msi'];
  if (m.includes('thinkpad')) return MODEL_IMAGES['thinkpad'];
  if (m.includes('thinkbook')) return MODEL_IMAGES['thinkbook'];
  if (m.includes('yoga')) return MODEL_IMAGES['yoga'];
  if (m.includes('slim')) return MODEL_IMAGES['slim'];
  if (m.includes('ideapad')) return MODEL_IMAGES['ideapad'];
  if (m.includes('macbook')) return MODEL_IMAGES['macbook'];

  // Fallback
  return category === 'cat-gaming' ? MODEL_IMAGES['loq'] : MODEL_IMAGES['latitude'];
}

function normalizeBrand(modelName, rawCpu) {
  const m = modelName.toUpperCase();
  if (m.startsWith('LENOVO')) return 'Lenovo';
  if (m.startsWith('DELL')) return 'Dell';
  if (m.startsWith('HP')) return 'HP';
  if (m.startsWith('ASUS')) return 'ASUS';
  if (m.startsWith('ACER')) return 'Acer';
  if (m.startsWith('MSI')) return 'MSI';
  if (m.startsWith('MACBOOK') || m.startsWith('MAC MINI') || m.startsWith('APPLE')) return 'Apple';
  if (m.startsWith('SSD') || m.startsWith('HDD')) {
    if (m.includes('NVME') || m.includes('M2') || m.includes('M.2')) return 'Samsung / Kingston';
    return 'Western Digital / Seagate';
  }
  if (/DDR/i.test(m)) return 'Kingston / Crucial';
  return 'HyperTech';
}

function parseHardwareSpecs(model, cpu, ram, hard, vga, monitor, charger, cond) {
  // Processor details
  let cpuVendor = 'Intel';
  let cpuNormalized = cpu.trim();
  if (/RYZEN/i.test(cpu) || /AMD/i.test(cpu)) cpuVendor = 'AMD';
  else if (/M1|M2|M3/i.test(cpu) || /MAC/i.test(model)) cpuVendor = 'Apple Silicon';
  else if (/SNAPDRAGON/i.test(cpu)) cpuVendor = 'Qualcomm';
  
  // Format CPU nicely
  if (/^I[3579]\b/i.test(cpuNormalized)) {
    cpuNormalized = 'Intel Core ' + cpuNormalized;
  } else if (/^CORE\s+I[3579]/i.test(cpuNormalized)) {
    cpuNormalized = cpuNormalized.replace(/CORE\s+/i, 'Intel Core ');
  } else if (/^CORE\s+[357]\b/i.test(cpuNormalized)) {
    cpuNormalized = cpuNormalized.replace(/CORE\s+/i, 'Intel Core ');
  } else if (/^RYZEN/i.test(cpuNormalized)) {
    cpuNormalized = 'AMD ' + cpuNormalized;
  }

  // RAM details
  let ramCap = '8GB';
  let ramType = 'DDR4';
  const ramMatch = ram.match(/(\d+)\s*(DDR[45]|LPDDR[45]|)/i);
  if (ramMatch) {
    ramCap = `${ramMatch[1]}GB`;
    if (ramMatch[2]) ramType = ramMatch[2].toUpperCase();
    else if (/DDR5/i.test(cpu) || /13\d{2}0|14\d{2}0|7840|7435/i.test(cpu)) ramType = 'DDR5';
  }

  // Storage details
  let storageCap = '512GB';
  let storageType = 'SSD M.2 NVMe';
  if (/1TB|2TB/i.test(hard)) {
    storageCap = hard.includes('2TB') ? '2TB' : '1TB';
  } else if (/256/i.test(hard)) {
    storageCap = '256GB';
  } else if (/128/i.test(hard)) {
    storageCap = '128GB';
  } else if (/500/i.test(hard)) {
    storageCap = '500GB';
  } else if (/512/i.test(hard)) {
    storageCap = '512GB';
  }

  if (/NVME/i.test(hard) || /M2|M\.2/i.test(hard)) {
    storageType = 'SSD M.2 NVMe PCIe High-Speed';
  } else if (/SSHD/i.test(hard)) {
    storageType = '500GB SSHD هجين فائق السرعة';
  } else if (/HDD/i.test(hard)) {
    storageType = hard.includes('+') ? `${hard} (SSD + HDD)` : 'HDD 5400 RPM';
  } else if (/SSD/i.test(hard)) {
    storageType = 'SSD فائق السرعة';
  }

  // GPU details
  let gpuNormalized = vga.trim();
  let isDedicated = false;
  if (/RTX|GTX|GEFORCE|QUADRO|QUDRO|MX|NVIDIA/i.test(vga)) {
    isDedicated = true;
    if (/QUDRO/i.test(gpuNormalized)) gpuNormalized = gpuNormalized.replace(/QUDRO/i, 'NVIDIA Quadro');
    else if (!/NVIDIA/i.test(gpuNormalized)) gpuNormalized = 'NVIDIA ' + gpuNormalized;
  } else if (/IRIS/i.test(vga)) {
    gpuNormalized = 'Intel Iris Xe Graphics';
  } else if (/INTEL/i.test(vga) || !vga) {
    gpuNormalized = 'Intel UHD Graphics';
  } else if (/ADRENO/i.test(vga)) {
    gpuNormalized = 'Qualcomm Adreno GPU';
  } else if (/M1|M2/i.test(cpu)) {
    gpuNormalized = `${cpu} Integrated GPU (Apple 8/10 Core)`;
  }

  // Display details
  let dispSize = '15.6 بوصة';
  let dispRes = 'FHD (1920x1080)';
  let dispHz = '60Hz';
  let dispTech = 'IPS Anti-Glare';
  let isTouch = false;

  if (/14/i.test(monitor)) dispSize = '14.0 بوصة';
  else if (/16/i.test(monitor)) dispSize = '16.0 بوصة';
  else if (/17/i.test(monitor)) dispSize = '17.3 بوصة';
  else if (/15/i.test(monitor)) dispSize = '15.6 بوصة';

  if (/2K/i.test(monitor)) dispRes = '2K QHD (2560x1440 / 2560x1600)';
  else if (/4K/i.test(monitor)) dispRes = '4K UHD (3840x2160) OLED';
  else dispRes = 'Full HD (1920x1080)';

  if (/165HZ/i.test(monitor)) dispHz = '165Hz فائق السرعة';
  else if (/144HZ/i.test(monitor)) dispHz = '144Hz احترافي';
  else if (/120HZ/i.test(monitor)) dispHz = '120Hz سلس';

  if (/TOUCH|TOCH/i.test(monitor)) isTouch = true;
  if (/X360|360/i.test(monitor)) dispTech += ' — شاشة لمس متحولة 360 درجة (2-in-1)';
  else if (isTouch) dispTech += ' — تدعم اللمس التفاعلي (Touchscreen)';

  // Condition details
  let conditionText = 'فرز أول بحالة الزيرو الممتازة (Grade A)';
  if (/BOX/i.test(cond)) conditionText = 'بحالة ممتازة مع الكرتونة الأصلية (BOX)';
  else if (/NEW/i.test(cond)) conditionText = 'جديد تماماً غير مستعمل (Brand New)';
  else if (/DONE/i.test(cond)) conditionText = 'تم الفحص الفني الشامل واختبار كل المنافذ والحرارة (Ready & Tested)';
  else if (/صيانه|SERV/i.test(cond)) conditionText = 'تم عمل صيانة دورية شاملة وتنظيف وتغيير معجون حراري احترافي';

  if (charger) {
    conditionText += ` مع شاحن أصلي (${charger})`;
  } else {
    conditionText += ' مع شاحن أصلي وكابل الطاقة';
  }

  return {
    cpuVendor,
    cpuNormalized,
    ramCap,
    ramType,
    storageCap,
    storageType,
    gpuNormalized,
    isDedicated,
    dispSize,
    dispRes,
    dispHz,
    dispTech,
    isTouch,
    conditionText
  };
}

// Market-accurate estimated pricing table for rows with no price in sheet
const ESTIMATED_PRICES = {
  'LOQ-i7-4060': 53500,
  'LOQ-i7-4050': 44000,
  'SLIM3-SNAP': 18500,
  'SLIM3-i7': 22500,
  'THINKPAD-E16': 21000,
  'THINKPAD-E14': 17500,
  'THINKBOOK-14': 24000,
  'IDEAPAD-310': 8500,
  'IDEAPAD-320-MX920': 11000,
  'IDEAPAD-320-MX150': 13000,
  'IDEAPAD-S145': 13500,
  'LEGION-SLIM5-7840': 56000,
  'LEGION-SLIM5-13500': 39000,
  'LEGION-Y545': 21500,
  'NITRO5-11400': 25500,
  'NITRO5-10300': 23000,
  'G15-10500': 22500,
  'INSPIRON-3593': 12500,
  'LATITUDE-5289': 10500,
  'LATITUDE-5290': 13500,
  'LATITUDE-7440': 31000,
  'LATITUDE-5440': 23500,
  'LATITUDE-E7470': 9500,
  'LATITUDE-5590': 12000,
  'LATITUDE-5490-i7': 10500,
  'LATITUDE-5400': 10500,
  'DELL-GENERIC': 9000,
  'PROBOOK-450': 13000,
  'PAVILION-15': 26000,
  'VICTUS-15-12500-3050': 31000,
  'VICTUS-15-13420': 33500,
  'VICTUS-16-14450': 37500,
  'VIVOBOOK-V16-i7': 46000,
  'VIVOBOOK-V16-240H': 34000,
  'CYBORG-15-4060': 47000,
  'CYBORG-15-5060': 49000,
  'IDEAPAD-3': 10000,
  'IDEAPAD-L3': 11500,
  'MACBOOK-PRO': 33000,
  'MAC-MINI': 24500,
  // Components
  'SSD-2TB-M2': 4200,
  'SSD-1TB-SATA': 2200,
  'SSD-1TB-M2': 2400,
  'SSD-500-SATA': 1200,
  'SSD-500-M2': 1350,
  'SSD-256-M2': 750,
  'SSD-128-M2': 450,
  'HDD-2TB': 1600,
  'HDD-1TB': 900,
  'HDD-500': 450,
  'RAM-16-DDR5': 2100,
  'RAM-8-DDR5': 1100,
  'RAM-32-DDR4': 2600,
  'RAM-16-DDR4': 1350,
  'RAM-8-DDR4': 700,
  'RAM-4-DDR4': 350
};

function resolvePrice(model, cpu, rawCols) {
  // Check column 7, 9, 10
  const c7 = parseFloat(rawCols[7]);
  const c9 = parseFloat(rawCols[9]);
  const c10 = parseFloat(rawCols[10]);

  if (!isNaN(c7) && c7 > 1000) return { price: c7, isEstimated: false };
  if (!isNaN(c9) && c9 > 1000) return { price: c9, isEstimated: false };
  if (!isNaN(c10) && c10 > 1000) return { price: c10, isEstimated: false };

  // Estimate from table
  const m = model.toUpperCase();
  const c = cpu.toUpperCase();

  for (const [key, val] of Object.entries(ESTIMATED_PRICES)) {
    const parts = key.split('-');
    if (parts.every(p => m.includes(p) || c.includes(p))) {
      return { price: val, isEstimated: true };
    }
  }

  // Fallbacks by category
  if (/RTX 4060/i.test(rawCols[5])) return { price: 52000, isEstimated: true };
  if (/RTX 3050/i.test(rawCols[5])) return { price: 31000, isEstimated: true };
  if (/RTX 2050/i.test(rawCols[5])) return { price: 26000, isEstimated: true };
  if (/I7/i.test(c)) return { price: 16500, isEstimated: true };
  if (/I5/i.test(c)) return { price: 12500, isEstimated: true };
  return { price: 15000, isEstimated: true };
}

// Build full product list
const processedProducts = [];
const importReport = {
  totalSourceRows: lines.length - 1,
  processedCount: 0,
  duplicatesFound: 0,
  incompleteRows: 0,
  rejectedRows: [],
  unverifiedSpecs: 0,
  categoriesCount: {
    gaming: 0,
    economic: 0,
    workstation: 0,
    storage: 0,
    ram: 0,
    computers: 0
  }
};

const seenSignatures = new Map();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line || /^,+$/.test(line)) continue;
  
  const cols = lines[i].split(',').map(c => c.trim());
  const no = cols[0];
  const rawModel = cols[1];
  const rawCpu = cols[2];
  const rawRam = cols[3];
  const rawHard = cols[4];
  const rawVga = cols[5];
  const rawMonitor = cols[6];
  const rawCond = cols[10] || cols[11] || '';
  const rawCharger = cols[12] || cols[14] || '';

  // Summary row
  if (cols[7] === '998000' && cols[8] === '77') continue;

  // Artifact rows
  if (!rawModel && cols.some(c => /^\d{8,}$/.test(c) || /^\d+\.\d+e\+\d+$/.test(c))) {
    importReport.rejectedRows.push({ line: i + 1, reason: 'Barcode / number artifact', raw: line });
    continue;
  }
  if (no === 'km' && !rawModel) {
    importReport.rejectedRows.push({ line: i + 1, reason: 'System artifact entry (km)', raw: line });
    continue;
  }
  if (!rawModel && !rawCpu) {
    importReport.rejectedRows.push({ line: i + 1, reason: 'Blank line without model or hardware', raw: line });
    continue;
  }
  if (rawModel === 'LENOVO THINKPAD' && !rawCpu && !rawRam && !rawHard) {
    importReport.incompleteRows++;
    importReport.rejectedRows.push({ line: i + 1, reason: 'Incomplete record: Model name only without CPU, RAM, or Storage', raw: line });
    continue;
  }

  // Deduplication signature check
  const sig = `${rawModel}|${rawCpu}|${rawRam}|${rawHard}|${rawVga}|${rawMonitor}`.toUpperCase().replace(/\s+/g, ' ');
  let qty = parseInt(cols[8], 10) || 1;
  if (seenSignatures.has(sig)) {
    importReport.duplicatesFound++;
    const prev = seenSignatures.get(sig);
    prev.stockQty += qty;
    prev.sourceLines.push(i + 1);
    if (rawCond && !prev.conditions.includes(rawCond)) prev.conditions.push(rawCond);
    if (rawCharger && !prev.chargers.includes(rawCharger)) prev.chargers.push(rawCharger);
    continue;
  }

  // Determine Category
  let categoryId = 'cat-economic';
  const mUp = rawModel.toUpperCase();
  const vUp = rawVga.toUpperCase();
  
  if (/^SSD|^HDD/i.test(mUp)) {
    categoryId = 'cat-storage';
  } else if (/^\d+\s*DDR/i.test(mUp)) {
    categoryId = 'cat-ram';
  } else if (/MAC MINI/i.test(mUp)) {
    categoryId = 'cat-computers';
  } else if (/PRECISION/i.test(mUp) || /QUDRO|QUADRO/i.test(vUp) || /SPECTER|SPECTRE/i.test(mUp)) {
    categoryId = 'cat-workstation';
  } else if (
    /LOQ|LEGION|LEGON|NITRO|TUF|CYPORG|CYBORG|KATANA|GF65|THIN 15|VICTUS|PAVLION|PAVILION|IDEAPAD GAMING|G15/i.test(mUp) ||
    /RTX|GTX|GEFORCE|1660|1650|1050/i.test(vUp)
  ) {
    categoryId = 'cat-gaming';
  }

  const brand = normalizeBrand(rawModel, rawCpu);
  const specLayout = categoryId === 'cat-storage' || categoryId === 'cat-ram' ? 'component' : 'device';
  const { price, isEstimated } = resolvePrice(rawModel, rawCpu, cols);
  const images = getImagesForModel(rawModel, categoryId);

  // Specs object
  let specs = [];
  let name = '';
  let shortDesc = '';
  let fullDesc = '';
  let slug = '';
  let allowRamUpgrade = false;
  let allowStorageUpgrade = false;
  let baseRam = undefined;
  let baseStorage = undefined;

  if (specLayout === 'component') {
    // Component specs
    if (categoryId === 'cat-storage') {
      const isSSD = /SSD/i.test(rawModel);
      const isM2 = /M2|M\.2|NVME/i.test(rawModel);
      const cap = rawModel.match(/(128|256|500|1TB|2TB)/i)?.[1] || '500GB';
      name = `${isSSD ? 'قرص تخزين SSD' : 'هارد تخزين HDD'} سعة ${cap} ${isM2 ? 'NVMe M.2' : 'SATA'}`;
      slug = `storage-${rawModel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i+1}`;
      shortDesc = `وحدة تخزين عالية الاعتمادية والسرعة سعة ${cap} مناسبة للترقية وتوسيع السعة.`;
      fullDesc = `قرص تخزين عالي الجودة والاعتمادية سعة ${cap} ${isM2 ? 'واجهة M.2 NVMe فائقة السرعة' : 'واجهة SATA 2.5 بوصة'}، تم فحصه والتأكد من صحة القرص (100% Health) وسرعة القراءة والكتابة لنقل البيانات بسلاسة وتشغيل الألعاب والنظام بدون أي تأخير.`;
      specs = [
        { label: 'النوع', value: isSSD ? 'Solid State Drive (SSD)' : 'Hard Disk Drive (HDD)' },
        { label: 'السعة', value: cap },
        { label: 'واجهة التوصيل', value: isM2 ? 'M.2 NVMe PCIe' : 'SATA III 6Gb/s' },
        { label: 'الحالة والصحة', value: '100% Health & Performance — مفحوص ومضمون' }
      ];
    } else {
      // RAM
      const cap = rawModel.match(/(\d+)\s*(DDR[45])/i)?.[1] || '8';
      const type = rawModel.match(/(DDR[45])/i)?.[1] || 'DDR4';
      name = `رام ${cap}GB ${type} لأجهزة الكمبيوتر واللابتوب`;
      slug = `ram-${cap}gb-${type.toLowerCase()}-${i+1}`;
      shortDesc = `شريحة ذاكرة عشوائية ${cap}GB ${type} لزيادة سرعة استجابة جهازك ورفع كفاءة المهام المتعددة.`;
      fullDesc = `شريحة رام أصلية سعة ${cap} جيجابايت بتقنية ${type} عالية الاستقرار، تمنح جهازك سرعة فتح البرامج والألعاب وسلاسة التبديل بين المهام الثقيلة بدون أي عنق زجاجة، مجربة ومضمونة بنسبة 100%.`;
      specs = [
        { label: 'سعة الذاكرة', value: `${cap}GB` },
        { label: 'نوع الذاكرة', value: type },
        { label: 'التوافق', value: 'متوافقة مع أجهزة اللابتوب والكمبيوتر المكتبي المتوافقة' },
        { label: 'الحالة والضمان', value: 'أصلية مفحوصة ومختبرة بنسبة 100%' }
      ];
    }
  } else if (categoryId === 'cat-computers') {
    // Desktop / Mac Mini
    name = `جهاز كمبيوتر مكتبي Apple Mac Mini — شريحة Apple M2`;
    slug = `apple-mac-mini-m2-8gb-256gb-${i+1}`;
    shortDesc = `كمبيوتر ميني خارق بحجم مدمج وأداء استثنائي بفضل شريحة M2 المبتكرة وذاكرة موحدة 8GB.`;
    fullDesc = `جهاز Mac Mini المزود بشريحة Apple M2 يقدم أداءً ثورياً في حجم مدمج وأنيق لا يشغل أي مساحة على مكتبك. يتميز بمعالج 8 أنوية ومعالج رسومات متطور، مما يجعله مثالياً لمونتاج الفيديو، والبرمجة، وتصميم الجرافيك، والمهام اليومية بسرعة استجابة لا تضاهى وهدوء تام مع استهلاك طاقة فائق الكفاءة.`;
    specs = [
      { label: 'المعالج (CPU)', value: 'Apple M2 (8-Core CPU with 4 performance and 4 efficiency cores)' },
      { label: 'معالج الرسومات (GPU)', value: 'Apple 10-Core GPU with 100GB/s memory bandwidth' },
      { label: 'الذاكرة الموحدة (RAM)', value: '8GB Unified Memory' },
      { label: 'التخزين الداخلي', value: '256GB SSD فائق السرعة' },
      { label: 'المنافذ', value: '2x Thunderbolt 4, 2x USB-A, HDMI, Gigabit Ethernet, Headphone Jack' },
      { label: 'الاتصال اللاسلكي', value: 'Wi-Fi 6E (802.11ax) + Bluetooth 5.3' },
      { label: 'الحالة والمشتملات', value: 'بحالة ممتازة بالكرتونة الأصلية (BOX) مع كابل الطاقة الأصلي' }
    ];
  } else {
    // Laptops
    const parsed = parseHardwareSpecs(rawModel, rawCpu, rawRam, rawHard, rawVga, rawMonitor, rawCharger, rawCond);
    allowRamUpgrade = true;
    allowStorageUpgrade = true;
    baseRam = parsed.ramCap;
    baseStorage = parsed.storageCap;

    const cleanModel = rawModel.replace(/^(LENOVO|DELL|HP|ASUS|ACER|MSI)\s+/i, '').trim();
    name = `لابتوب ${brand} ${cleanModel} — ${parsed.cpuNormalized} | ${parsed.gpuNormalized}`;
    slug = `${brand.toLowerCase()}-${cleanModel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${parsed.cpuNormalized.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i+1}`.replace(/-+/g, '-');
    
    // Custom highlights & descriptions
    if (categoryId === 'cat-gaming') {
      shortDesc = `لابتوب جيمنج وصناعة محتوى فائق الأداء بمعالج ${parsed.cpuNormalized} وكارت ${parsed.gpuNormalized} وشاشة ${parsed.dispSize} بتردد ${parsed.dispHz}.`;
      fullDesc = `يأتي لابتوب ${brand} ${cleanModel} ليلبي تطلعات عشاق الألعاب وصناع المحتوى والمهندسين. مجهز بمعالج ${parsed.cpuNormalized} القوي وذاكرة عشوائية ${parsed.ramCap} ${parsed.ramType} قابلة للترقية، بالإضافة إلى كارت الشاشة المنفصل ${parsed.gpuNormalized} ليمنحك معدل إطارات مرتفع وتجربة لعب وانتاجية غامرة. الشاشة مقاس ${parsed.dispSize} بدقة ${parsed.dispRes} ومعدل تحديث ${parsed.dispHz} توفر سلاسة فائقة في الحركة مع نظام تبريد احترافي للحفاظ على استقرار الأداء لساعات طويلة من العمل واللعب الشاق.`;
    } else if (categoryId === 'cat-workstation') {
      shortDesc = `محطة عمل احترافية موجهة لمهندسي الريندر والتصميم ثلاثي الأبعاد والبرامج الهندسية المعقدة والـ CAD.`;
      fullDesc = `صُمم جهاز ${brand} ${cleanModel} كـ Mobile Workstation بمواصفات هندسية فائقة لتشغيل البرمجيات الثقيلة والمعقدة مثل AutoCAD, SolidWorks, Revit, 3ds Max، وبرامج المونتاج والريندر السينمائي. يتميز بمعالج ${parsed.cpuNormalized} المتين، وكارت شاشة احترافي ${parsed.gpuNormalized} معتمد للاستخدامات الهندسية (ISV-certified)، وهيكل متين مصمم لتحمل أصعب ظروف العمل المستمر على مدار الساعة بأعلى درجات الاستقرار والموثوقية.`;
    } else {
      shortDesc = `لابتوب أعمال ودراسة متوازن وعملي يجمع بين السرعة والاعتمادية مع شاشة ${parsed.dispSize} وبطارية تدوم طويلاً.`;
      fullDesc = `لابتوب ${brand} ${cleanModel} هو الخيار الأمثل للطلبة، ورواد الأعمال، والعمل المكتبي والتصفح والبرمجة. يقدم توازناً استثنائياً بين سرعة الأداء بفضل معالج ${parsed.cpuNormalized}، وسرعة استجابة قرص ${parsed.storageType}، مع تصميم أنيق وعصري يسهل حمله وتنقله في كل مكان، وبطارية ذات كفاءة عالية لتلبية احتياجات يوم عمل كامل بكل سهولة.`;
    }

    specs = [
      { label: 'المعالج (CPU)', value: `${parsed.cpuNormalized} (${parsed.cpuVendor})` },
      { label: 'كارت الشاشة (GPU)', value: parsed.gpuNormalized },
      { label: 'الذاكرة العشوائية (RAM)', value: `${parsed.ramCap} ${parsed.ramType} (قابلة للترقية لدى هايبر تك)` },
      { label: 'وحدة التخزين', value: `${parsed.storageCap} — ${parsed.storageType}` },
      { label: 'الشاشة', value: `${parsed.dispSize} ${parsed.dispRes} ${parsed.dispHz} ${parsed.dispTech}` },
      { label: 'المنافذ والاتصال', value: 'USB-C, USB 3.2, HDMI, Audio Jack, Wi-Fi 6, Bluetooth' },
      { label: 'الهيكل والتصميم', value: 'تصميم أنيق ومتين خفيف الوزن مع نظام تبريد احترافي' },
      { label: 'الحالة والمشتملات', value: parsed.conditionText },
      { label: 'فئة الاستخدام', value: categoryId === 'cat-gaming' ? 'جيمنج، بث ألعاب، مونتاج وبناء عوالم' : categoryId === 'cat-workstation' ? 'محطة عمل هندسية، ريندر، 3D، وتصميم احترافي' : 'أعمال مكتبية، دراسة، برمجة، وتصفح يومي' }
    ];
  }

  const productRecord = {
    id: `prd-inv-${String(i).padStart(3, '0')}`,
    slug,
    name,
    brand,
    shortDescription: shortDesc,
    description: fullDesc,
    price,
    oldPrice: Math.round(price * 1.12),
    promotionalLabel: /BOX/i.test(rawCond) ? 'مع الكرتونة الأصلية' : /NEW/i.test(rawCond) ? 'جديد زيرو' : isEstimated ? undefined : 'سعر حصري',
    categoryId,
    images,
    availability: qty > 0 ? (qty === 1 ? 'low-stock' : 'in-stock') : 'out-of-stock',
    stockQty: qty,
    featured: (categoryId === 'cat-gaming' && /4060|4050/i.test(rawVga)) || categoryId === 'cat-workstation',
    isNew: /NEW/i.test(rawCond),
    rating: 4.8,
    specs,
    specLayout,
    heroEligible: categoryId === 'cat-gaming' || categoryId === 'cat-workstation',
    baseRam,
    baseStorage,
    allowRamUpgrade,
    allowStorageUpgrade,
    sourceLines: [i + 1],
    conditions: rawCond ? [rawCond] : [],
    chargers: rawCharger ? [rawCharger] : [],
    isPriceEstimated: isEstimated,
    createdAt: new Date().toISOString()
  };

  seenSignatures.set(sig, productRecord);
  processedProducts.push(productRecord);
  importReport.processedCount++;

  if (categoryId === 'cat-gaming') importReport.categoriesCount.gaming++;
  else if (categoryId === 'cat-economic') importReport.categoriesCount.economic++;
  else if (categoryId === 'cat-workstation') importReport.categoriesCount.workstation++;
  else if (categoryId === 'cat-storage') importReport.categoriesCount.storage++;
  else if (categoryId === 'cat-ram') importReport.categoriesCount.ram++;
  else if (categoryId === 'cat-computers') importReport.categoriesCount.computers++;
}

// Write out JSON file
const outPath = path.join(__dirname, '../data/catalog-products.json');
fs.writeFileSync(outPath, JSON.stringify(processedProducts, null, 2), 'utf8');

const reportPath = path.join(__dirname, '../data/import-report.json');
fs.writeFileSync(reportPath, JSON.stringify(importReport, null, 2), 'utf8');

console.log('=== IMPORT GENERATION SUMMARY ===');
console.log(`Total Source Rows: ${importReport.totalSourceRows}`);
console.log(`Processed Products: ${importReport.processedCount}`);
console.log(`Duplicate Records Merged: ${importReport.duplicatesFound}`);
console.log(`Incomplete Rows: ${importReport.incompleteRows}`);
console.log(`Rejected Rows: ${importReport.rejectedRows.length}`);
console.log('Categories Distribution:');
console.log(`  - Gaming Laptops: ${importReport.categoriesCount.gaming}`);
console.log(`  - Economy & Business Laptops: ${importReport.categoriesCount.economic}`);
console.log(`  - Workstations: ${importReport.categoriesCount.workstation}`);
console.log(`  - Storage (SSDs/HDDs): ${importReport.categoriesCount.storage}`);
console.log(`  - RAM Modules: ${importReport.categoriesCount.ram}`);
console.log(`  - Computers / Mini PC: ${importReport.categoriesCount.computers}`);
console.log(`Output saved to: ${outPath}`);
