import sharp from "sharp";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const assets = join(__dirname, "../assets/images");

// SVG: teal rounded square + wallet outline + mint bars + gold trend line
function makeSvg(size) {
  // Scale a 100-unit design to actual size
  const s = size / 100;
  const r = Math.round(22 * s); // corner radius
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <!-- Background -->
  <rect x="0" y="0" width="100" height="100" rx="22" fill="#0f766e"/>

  <!-- Wallet body -->
  <rect x="18" y="30" width="64" height="44" rx="9"
        fill="rgba(255,255,255,0.10)"
        stroke="rgba(255,255,255,0.85)"
        stroke-width="2.5"/>

  <!-- Wallet top flap -->
  <rect x="18" y="30" width="64" height="15" rx="9"
        fill="rgba(255,255,255,0.22)"/>

  <!-- Bars (ascending) -->
  <rect x="26" y="62" width="11" height="10" rx="2.5" fill="#34d399"/>
  <rect x="44" y="54" width="11" height="18" rx="2.5" fill="#34d399"/>
  <rect x="62" y="46" width="11" height="26" rx="2.5" fill="#34d399"/>

  <!-- Trend line -->
  <path d="M31.5 62 L49.5 54 L67.5 46"
        stroke="#fbbf24" stroke-width="2.5"
        stroke-linecap="round" fill="none"/>

  <!-- Trend dot -->
  <circle cx="67.5" cy="46" r="4" fill="#fbbf24"/>
</svg>`;
}

async function generate(svg, outPath, width, height) {
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .png()
    .toFile(outPath);
  console.log(`✓ ${outPath}`);
}

const icon1024 = makeSvg(1024);
const icon512  = makeSvg(512);

// iOS / general icon (1024x1024, no rounded corners — iOS applies its own mask)
await generate(icon1024, join(assets, "icon.png"), 1024, 1024);

// Splash icon (centred on transparent background, 512x512)
await generate(icon512, join(assets, "splash-icon.png"), 512, 512);

// Android adaptive foreground (1024x1024, subject will be centred in a circle)
await generate(icon1024, join(assets, "android-icon-foreground.png"), 1024, 1024);

// Android adaptive background (solid teal)
const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  <rect width="1024" height="1024" fill="#0f766e"/>
</svg>`;
await generate(bgSvg, join(assets, "android-icon-background.png"), 1024, 1024);

// Android monochrome (white icon on transparent — system colours it)
const monoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 100 100">
  <rect x="18" y="30" width="64" height="44" rx="9"
        fill="rgba(255,255,255,0.15)"
        stroke="white" stroke-width="2.5"/>
  <rect x="18" y="30" width="64" height="15" rx="9" fill="rgba(255,255,255,0.30)"/>
  <rect x="26" y="62" width="11" height="10" rx="2.5" fill="white"/>
  <rect x="44" y="54" width="11" height="18" rx="2.5" fill="white"/>
  <rect x="62" y="46" width="11" height="26" rx="2.5" fill="white"/>
  <path d="M31.5 62 L49.5 54 L67.5 46" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <circle cx="67.5" cy="46" r="4" fill="white"/>
</svg>`;
await generate(monoSvg, join(assets, "android-icon-monochrome.png"), 1024, 1024);

// Favicon
await generate(icon512, join(assets, "favicon.png"), 64, 64);

console.log("\nAll icons generated.");
