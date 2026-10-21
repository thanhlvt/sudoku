// Renders the source artwork in assets/ (consumed by `npm run assets`) from SVG built here.
//
// The artwork is the logo shown in the header of the home screen (`Logo` in src/ui/HomeScreen.tsx): an indigo
// tile holding a 3x3 grid of coloured cells. Keep the two in sync.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const INDIGO = '#312E81';
const INDIGO_SPLASH_DARK = '#4338CA'; // lifted so the logo stays visible on the dark splash background
const DARK = '#0f172a';

// Cell colours in reading order, as in the home-screen logo.
const TILES = ['#22C55E', '#FFFFFF', '#F97316', '#0EA5E9', '#A78BFA', '#FFFFFF', '#FFFFFF', '#FACC15', '#F43F5E'];

/**
 * The 3x3 grid of cells, `span` px wide with its top-left corner at (x0, y0). In the 56-unit logo the cells are 12
 * wide with a 2 gap, so the grid is 40 units wide.
 */
function grid(span, x0, y0) {
  const unit = span / 40;
  let g = '';
  TILES.forEach((fill, i) => {
    const x = x0 + (i % 3) * 14 * unit;
    const y = y0 + Math.floor(i / 3) * 14 * unit;
    g += `<rect x="${x}" y="${y}" width="${12 * unit}" height="${12 * unit}" rx="${3.5 * unit}" fill="${fill}"/>`;
  });
  return g;
}

/** The grid centred on the 1024 canvas. */
const centred = (span) => grid(span, (1024 - span) / 2, (1024 - span) / 2);

/** The whole logo (rounded indigo tile + grid, 8 units of padding), `size` px wide, centred on the canvas. */
function logo(size, base) {
  const x0 = (1024 - size) / 2;
  const unit = size / 56;
  const tile = `<rect x="${x0}" y="${x0}" width="${size}" height="${size}" rx="${14 * unit}" fill="${base}"/>`;
  return tile + grid(40 * unit, x0 + 8 * unit, x0 + 8 * unit);
}

const svg = (inner, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ''}${inner}</svg>`;

const files = {
  // Legacy/full icon: indigo fills the square (the launcher / Play Store applies its own corner mask).
  'icon-only.png': svg(centred(660), INDIGO),
  // Adaptive icon layers: the grid stays inside the central circle of the safe zone (~66% of the canvas).
  'icon-foreground.png': svg(centred(470), null),
  'icon-background.png': svg('', INDIGO),
  // Splash screens: the logo centred on a flat background.
  'splash.png': svg(logo(420, INDIGO), '#ffffff'),
  'splash-dark.png': svg(logo(420, INDIGO_SPLASH_DARK), DARK),
};

await mkdir(OUT, { recursive: true });
for (const [name, markup] of Object.entries(files)) {
  const size = name.startsWith('splash') ? 2732 : 1024;
  const png = await sharp(Buffer.from(markup)).resize(size, size).png().toBuffer();
  await writeFile(path.join(OUT, name), png);
  console.log('wrote', name);
}
