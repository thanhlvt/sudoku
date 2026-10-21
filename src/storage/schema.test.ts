// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  KEYS,
  clearAllProgress,
  defaultStats,
  DEFAULT_DAILY,
  deleteGame,
  listGames,
  loadAchievements,
  loadWeekly,
  saveWeekly,
  loadDaily,
  loadGame,
  loadLast,
  loadSettings,
  loadStats,
  migrate,
  parseDaily,
  parseLast,
  parseMeta,
  parseSavedGame,
  parseSettings,
  parseStats,
  saveAchievements,
  saveDaily,
  saveGame,
  saveSettings,
  saveStats,
  syncGeneratorVersion,
} from './schema';
import { readJSON, writeJSON } from './storage';

beforeEach(() => {
  window.localStorage.clear();
});

describe('migrate', () => {
  it('initializes default meta when none exists', () => {
    migrate();
    const meta = readJSON<{ schemaVersion: number } | null>(KEYS.meta, null);
    expect(meta).not.toBeNull();
    expect(meta!.schemaVersion).toBe(1);
  });

  it('does not clobber existing stats when meta is missing', () => {
    saveStats(defaultStats());
    const stats = loadStats();
    stats.easy.completed = 3;
    saveStats(stats);
    migrate();
    expect(loadStats().easy.completed).toBe(3);
  });
});

describe('syncGeneratorVersion', () => {
  it('reports no mismatch on first sync (generatorVersion was null)', () => {
    migrate();
    expect(syncGeneratorVersion(1)).toBe(false);
  });

  it('reports a mismatch when the version changed', () => {
    migrate();
    syncGeneratorVersion(1);
    expect(syncGeneratorVersion(2)).toBe(true);
  });
});

describe('settings', () => {
  it('round-trips settings', () => {
    const settings = { ...DEFAULT_SETTINGS, theme: 'dark' as const, soundEnabled: false, hapticsEnabled: false };
    saveSettings(settings);
    expect(loadSettings()).toEqual(settings);
  });

  it('returns defaults when nothing saved', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('fills fields missing from settings saved by an older build with their defaults', () => {
    writeJSON(KEYS.settings, { theme: 'dark', highlightPeers: false });
    expect(loadSettings()).toEqual({ ...DEFAULT_SETTINGS, theme: 'dark', highlightPeers: false });
  });
});

describe('settings palette and intro flag', () => {
  it('keeps a known palette and drops an unknown one', () => {
    writeJSON(KEYS.settings, { boardPalette: 'ocean', seenIntro: true });
    expect(loadSettings()).toMatchObject({ boardPalette: 'ocean', seenIntro: true });
    writeJSON(KEYS.settings, { boardPalette: '<script>', seenIntro: 'yes' });
    expect(loadSettings()).toMatchObject({ boardPalette: 'violet', seenIntro: false });
  });
});

describe('achievements record', () => {
  it('round-trips and starts empty', () => {
    expect(loadAchievements()).toEqual({});
    saveAchievements({ 'solved-1': 123, 'streak-7': 456 });
    expect(loadAchievements()).toEqual({ 'solved-1': 123, 'streak-7': 456 });
  });

  it('drops malformed entries but keeps the good ones', () => {
    // Raw text: a `__proto__` key only survives JSON.parse, not an object literal.
    window.localStorage.setItem(
      KEYS.achievements,
      '{"solved-1":5,"__proto__":{"polluted":1},"bad id":2,"x-1":-4,"y-1":"now","ok-2":9}',
    );
    const loaded = loadAchievements();
    expect(loaded).toEqual({ 'solved-1': 5, 'ok-2': 9 });
    expect(Object.getPrototypeOf(loaded)).toBe(Object.prototype);
  });

  it('replaces a record of the wrong shape', () => {
    writeJSON(KEYS.achievements, [1, 2, 3]);
    expect(loadAchievements()).toEqual({});
  });
});

describe('daily state', () => {
  it('defaults to an empty streak', () => {
    expect(loadDaily()).toEqual(DEFAULT_DAILY);
  });

  it('round-trips', () => {
    saveDaily({ streak: 4, longest: 9, lastDate: '2026-10-21', freezes: 1 });
    expect(loadDaily()).toEqual({ streak: 4, longest: 9, lastDate: '2026-10-21', freezes: 1 });
  });
});

describe('listGames', () => {
  const base = { board: '.'.repeat(81), notes: '000'.repeat(81), elapsedMs: 0, mistakes: 0, hintsUsed: 0, updatedAt: 1 };

  it('returns every saved game and ignores other keys', () => {
    saveGame({ ...base, puzzleId: 'easy-001', status: 'completed' });
    saveGame({ ...base, puzzleId: 'hard-004', status: 'in-progress' });
    writeJSON(KEYS.stats, defaultStats());
    const ids = listGames().map((g) => g.puzzleId).sort();
    expect(ids).toEqual(['easy-001', 'hard-004']);
  });

  it('skips corrupt records instead of throwing', () => {
    window.localStorage.setItem(KEYS.game('easy-009'), '{not json');
    expect(listGames()).toEqual([]);
  });
});

describe('saved games', () => {
  it('round-trips a saved game including notes', () => {
    const game = {
      puzzleId: 'easy-001',
      board: '1'.repeat(81),
      notes: '000'.repeat(80) + '007',
      elapsedMs: 12345,
      mistakes: 2,
      hintsUsed: 1,
      status: 'in-progress' as const,
      updatedAt: 999,
    };
    saveGame(game);
    expect(loadGame('easy-001')).toEqual(game);
  });

  it('returns null for a game that was never saved', () => {
    expect(loadGame('nope')).toBeNull();
  });

  it('deleteGame removes it', () => {
    saveGame({
      puzzleId: 'easy-002',
      board: '.'.repeat(81),
      notes: '000'.repeat(81),
      elapsedMs: 0,
      mistakes: 0,
      hintsUsed: 0,
      status: 'in-progress',
      updatedAt: 1,
    });
    deleteGame('easy-002');
    expect(loadGame('easy-002')).toBeNull();
  });
});

describe('hostile or corrupt stored data', () => {
  const goodGame = {
    puzzleId: 'easy-001',
    board: '.'.repeat(81),
    notes: '000'.repeat(81),
    elapsedMs: 5000,
    mistakes: 1,
    hintsUsed: 0,
    status: 'in-progress',
    updatedAt: 10,
  };
  const put = (key: string, value: unknown): void => window.localStorage.setItem(key, JSON.stringify(value));

  it('stats that are null, an array, a string or lack levels never crash and fall back to usable values', () => {
    for (const bad of [null, [], 'oops', 7, true]) {
      put(KEYS.stats, bad);
      expect(loadStats()).toEqual(defaultStats());
      expect(window.localStorage.getItem(KEYS.stats)).toBeNull(); // the bad record was dropped
    }
    put(KEYS.stats, { easy: { played: 3, completed: 2, bestMs: 9000, totalMs: 20000, perfectRuns: 1 } });
    const stats = loadStats();
    expect(stats.easy.completed).toBe(2);
    expect(stats.expert).toEqual(defaultStats().expert); // missing level filled in
  });

  it('resets only the level whose stats are malformed', () => {
    put(KEYS.stats, {
      ...defaultStats(),
      easy: { played: 'many', completed: 2, bestMs: 1, totalMs: 1, perfectRuns: 0 },
      hard: { played: 4, completed: 4, bestMs: 70000, totalMs: 300000, perfectRuns: 2 },
    });
    const stats = loadStats();
    expect(stats.easy).toEqual(defaultStats().easy);
    expect(stats.hard.completed).toBe(4);
  });

  it('rejects stat numbers that are negative, NaN-like or absurd', () => {
    for (const patch of [{ bestMs: -1 }, { bestMs: 1e30 }, { totalMs: -5 }, { played: 1.5 }, { completed: -1 }]) {
      put(KEYS.stats, { ...defaultStats(), easy: { ...defaultStats().easy, ...patch } });
      expect(loadStats().easy).toEqual(defaultStats().easy);
    }
  });

  it('settings: wrong types fall back per field, non-objects fall back entirely', () => {
    put(KEYS.settings, { theme: 'neon', showMistakes: 'yes', highlightPeers: false, extra: 1 });
    expect(loadSettings()).toEqual({ ...DEFAULT_SETTINGS, highlightPeers: false });
    for (const bad of [null, 'dark', [], 3]) {
      put(KEYS.settings, bad);
      expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    }
  });

  it('daily: junk fields are reset, a valid date survives', () => {
    put(KEYS.daily, { streak: '9', longest: -2, lastDate: '2026-10-21<script>' });
    expect(loadDaily()).toEqual(DEFAULT_DAILY);
    put(KEYS.daily, { streak: 3, longest: 5, lastDate: '2026-10-21' });
    expect(loadDaily()).toEqual({ streak: 3, longest: 5, lastDate: '2026-10-21', freezes: 0 });
    put(KEYS.daily, null);
    expect(loadDaily()).toEqual(DEFAULT_DAILY);
  });

  it('loadLast accepts only a well-formed puzzle id', () => {
    put(KEYS.last, { puzzleId: 'hard-004', at: 5 });
    expect(loadLast()).toEqual({ puzzleId: 'hard-004', at: 5 });
    for (const bad of [{ puzzleId: '__proto__-001', at: 5 }, { puzzleId: 'hard-004', at: 'now' }, null, 'x']) {
      put(KEYS.last, bad);
      expect(loadLast()).toBeNull();
    }
  });

  it('a saved game with a bad board, notes, numbers or status is rejected and deleted', () => {
    const bads: Record<string, unknown>[] = [
      { board: 'x'.repeat(81) },
      { board: '123' },
      { board: 5 },
      { board: undefined },
      { notes: 'zz'.repeat(121) + 'z' },
      { notes: '' },
      { notes: 7 },
      { elapsedMs: '5' },
      { elapsedMs: -1 },
      { elapsedMs: Infinity },
      { mistakes: -1 },
      { mistakes: 1.5 },
      { hintsUsed: '2' },
      { status: 'won' },
      { updatedAt: 'later' },
      { completedAt: 'then' },
      { puzzleId: 'easy-002' }, // belongs to a different key
      { puzzleId: '__proto__-001' },
    ];
    for (const patch of bads) {
      put(KEYS.game('easy-001'), { ...goodGame, ...patch });
      expect(loadGame('easy-001'), JSON.stringify(patch)).toBeNull();
      expect(window.localStorage.getItem(KEYS.game('easy-001'))).toBeNull();
    }
    for (const notObject of [null, 4, 'str', []]) {
      put(KEYS.game('easy-001'), notObject);
      expect(loadGame('easy-001')).toBeNull();
    }
  });

  it('a well-formed saved game passes, including completedAt', () => {
    put(KEYS.game('easy-001'), { ...goodGame, status: 'completed', completedAt: 99 });
    expect(loadGame('easy-001')).toEqual({ ...goodGame, status: 'completed', completedAt: 99 });
  });

  it('listGames drops invalid records and ones filed under the wrong key', () => {
    put(KEYS.game('easy-001'), goodGame);
    put(KEYS.game('easy-002'), { ...goodGame, board: 'bad' });
    put(KEYS.game('hard-001'), goodGame); // says easy-001 but sits under hard-001
    put(KEYS.game('__proto__-001'), { ...goodGame, puzzleId: '__proto__-001', status: 'completed' });
    expect(listGames().map((g) => g.puzzleId)).toEqual(['easy-001']);
  });

  it('migrate recreates meta when it is malformed, without touching stats', () => {
    saveStats({ ...defaultStats(), easy: { ...defaultStats().easy, completed: 4 } });
    put(KEYS.meta, { schemaVersion: 'one' });
    migrate();
    expect(readJSON<{ schemaVersion: number } | null>(KEYS.meta, null)!.schemaVersion).toBe(1);
    expect(loadStats().easy.completed).toBe(4);
  });

  it('parse functions never throw on arbitrary input', () => {
    const weird: unknown[] = [undefined, null, 0, NaN, '', 'a', [], [1], {}, { __proto__: { x: 1 } }, () => 1, Symbol('s')];
    for (const w of weird) {
      expect(() => [parseSavedGame, parseStats, parseSettings, parseDaily, parseLast, parseMeta].forEach((p) => p(w))).not.toThrow();
    }
  });
});

describe('clearAllProgress', () => {
  it('removes every sudoku: key including old schema versions', () => {
    writeJSON('sudoku:v1:settings', {});
    writeJSON('sudoku:v0:legacy', {});
    writeJSON('unrelated:key', {});
    clearAllProgress();
    expect(readJSON('sudoku:v1:settings', null)).toBeNull();
    expect(readJSON('sudoku:v0:legacy', null)).toBeNull();
    expect(readJSON('unrelated:key', null)).not.toBeNull();
  });
});

describe('saved game mode', () => {
  const base = { puzzleId: 'easy-001', board: '.'.repeat(81), notes: '0'.repeat(243), elapsedMs: 1, mistakes: 0, hintsUsed: 0, status: 'in-progress', updatedAt: 1 };

  it('keeps a known mode and drops an unknown one', () => {
    expect(parseSavedGame({ ...base, mode: 'perfect' })?.mode).toBe('perfect');
    expect(parseSavedGame({ ...base, mode: 'time' })?.mode).toBe('time');
    expect(parseSavedGame({ ...base, mode: 'hardcore' })).not.toHaveProperty('mode');
    expect(parseSavedGame({ ...base, mode: { x: 1 } })).not.toHaveProperty('mode');
    expect(parseSavedGame(base)).not.toHaveProperty('mode');
  });
});

describe('weekly record', () => {
  it('round-trips and starts empty', () => {
    expect(loadWeekly()).toEqual({ done: [] });
    saveWeekly({ done: ['2026-10-19', '2026-10-26'] });
    expect(loadWeekly()).toEqual({ done: ['2026-10-19', '2026-10-26'] });
  });

  it('keeps only well-formed, distinct week keys', () => {
    writeJSON(KEYS.weekly, { done: ['2026-10-19', '2026-10-19', 'nope', 5, '2026-10-26<x>', null, '2026-11-02'] });
    expect(loadWeekly()).toEqual({ done: ['2026-10-19', '2026-11-02'] });
  });

  it('replaces a record of the wrong shape', () => {
    writeJSON(KEYS.weekly, { done: 'all of them' });
    expect(loadWeekly()).toEqual({ done: [] });
    writeJSON(KEYS.weekly, [1]);
    expect(loadWeekly()).toEqual({ done: [] });
  });
});

describe('reminder setting', () => {
  it('is on by default and can be switched off', () => {
    expect(DEFAULT_SETTINGS.reminderEnabled).toBe(true);
    writeJSON(KEYS.settings, { reminderEnabled: false });
    expect(loadSettings().reminderEnabled).toBe(false);
    writeJSON(KEYS.settings, { reminderEnabled: 'no' });
    expect(loadSettings().reminderEnabled).toBe(true);
  });
});
