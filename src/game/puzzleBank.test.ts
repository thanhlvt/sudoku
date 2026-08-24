import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getPuzzle, levelFromPuzzleId, loadLevel, loadManifest, resetPuzzleBankCache } from './puzzleBank';
import type { LevelBank, Manifest } from '../core/types';

const manifest: Manifest = {
  schemaVersion: 1,
  generatorVersion: 1,
  levels: [{ level: 'easy', count: 1, file: 'easy.json' }],
};

const easyBank: LevelBank = {
  schemaVersion: 1,
  generatorVersion: 1,
  level: 'easy',
  count: 1,
  puzzles: [
    {
      id: 'easy-001',
      index: 0,
      puzzle: '.'.repeat(81),
      solution: '1'.repeat(81),
      givens: 0,
      symmetry: 'rotational-180',
      seed: 1,
      rating: { maxCost: 4, score: 10, hardest: 'hidden-single-line', counts: {} },
    },
  ],
};

beforeEach(() => {
  resetPuzzleBankCache();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.endsWith('manifest.json')) {
        return new Response(JSON.stringify(manifest), { status: 200 });
      }
      if (url.endsWith('easy.json')) {
        return new Response(JSON.stringify(easyBank), { status: 200 });
      }
      return new Response('not found', { status: 404 });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadManifest', () => {
  it('fetches and caches the manifest', async () => {
    const a = await loadManifest();
    const b = await loadManifest();
    expect(a).toEqual(manifest);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(b).toBe(a);
  });
});

describe('loadLevel', () => {
  it('fetches a level bank only once per session', async () => {
    const a = await loadLevel('easy');
    const b = await loadLevel('easy');
    expect(a).toEqual(easyBank);
    expect(b).toBe(a);
    expect(fetch).toHaveBeenCalledTimes(2); // manifest + easy.json
  });
});

describe('getPuzzle', () => {
  it('resolves a puzzle record by id', async () => {
    const record = await getPuzzle('easy-001');
    expect(record.id).toBe('easy-001');
  });

  it('rejects for an unknown id', async () => {
    await expect(getPuzzle('easy-999')).rejects.toThrow();
  });
});

describe('levelFromPuzzleId', () => {
  it('extracts the level prefix', () => {
    expect(levelFromPuzzleId('hard-007')).toBe('hard');
    expect(levelFromPuzzleId('beginner-020')).toBe('beginner');
  });
});
