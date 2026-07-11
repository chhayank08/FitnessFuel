// One-off icon generator — run manually with `npm run gen-icons`.
// Renders scripts/icon-source.svg into every PWA icon size under public/icons/.
import { readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const sourceSvg = readFileSync(join(__dirname, 'icon-source.svg'));
const outDir = join(rootDir, 'public', 'icons');

const BRAND_BG = '#6C63FF';

function backgroundSvg(size) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0%" stop-color="#857BFF" /><stop offset="50%" stop-color="#6C63FF" />` +
      `<stop offset="100%" stop-color="#5147E5" /></linearGradient></defs>` +
      `<rect width="${size}" height="${size}" fill="url(#bg)" /></svg>`
  );
}

// Composites the transparent-background glyph over a freshly rendered brand
// background at `markScale` of the canvas, centered.
async function renderIcon(size, filename, markScale) {
  const markSize = Math.round(size * markScale);
  const markBuffer = await sharp(sourceSvg).resize(markSize, markSize).toBuffer();
  await sharp(backgroundSvg(size))
    .composite([{ input: markBuffer, gravity: 'center' }])
    .png()
    .toFile(join(outDir, filename));
}

async function main() {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    renderIcon(192, 'icon-192.png', 0.66),
    renderIcon(512, 'icon-512.png', 0.66),
    // Maskable safe zone is the inner 80% radius — keep the mark well inside it.
    renderIcon(192, 'icon-maskable-192.png', 0.5),
    renderIcon(512, 'icon-maskable-512.png', 0.5),
    renderIcon(180, 'apple-touch-icon.png', 0.66),
    renderIcon(32, 'favicon-32x32.png', 0.66),
    renderIcon(16, 'favicon-16x16.png', 0.7),
  ]);
  console.log(`Generated 7 icons in ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
