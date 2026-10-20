// Renders the source artwork in assets/ (consumed by `npm run assets`) from SVG built here.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const BLUE = '#2563eb';
const DARK = '#0f172a';

/** A 9x9 board centred in a 1024 canvas, `size` px wide, with a few filled cells. */
function board(size, ink, paper, filled) {
  const x0 = (1024 - size) / 2;
  const cell = size / 9;
  const r = size * 0.06;
  let g = `<rect x="${x0}" y="${x0}" width="${size}" height="${size}" rx="${r}" fill="${paper}"/>`;
  for (const [row, col] of filled) {
    g += `<rect x="${x0 + col * cell + cell * 0.14}" y="${x0 + row * cell + cell * 0.14}" width="${cell * 0.72}" height="${cell * 0.72}" rx="${cell * 0.14}" fill="${ink}" opacity="0.9"/>`;
  }
  for (let i = 1; i < 9; i++) {
    const thick = i % 3 === 0;
    const w = thick ? size * 0.014 : size * 0.005;
    const p = x0 + i * cell;
    g += `<line x1="${p}" y1="${x0}" x2="${p}" y2="${x0 + size}" stroke="${ink}" stroke-width="${w}"/>`;
    g += `<line x1="${x0}" y1="${p}" x2="${x0 + size}" y2="${p}" stroke="${ink}" stroke-width="${w}"/>`;
  }
  g += `<rect x="${x0}" y="${x0}" width="${size}" height="${size}" rx="${r}" fill="none" stroke="${ink}" stroke-width="${size * 0.02}"/>`;
  return g;
}

const FILLED = [
  [0, 1], [0, 5], [1, 3], [2, 7], [3, 0], [3, 4], [4, 2], [4, 6],
  [5, 8], [6, 1], [6, 5], [7, 3], [8, 4], [8, 7],
];

const svg = (inner, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ''}${inner}</svg>`;

const files = {
  // Legacy/full icon: board fills most of the square.
  'icon-only.png': svg(board(760, BLUE, '#ffffff', FILLED), BLUE),
  // Adaptive icon layers: foreground stays inside the central ~66% safe zone.
  'icon-foreground.png': svg(board(600, BLUE, '#ffffff', FILLED), null),
  'icon-background.png': svg('', BLUE),
  // Splash screens: board centred on a flat background.
  'splash.png': svg(board(360, BLUE, '#ffffff', FILLED), '#ffffff'),
  'splash-dark.png': svg(board(360, '#93c5fd', '#1e293b', FILLED), DARK),
};

await mkdir(OUT, { recursive: true });
for (const [name, markup] of Object.entries(files)) {
  const size = name.startsWith('splash') ? 2732 : 1024;
  const png = await sharp(Buffer.from(markup)).resize(size, size).png().toBuffer();
  await writeFile(path.join(OUT, name), png);
  console.log('wrote', name);
}
