/* Sudoku service worker: lets the web build be installed and played offline.
 *
 * - The puzzle bank, sounds and app shell are fetched once and kept.
 * - Hashed build files (assets/), sounds and icons never change under the same URL, so they are served from the
 *   cache first. Everything else (the page itself, the puzzle JSON) is network-first so a new deploy shows up as
 *   soon as the player is online, falling back to the cache when they are not.
 * - Each build gets its own cache (BUILD is stamped in at build time by vite.config.ts); older ones are deleted.
 */
const BUILD = '__BUILD_ID__';
const CACHE = `sudoku-${BUILD}`;
const LEVELS = ['beginner', 'easy', 'medium', 'hard', 'expert'];
const SOUNDS = ['place', 'note', 'erase', 'undo', 'error', 'unit', 'hint', 'win'];
const PRECACHE = [
  './',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'puzzles/manifest.json',
  ...LEVELS.map((level) => `puzzles/${level}.json`),
  ...SOUNDS.map((name) => `sounds/${name}.mp3`),
];
/** A slow connection should not hold the game hostage when a cached copy is at hand. */
const NETWORK_TIMEOUT_MS = 5000;

/**
 * The page that registered this worker loaded its scripts, styles and fonts *before* the worker could see them,
 * so they would be missing from the cache on the first offline visit. Read them out of the page and the
 * stylesheets instead, so the app shell is complete as soon as the worker is installed.
 */
async function precacheBuildFiles(cache) {
  const page = await fetch('./');
  if (!page.ok) return;
  const html = await page.clone().text();
  await cache.put('./', page);
  const urls = new Set();
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const url = new URL(match[1], self.registration.scope);
    if (url.origin === self.location.origin && /\/assets\//.test(url.pathname)) urls.add(url.href);
  }
  await Promise.allSettled([...urls].map((url) => cache.add(url)));
  // Fonts are referenced from inside the stylesheet(s).
  for (const url of [...urls].filter((u) => u.endsWith('.css'))) {
    const css = await (await cache.match(url))?.text();
    if (!css) continue;
    const fonts = [...css.matchAll(/url\(([^)]+)\)/g)]
      .map((m) => m[1].trim().replace(/^["']|["']$/g, ''))
      .filter((ref) => !ref.startsWith('data:'))
      .map((ref) => new URL(ref, url).href);
    await Promise.allSettled(fonts.map((font) => cache.add(font)));
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // One missing file (a level not built yet) must not stop the worker from installing.
      await Promise.allSettled([precacheBuildFiles(cache), ...PRECACHE.slice(1).map((url) => cache.add(url))]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith('sudoku-') && n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

function isImmutable(url) {
  const scope = new URL(self.registration.scope).pathname;
  const rel = url.pathname.startsWith(scope) ? url.pathname.slice(scope.length) : url.pathname;
  return rel.startsWith('assets/') || rel.startsWith('sounds/') || rel.startsWith('icons/');
}

async function remember(request, response) {
  if (response && response.ok && response.type === 'basic') {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  return remember(request, await fetch(request));
}

async function networkFirst(request) {
  const cached = await caches.match(request);
  const network = fetch(request).then((response) => remember(request, response));
  try {
    if (!cached) return await network;
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), NETWORK_TIMEOUT_MS));
    return await Promise.race([network, timeout]);
  } catch (error) {
    network.catch(() => {}); // the late answer may still refresh the cache; its failure is not an error here
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const shell = await caches.match('./');
      if (shell) return shell;
    }
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(isImmutable(url) ? cacheFirst(request) : networkFirst(request));
});
