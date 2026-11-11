const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 512x512 Master Vector SVG of the HYPER TECH Luxury World-Class Emblem
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient: Deep Obsidian Space -->
    <radialGradient id="bgGrad" cx="50%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#0e172a" />
      <stop offset="50%" stop-color="#080d19" />
      <stop offset="100%" stop-color="#020408" />
    </radialGradient>

    <!-- Glass Rim Highlight -->
    <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.6" />
      <stop offset="35%" stop-color="#ffffff" stop-opacity="0.25" />
      <stop offset="70%" stop-color="#1e293b" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.5" />
    </linearGradient>

    <!-- Electric Cyan Orbital Glow Gradient -->
    <linearGradient id="orbitGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="25%" stop-color="#0ea5e9" />
      <stop offset="50%" stop-color="#38bdf8" />
      <stop offset="75%" stop-color="#60a5fa" />
      <stop offset="100%" stop-color="#93c5fd" />
    </linearGradient>

    <!-- Metallic Titanium Silver for the "H" Monogram -->
    <linearGradient id="titaniumLeft" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="25%" stop-color="#e2e8f0" />
      <stop offset="60%" stop-color="#94a3b8" />
      <stop offset="100%" stop-color="#475569" />
    </linearGradient>

    <linearGradient id="titaniumRight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="30%" stop-color="#cbd5e1" />
      <stop offset="70%" stop-color="#64748b" />
      <stop offset="100%" stop-color="#334155" />
    </linearGradient>

    <!-- Bevel Facet Highlight -->
    <linearGradient id="bevelLight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#94a3b8" stop-opacity="0.2" />
    </linearGradient>

    <!-- Core Bridge Glow -->
    <linearGradient id="bridgeGrad" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="20%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#ffffff" />
      <stop offset="80%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>

    <!-- Ambient Core Glow Filter -->
    <filter id="coreGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="softDiffuse" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="32" />
    </filter>
  </defs>

  <!-- Base Squircle Container with Precision Curvature -->
  <rect x="8" y="8" width="496" height="496" rx="116" ry="116" fill="url(#bgGrad)" />
  
  <!-- Subtle Internal Rim Stroke -->
  <rect x="8" y="8" width="496" height="496" rx="116" ry="116" fill="none" stroke="url(#rimGrad)" stroke-width="3" opacity="0.85" />

  <!-- Background Ambient Cyber Glow -->
  <ellipse cx="256" cy="256" rx="150" ry="130" fill="#0284c7" opacity="0.28" filter="url(#softDiffuse)" />
  <ellipse cx="256" cy="230" rx="90" ry="70" fill="#38bdf8" opacity="0.2" filter="url(#coreGlow)" />

  <!-- Subtle Futuristic Grid Accent Lines (Faint) -->
  <g opacity="0.07" stroke="#ffffff" stroke-width="1">
    <line x1="60" y1="256" x2="452" y2="256" />
    <line x1="256" y1="60" x2="256" y2="452" />
  </g>

  <!-- 1. BACK PORTION OF THE CELESTIAL ORBIT (depth effect behind the left pillar) -->
  <g transform="rotate(-21 256 256)">
    <ellipse cx="256" cy="256" rx="184" ry="68" fill="none" stroke="url(#orbitGrad)" stroke-width="15" stroke-linecap="round" opacity="0.75" filter="url(#coreGlow)" />
    <!-- Secondary finer precision orbit ring -->
    <ellipse cx="256" cy="256" rx="198" ry="74" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6 8" opacity="0.45" />
  </g>

  <!-- 2. CENTRAL HYPER MONOGRAM "H" (Precision Geometric Slanted Silhouette) -->
  <g id="monogram">
    <!-- Drop Shadow for Monogram 3D floating effect -->
    <g transform="translate(0, 14)" opacity="0.45" filter="url(#softDiffuse)">
      <!-- Left leg shadow -->
      <polygon points="144,142 198,142 168,370 114,370" fill="#000" />
      <!-- Right leg shadow -->
      <polygon points="344,142 398,142 368,370 314,370" fill="#000" />
      <!-- Bridge shadow -->
      <polygon points="182,234 354,234 348,278 176,278" fill="#000" />
    </g>

    <!-- LEFT PILLAR (Facet Beveled Titanium) -->
    <!-- Left Main Face -->
    <polygon points="144,142 198,142 168,370 114,370" fill="url(#titaniumLeft)" />
    <!-- Left Top Bevel Specular Edge -->
    <polygon points="144,142 198,142 194,148 140,148" fill="#ffffff" opacity="0.8" />
    <!-- Left Inner Chamfer Edge (Facet reflection) -->
    <polygon points="198,142 186,142 156,370 168,370" fill="url(#bevelLight)" />

    <!-- RIGHT PILLAR (Facet Beveled Titanium) -->
    <!-- Right Main Face -->
    <polygon points="344,142 398,142 368,370 314,370" fill="url(#titaniumRight)" />
    <!-- Right Top Bevel Specular Edge -->
    <polygon points="344,142 398,142 394,148 340,148" fill="#ffffff" opacity="0.8" />
    <!-- Right Outer Chamfer Edge -->
    <polygon points="344,142 356,142 326,370 314,370" fill="url(#bevelLight)" />

    <!-- CROSSBAR HYPER-BRIDGE -->
    <!-- Bridge Structural Base -->
    <polygon points="182,234 356,234 348,278 174,278" fill="#0f172a" />
    <!-- Bridge Glowing Power Core -->
    <polygon points="182,238 356,238 349,274 175,274" fill="url(#bridgeGrad)" opacity="0.95" />
    <!-- Intense Central Laser Energy Line -->
    <line x1="172" y1="256" x2="358" y2="256" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" filter="url(#coreGlow)" />
    <line x1="184" y1="256" x2="346" y2="256" stroke="#e0f2fe" stroke-width="2" stroke-linecap="round" />
  </g>

  <!-- 3. FOREGROUND ORBIT PASS (Passes in front of the right side with 3D Overlap) -->
  <g transform="rotate(-21 256 256)">
    <!-- Glowing Celestial Node / Kinetic Satellite Spark -->
    <g transform="translate(422, 238)">
      <!-- Outer halo -->
      <circle cx="0" cy="0" r="22" fill="#38bdf8" opacity="0.3" filter="url(#coreGlow)" />
      <!-- Pulsing ring -->
      <circle cx="0" cy="0" r="14" fill="none" stroke="#7dd3fc" stroke-width="2.5" opacity="0.75" />
      <!-- Radiant core -->
      <circle cx="0" cy="0" r="7" fill="#ffffff" />
      <!-- Star flare spikes -->
      <line x1="-15" y1="0" x2="15" y2="0" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.9" />
      <line x1="0" y1="-15" x2="0" y2="15" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.9" />
    </g>

    <!-- Kinetic Trailing Dash Accents along the orbit -->
    <path d="M 330 310 A 184 68 0 0 0 435 240" fill="none" stroke="#e0f2fe" stroke-width="4.5" stroke-linecap="round" opacity="0.8" />
  </g>

  <!-- Top Curved Specular Sheen (Apple-style subtle glass highlight) -->
  <path d="M 30,120 C 120,40 392,40 482,120 C 370,86 142,86 30,120 Z" fill="#ffffff" opacity="0.06" />
</svg>`;

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');
  const appDir = path.join(rootDir, 'src', 'app');

  // 1. Save SVG files
  const publicSvgPath = path.join(publicDir, 'icon.svg');
  const appSvgPath = path.join(appDir, 'icon.svg');
  fs.writeFileSync(publicSvgPath, svgContent, 'utf8');
  fs.writeFileSync(appSvgPath, svgContent, 'utf8');
  console.log('Saved SVG icon to public/icon.svg and src/app/icon.svg');

  // 2. Generate PNGs using Sharp
  const svgBuffer = Buffer.from(svgContent);

  // 512x512
  const p512 = path.join(publicDir, 'icon-512.png');
  await sharp(svgBuffer).resize(512, 512).png().toFile(p512);
  console.log('Generated 512x512 PNG');

  // 192x192
  const p192 = path.join(publicDir, 'icon-192.png');
  await sharp(svgBuffer).resize(192, 192).png().toFile(p192);
  console.log('Generated 192x192 PNG');

  // 180x180 (Apple Touch Icon)
  const applePublic = path.join(publicDir, 'apple-icon.png');
  const appleApp = path.join(appDir, 'apple-icon.png');
  await sharp(svgBuffer).resize(180, 180).png().toFile(applePublic);
  await sharp(svgBuffer).resize(180, 180).png().toFile(appleApp);
  console.log('Generated Apple Touch Icon (180x180)');

  // 48x48
  const p48Buffer = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
  // 32x32
  const p32Buffer = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  // 16x16
  const p16Buffer = await sharp(svgBuffer).resize(16, 16).png().toBuffer();

  // Create favicon.ico (We can save 32x32 PNG as fallback favicon.ico or pack ICO)
  // Sharp can output directly or we can write the 32x32 png / valid ico header
  // A standard multi-image ICO can be created or standard 32x32 / 48x48 ICO:
  function createIcoFromPngs(pngBuffers) {
    // ICO header: 6 bytes (Reserved 2 bytes = 0, Type 2 bytes = 1, Count 2 bytes)
    // Directory entry: 16 bytes per image
    // Data follows directory
    const count = pngBuffers.length;
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // reserved
    header.writeUInt16LE(1, 2); // ICO type
    header.writeUInt16LE(count, 4); // count

    const dirEntries = [];
    let currentOffset = 6 + count * 16;

    for (const { buffer, size } of pngBuffers) {
      const entry = Buffer.alloc(16);
      entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
      entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
      entry.writeUInt8(0, 2); // color palette
      entry.writeUInt8(0, 3); // reserved
      entry.writeUInt16LE(1, 4); // color planes
      entry.writeUInt16LE(32, 6); // bits per pixel
      entry.writeUInt32LE(buffer.length, 8); // image size in bytes
      entry.writeUInt32LE(currentOffset, 12); // offset of image data
      dirEntries.push(entry);
      currentOffset += buffer.length;
    }

    return Buffer.concat([
      header,
      ...dirEntries,
      ...pngBuffers.map(p => p.buffer)
    ]);
  }

  const icoBuffer = createIcoFromPngs([
    { buffer: p16Buffer, size: 16 },
    { buffer: p32Buffer, size: 32 },
    { buffer: p48Buffer, size: 48 }
  ]);

  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);
  console.log('Generated multi-res favicon.ico (16, 32, 48)');
}

main().catch(console.error);
