/**
 * Rasterises the acorn SVGs in public/ into the PNGs the manifest points at.
 *
 * Kept as a committed script rather than a build step: icons change only when
 * the logo does, and this way `npm run build` stays free of image tooling.
 *
 *   node scripts/make-icons.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const JOBS = [
  { src: 'icon.svg', out: 'pwa-192.png', size: 192 },
  { src: 'icon.svg', out: 'pwa-512.png', size: 512 },
  // iOS ignores the manifest and reads apple-touch-icon; it also composites
  // onto white, so this one must not rely on transparency.
  { src: 'icon.svg', out: 'apple-touch-icon.png', size: 180 },
  { src: 'icon-maskable.svg', out: 'pwa-maskable-512.png', size: 512 },
];

for (const { src, out, size } of JOBS) {
  const svg = await readFile(join(pub, src));
  const png = await sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();
  await writeFile(join(pub, out), png);
  console.log(`${out}  ${size}x${size}  ${(png.length / 1024).toFixed(1)} kB`);
}
