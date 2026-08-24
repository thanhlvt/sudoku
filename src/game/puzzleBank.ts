import type { Level, LevelBank, Manifest, PuzzleRecord } from '../core/types';

// import.meta.env.BASE_URL always ends with '/', and reflects Vite's `base` config --
// '/' locally, '/<repo>/' when deployed to a GitHub Pages project site.
const PUZZLES_URL = `${import.meta.env.BASE_URL}puzzles/`;

let manifestCache: Manifest | null = null;
let manifestPromise: Promise<Manifest> | null = null;
const levelCache = new Map<Level, LevelBank>();
const levelPromises = new Map<Level, Promise<LevelBank>>();

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  return (await res.json()) as T;
}

export function loadManifest(): Promise<Manifest> {
  if (manifestCache) return Promise.resolve(manifestCache);
  if (!manifestPromise) {
    manifestPromise = fetchJSON<Manifest>(`${PUZZLES_URL}manifest.json`).then((m) => {
      manifestCache = m;
      return m;
    });
  }
  return manifestPromise;
}

export async function loadLevel(level: Level): Promise<LevelBank> {
  const cached = levelCache.get(level);
  if (cached) return cached;

  let promise = levelPromises.get(level);
  if (!promise) {
    promise = loadManifest().then(async (manifest) => {
      const entry = manifest.levels.find((l) => l.level === level);
      if (!entry) throw new Error(`Unknown level: ${level}`);
      const bank = await fetchJSON<LevelBank>(`${PUZZLES_URL}${entry.file}`);
      levelCache.set(level, bank);
      return bank;
    });
    levelPromises.set(level, promise);
  }
  return promise;
}

export function levelFromPuzzleId(id: string): Level {
  return id.slice(0, id.lastIndexOf('-')) as Level;
}

export async function getPuzzle(id: string): Promise<PuzzleRecord> {
  const bank = await loadLevel(levelFromPuzzleId(id));
  const record = bank.puzzles.find((p) => p.id === id);
  if (!record) throw new Error(`Puzzle not found: ${id}`);
  return record;
}

export function resetPuzzleBankCache(): void {
  manifestCache = null;
  manifestPromise = null;
  levelCache.clear();
  levelPromises.clear();
}
