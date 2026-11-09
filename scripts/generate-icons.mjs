import { readFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');
const iconsDir = resolve(root, 'public/icons');
const brandIconPath = resolve(iconsDir, 'brand-icon.svg');
const maskablePath = resolve(iconsDir, 'brand-icon-maskable.svg');
const faviconSvgPath = resolve(iconsDir, 'brand-icon-favicon.svg');
const faviconIcoPath = resolve(root, 'public/favicon.ico');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function renderSvgToPng(svgPath, size, destPath) {
  const svgBuffer = await readFile(svgPath);
  await sharp(svgBuffer, { density: 512 })
    .resize(size, size, { fit: 'contain', background: '#1C1917' })
    .flatten({ background: '#1C1917' })
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(destPath);
}

async function main() {
  await mkdir(iconsDir, { recursive: true });

  // Ensure reproducible builds: sharp uses deterministic output with fixed options
  for (const size of sizes) {
    const dest = resolve(iconsDir, `icon-${size}x${size}.png`);
    await renderSvgToPng(brandIconPath, size, dest);
    console.log(`generated ${dest}`);
  }

  // Maskable 512 (safe area 80% inside, outer 10% is 51.2 border)
  const maskableDest = resolve(iconsDir, 'icon-512x512-maskable.png');
  await renderSvgToPng(maskablePath, 512, maskableDest);
  console.log(`generated ${maskableDest}`);

  // apple-touch-icon 180
  const appleDest = resolve(iconsDir, 'apple-touch-icon.png');
  await renderSvgToPng(brandIconPath, 180, appleDest);
  console.log(`generated ${appleDest}`);

  // favicons simplified: max 3 shapes, thicker strokes, no rail for 16 px legibility
  const fav16 = resolve(iconsDir, 'favicon-16.png');
  const fav32 = resolve(iconsDir, 'favicon-32.png');
  await renderSvgToPng(faviconSvgPath, 16, fav16);
  await renderSvgToPng(faviconSvgPath, 32, fav32);
  console.log(`generated ${fav16}`);
  console.log(`generated ${fav32}`);

  // favicon.ico from 16 and 32
  const icoBuffer = await pngToIco([fav16, fav32]);
  const { writeFile } = await import('node:fs/promises');
  await writeFile(faviconIcoPath, icoBuffer);
  console.log(`generated ${faviconIcoPath}`);

  // Also ensure legacy icon.svg still exists is not used; verify no transparent corners by checking background
  console.log('icons:generate done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
