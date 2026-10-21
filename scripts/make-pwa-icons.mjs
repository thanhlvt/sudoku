// Renders the web-app icons in public/icons/ from the source artwork in assets/.
//
//   npm run pwa-icons
//
// icon-192/512 are the launcher icon as-is; icon-maskable-512 is the adaptive-icon foreground laid over its
// background, so it survives the circular/rounded masks some platforms apply.
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (name) => path.join(root, 'assets', name);
const out = path.join(root, 'public', 'icons');
await mkdir(out, { recursive: true });

for (const size of [192, 512]) {
  await sharp(src('icon-only.png')).resize(size, size).png().toFile(path.join(out, `icon-${size}.png`));
}

const background = await sharp(src('icon-background.png')).resize(512, 512).png().toBuffer();
const foreground = await sharp(src('icon-foreground.png')).resize(512, 512).png().toBuffer();
await sharp(background)
  .composite([{ input: foreground }])
  .png()
  .toFile(path.join(out, 'icon-maskable-512.png'));

console.log('wrote public/icons/icon-192.png, icon-512.png, icon-maskable-512.png');
