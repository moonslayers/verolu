import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');
const iconsDir = resolve(root, 'public/icons');
const appIconPath = resolve(iconsDir, 'brand-icon-app.svg');
const maskablePath = resolve(iconsDir, 'brand-icon-app-maskable.svg');
const faviconSvgPath = resolve(iconsDir, 'brand-icon-favicon.svg');
const faviconIcoPath = resolve(root, 'public/favicon.ico');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function renderSvgToPng(svgPath, size, destPath, background = '#FAF7F0') {
  const svgBuffer = await readFile(svgPath);
  await sharp(svgBuffer, { density: 512 })
    .resize(size, size, { fit: 'contain', background })
    .flatten({ background })
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(destPath);
}

async function main() {
  await mkdir(iconsDir, { recursive: true });

  for (const size of sizes) {
    const dest = resolve(iconsDir, `icon-${size}x${size}.png`);
    await renderSvgToPng(appIconPath, size, dest, '#FAF7F0');
    console.log(`generated ${dest}`);
  }

  const maskableDest = resolve(iconsDir, 'icon-512x512-maskable.png');
  await renderSvgToPng(maskablePath, 512, maskableDest, '#FAF7F0');
  console.log(`generated ${maskableDest}`);

  const appleDest = resolve(iconsDir, 'apple-touch-icon.png');
  await renderSvgToPng(appIconPath, 180, appleDest, '#FAF7F0');
  console.log(`generated ${appleDest}`);

  const fav16 = resolve(iconsDir, 'favicon-16.png');
  const fav32 = resolve(iconsDir, 'favicon-32.png');
  await renderSvgToPng(faviconSvgPath, 16, fav16, '#1C1917');
  await renderSvgToPng(faviconSvgPath, 32, fav32, '#1C1917');
  console.log(`generated ${fav16}`);
  console.log(`generated ${fav32}`);

  const icoBuffer = await pngToIco([fav16, fav32]);
  await writeFile(faviconIcoPath, icoBuffer);
  console.log(`generated ${faviconIcoPath}`);

  console.log('icons:generate done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
