import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getPuzzle,
  levelFromPuzzleId,
  loadLevel,
  loadManifest,
  resetPuzzleBankCache,
  validateLevelBank,
  validateManifest,
} from './puzzleBank';
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

describe('failed loads are not remembered', () => {
  it('retries the manifest after a network error instead of replaying the rejection', async () => {
    const flaky = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('network down'))
      .mockImplementation(async () => new Response(JSON.stringify(manifest), { status: 200 }));
    vi.stubGlobal('fetch', flaky);

    await expect(loadManifest()).rejects.toThrow('network down');
    await expect(loadManifest()).resolves.toEqual(manifest);
    expect(flaky).toHaveBeenCalledTimes(2);
  });

  it('retries a level bank after an HTTP error', async () => {
    let easyCalls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('manifest.json')) return new Response(JSON.stringify(manifest), { status: 200 });
        easyCalls++;
        return easyCalls === 1
          ? new Response('boom', { status: 500 })
          : new Response(JSON.stringify(easyBank), { status: 200 });
      }),
    );

    await expect(loadLevel('easy')).rejects.toThrow('500');
    await expect(loadLevel('easy')).resolves.toEqual(easyBank);
  });
});

describe('response validation', () => {
  it('rejects a manifest that is not the expected shape (e.g. an HTML page served with 200)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"levels":"nope"}', { status: 200 })));
    await expect(loadManifest()).rejects.toThrow(/manifest/i);
  });

  it('rejects a manifest whose file name could escape the puzzles folder', () => {
    for (const file of ['../secret.json', 'https://evil.example/x.json', 'a/b.json', 'easy.json?x=1', 'easy.js']) {
      const bad = { ...manifest, levels: [{ level: 'easy', count: 1, file }] };
      expect(() => validateManifest(bad), file).toThrow();
    }
  });

  it('rejects a bank with a malformed or self-contradicting puzzle', () => {
    const record = easyBank.puzzles[0]!;
    const withRecord = (patch: Record<string, unknown>): unknown => ({ ...easyBank, puzzles: [{ ...record, ...patch }] });
    expect(() => validateLevelBank(withRecord({ puzzle: 'x'.repeat(81) }), 'easy')).toThrow();
    expect(() => validateLevelBank(withRecord({ puzzle: '.'.repeat(80) }), 'easy')).toThrow();
    expect(() => validateLevelBank(withRecord({ solution: '0'.repeat(81) }), 'easy')).toThrow();
    expect(() => validateLevelBank(withRecord({ id: 'easy-002' }), 'easy')).toThrow(); // id must match index
    expect(() => validateLevelBank(withRecord({ puzzle: '2' + '.'.repeat(80) }), 'easy')).toThrow(); // given != solution
    expect(() => validateLevelBank(easyBank, 'hard')).toThrow(); // wrong level
  });

  it('accepts every bank file that is committed to public/puzzles', () => {
    const dir = join(process.cwd(), 'public', 'puzzles');
    const committed = validateManifest(JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')));
    expect(committed.levels).toHaveLength(5);
    for (const { level, count, file } of committed.levels) {
      const bank = validateLevelBank(JSON.parse(readFileSync(join(dir, file), 'utf8')), level);
      expect(bank.puzzles).toHaveLength(count);
    }
  });
});

describe('getPuzzle', () => {
  it('rejects a malformed id without touching the network', async () => {
    await expect(getPuzzle('__proto__-001')).rejects.toThrow(/invalid/i);
    expect(fetch).not.toHaveBeenCalled();
  });

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
