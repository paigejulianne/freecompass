// Generates the app icon assets from a single SVG compass design.
// Run: node scripts/make-icons.js   (requires `sharp`, installed on demand)
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.join(__dirname, '..', 'assets');
fs.mkdirSync(OUT, { recursive: true });

// --- The compass rose, drawn around a 1024x1024 canvas centred at (512,512) ---
function rose() {
  const cx = 512;
  const cy = 512;
  const ticks = [];
  for (let d = 0; d < 360; d += 30) {
    const isCard = d % 90 === 0;
    const len = isCard ? 46 : 28;
    const w = isCard ? 10 : 6;
    const rad = ((d - 90) * Math.PI) / 180;
    const r1 = 430;
    const r2 = 430 - len;
    ticks.push(
      `<line x1="${cx + r1 * Math.cos(rad)}" y1="${cy + r1 * Math.sin(rad)}" ` +
        `x2="${cx + r2 * Math.cos(rad)}" y2="${cy + r2 * Math.sin(rad)}" ` +
        `stroke="${isCard ? '#8bb4ff' : '#3a4a5a'}" stroke-width="${w}" stroke-linecap="round"/>`
    );
  }
  return `
    <circle cx="${cx}" cy="${cy}" r="452" fill="none" stroke="#6ea8fe" stroke-width="16"/>
    <circle cx="${cx}" cy="${cy}" r="372" fill="none" stroke="#243447" stroke-width="6"/>
    ${ticks.join('\n')}
    <!-- East/West needle (behind) -->
    <polygon points="150,512 512,470 512,554" fill="#46586b"/>
    <polygon points="874,512 512,470 512,554" fill="#5b7086"/>
    <!-- South needle (light) -->
    <polygon points="512,884 556,512 468,512" fill="#c3d0dd"/>
    <!-- North needle (red) -->
    <polygon points="512,140 556,512 468,512" fill="#ff4d4d"/>
    <!-- Hub -->
    <circle cx="${cx}" cy="${cy}" r="40" fill="#6ea8fe"/>
    <circle cx="${cx}" cy="${cy}" r="18" fill="#0b0f14"/>
    <!-- N marker -->
    <text x="${cx}" y="96" fill="#ffffff" font-size="86" font-family="Arial, sans-serif"
      font-weight="bold" text-anchor="middle">N</text>
  `;
}

// Full-bleed icon: dark gradient background + rose. iOS masks the corners itself.
function iconSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#132132"/>
        <stop offset="1" stop-color="#070b10"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#bg)"/>
    ${rose()}
  </svg>`;
}

// Android adaptive foreground: transparent, rose scaled into the safe zone.
function adaptiveSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <g transform="translate(512,512) scale(0.66) translate(-512,-512)">
      ${rose()}
    </g>
  </svg>`;
}

async function render(svg, file, size) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(path.join(OUT, file));
  console.log('wrote', file, size + 'x' + size);
}

(async () => {
  await render(iconSVG(), 'icon.png', 1024);
  await render(adaptiveSVG(), 'adaptive-icon.png', 1024);
  await render(iconSVG(), 'splash-icon.png', 1024);
  await render(iconSVG(), 'favicon.png', 48);
})();
