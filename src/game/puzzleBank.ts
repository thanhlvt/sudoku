import { isLevel, isPuzzleId } from '../core/levels';
import type { Level, LevelBank, Manifest, PuzzleRecord } from '../core/types';

// import.meta.env.BASE_URL always ends with '/', and reflects Vite's `base` config --
// '/' locally, '/<repo>/' when deployed to a GitHub Pages project site.
const PUZZLES_URL = `${import.meta.env.BASE_URL}puzzles/`;

/** A stalled request would otherwise leave the screen on "loading" forever. */
const FETCH_TIMEOUT_MS = 15_000;

let manifestCache: Manifest | null = null;
let manifestPromise: Promise<Manifest> | null = null;
const levelCache = new Map<Level, LevelBank>();
const levelPromises = new Map<Level, Promise<LevelBank>>();

async function fetchJSON(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const BANK_FILE_RE = /^[A-Za-z0-9_-]+\.json$/;
const PUZZLE_RE = /^[.0-9]{81}$/;
const SOLUTION_RE = /^[1-9]{81}$/;
const MAX_LEVEL_COUNT = 100_000;

/**
 * The bank is static JSON we ship, but a bad deploy, a captive portal or a tampered CDN can serve anything.
 * Check the shape once at load so the rest of the app can trust it (`parseGrid` throws on a malformed grid).
 */
export function validateManifest(raw: unknown): Manifest {
  if (!isObj(raw) || !Array.isArray(raw.levels)) throw new Error('Invalid puzzle manifest');
  if (typeof raw.schemaVersion !== 'number' || typeof raw.generatorVersion !== 'number') {
    throw new Error('Invalid puzzle manifest');
  }
  for (const entry of raw.levels as unknown[]) {
    if (
      !isObj(entry) ||
      !isLevel(entry.level) ||
      !Number.isInteger(entry.count) ||
      (entry.count as number) < 0 ||
      (entry.count as number) > MAX_LEVEL_COUNT ||
      typeof entry.file !== 'string' ||
      !BANK_FILE_RE.test(entry.file) // `file` becomes part of a URL: no paths, no other hosts
    ) {
      throw new Error('Invalid puzzle manifest entry');
    }
  }
  return raw as unknown as Manifest;
}

export function validateLevelBank(raw: unknown, level: Level): LevelBank {
  if (!isObj(raw) || raw.level !== level || !Array.isArray(raw.puzzles)) {
    throw new Error(`Invalid puzzle bank for ${level}`);
  }
  for (const record of raw.puzzles as unknown[]) {
    if (
      !isObj(record) ||
      !isPuzzleId(record.id) ||
      !Number.isInteger(record.index) ||
      (record.index as number) < 0 ||
      record.id !== puzzleIdOf(level, record.index as number) ||
      typeof record.puzzle !== 'string' ||
      !PUZZLE_RE.test(record.puzzle) ||
      typeof record.solution !== 'string' ||
      !SOLUTION_RE.test(record.solution)
    ) {
      throw new Error(`Invalid puzzle record in ${level}`);
    }
    for (let i = 0; i < 81; i++) {
      const given = record.puzzle[i]!;
      if (given !== '.' && given !== '0' && given !== record.solution[i]) {
        throw new Error(`Puzzle ${String(record.id)} disagrees with its own solution`);
      }
    }
  }
  return raw as unknown as LevelBank;
}

export function loadManifest(): Promise<Manifest> {
  if (manifestCache) return Promise.resolve(manifestCache);
  if (!manifestPromise) {
    const promise = fetchJSON(`${PUZZLES_URL}manifest.json`).then((raw) => {
      const manifest = validateManifest(raw);
      manifestCache = manifest;
      return manifest;
    });
    manifestPromise = promise;
    // Remember successes only: a single dropped request must not break the bank until the page is reloaded.
    promise.catch(() => {
      if (manifestPromise === promise) manifestPromise = null;
    });
  }
  return manifestPromise;
}

export async function loadLevel(level: Level): Promise<LevelBank> {
  const cached = levelCache.get(level);
  if (cached) return cached;

  let promise = levelPromises.get(level);
  if (!promise) {
    const loading: Promise<LevelBank> = loadManifest().then(async (manifest) => {
      const entry = manifest.levels.find((l) => l.level === level);
      if (!entry) throw new Error(`Unknown level: ${level}`);
      const bank = validateLevelBank(await fetchJSON(`${PUZZLES_URL}${entry.file}`), level);
      levelCache.set(level, bank);
      return bank;
    });
    promise = loading;
    levelPromises.set(level, loading);
    loading.catch(() => {
      if (levelPromises.get(level) === loading) levelPromises.delete(level);
    });
  }
  return promise;
}

/** Inverse of `levelFromPuzzleId`: the id the generator gives the puzzle at 0-based `index` of `level`. */
export function puzzleIdOf(level: Level, index: number): string {
  return `${level}-${String(index + 1).padStart(3, '0')}`;
}

export function levelFromPuzzleId(id: string): Level {
  return id.slice(0, id.lastIndexOf('-')) as Level;
}

export async function getPuzzle(id: string): Promise<PuzzleRecord> {
  if (!isPuzzleId(id)) throw new Error(`Invalid puzzle id: ${id}`);
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
