import sharp from "sharp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const assets = join(__dirname, "../assets/images");

// wallet-plus SVG path (from MaterialCommunityIcons U+F0F8E)
// Traced manually from the MDI source for wallet-plus
const WALLET_PLUS_PATH = `
  M5 3C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H15.68
  C15.34 20.43 15.12 19.74 15.04 19H5V5H19V13.04
  C19.74 13.12 20.43 13.34 21 13.68V5C21 3.89 20.11 3 19 3H5Z
  M12 14V16H14C14 16.7 14.13 17.37 14.35 18H12V20H7V18H9V14H7V12
  H17V14H12Z
  M20 15V18H17V20H20V23H22V20H25V18H22V15H20Z
`;

// Clean SVG icon: dark background + teal wallet-plus
function makeIconSvg(size) {
  const pad = size * 0.18;
  const inner = size - pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#0d1117"/>
  <svg x="${pad}" y="${pad}" width="${inner}" height="${inner}" viewBox="0 0 24 24">
    <path fill="#0f766e" d="M5 3C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H15.68C15.34 20.43 15.12 19.74 15.04 19H5V8H19V13.04C19.74 13.12 20.43 13.34 21 13.68V5C21 3.89 20.11 3 19 3H5M5 5H19V6H5V5M20 15V18H17V20H20V23H22V20H25V18H22V15H20Z"/>
    <path fill="#34d399" d="M3 8V19C3 20.11 3.89 21 5 21H15.04C13.2 19.84 12 17.83 12 15.5C12 12.46 14.24 9.96 17.18 9.54L19 9.27V8H3Z"/>
    <path fill="#0f766e" d="M18 11C15.24 11 13 13.24 13 16S15.24 21 18 21 23 18.76 23 16 20.76 11 18 11M19 19H17V17H15V15H17V13H19V15H21V17H19V19Z"/>
  </svg>
</svg>`;
}

// Splash: dark bg, larger centered icon, no rounded corners (system applies mask)
function makeSplashSvg(size) {
  const iconSize = Math.round(size * 0.35);
  const offset = Math.round((size - iconSize) / 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0d1117"/>
  <svg x="${offset}" y="${offset}" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24">
    <path fill="#0f766e" d="M5 3C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H15.68C15.34 20.43 15.12 19.74 15.04 19H5V8H19V13.04C19.74 13.12 20.43 13.34 21 13.68V5C21 3.89 20.11 3 19 3H5M5 5H19V6H5V5Z"/>
    <path fill="#34d399" d="M3 8V19C3 20.11 3.89 21 5 21H15.04C13.2 19.84 12 17.83 12 15.5C12 12.46 14.24 9.96 17.18 9.54L19 9.27V8H3Z"/>
    <path fill="#0f766e" d="M18 11C15.24 11 13 13.24 13 16S15.24 21 18 21 23 18.76 23 16 20.76 11 18 11M19 19H17V17H15V15H17V13H19V15H21V17H19V19Z"/>
  </svg>
</svg>`;
}

async function generate(svg, outPath, width, height) {
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .png()
    .toFile(outPath);
  console.log(`✓ ${outPath}`);
}

// App icon (1024x1024) - used by iOS and as base
const icon = makeIconSvg(1024);
await generate(icon, join(assets, "icon.png"), 1024, 1024);

// Splash screen (centered icon on dark bg, no corner radius)
const splash = makeSplashSvg(1024);
await generate(splash, join(assets, "splash-icon.png"), 512, 512);

// Android adaptive foreground (icon fills the safe zone)
await generate(icon, join(assets, "android-icon-foreground.png"), 1024, 1024);

// Android adaptive background (match icon dark bg)
const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  <rect width="1024" height="1024" fill="#0d1117"/>
</svg>`;
await generate(bgSvg, join(assets, "android-icon-background.png"), 1024, 1024);

// Android monochrome (all white paths on transparent)
const monoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 24 24">
  <path fill="white" d="M5 3C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H15.68C15.34 20.43 15.12 19.74 15.04 19H5V8H19V13.04C19.74 13.12 20.43 13.34 21 13.68V5C21 3.89 20.11 3 19 3H5M5 5H19V6H5V5Z"/>
  <path fill="white" opacity="0.6" d="M3 8V19C3 20.11 3.89 21 5 21H15.04C13.2 19.84 12 17.83 12 15.5C12 12.46 14.24 9.96 17.18 9.54L19 9.27V8H3Z"/>
  <path fill="white" d="M18 11C15.24 11 13 13.24 13 16S15.24 21 18 21 23 18.76 23 16 20.76 11 18 11M19 19H17V17H15V15H17V13H19V15H21V17H19V19Z"/>
</svg>`;
await generate(monoSvg, join(assets, "android-icon-monochrome.png"), 1024, 1024);

// Favicon
await generate(makeIconSvg(64), join(assets, "favicon.png"), 64, 64);

console.log("\nAll icons generated.");
