// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  KEYS,
  clearAllProgress,
  defaultStats,
  deleteGame,
  loadGame,
  loadSettings,
  loadStats,
  migrate,
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
    const settings = { ...DEFAULT_SETTINGS, theme: 'dark' as const, soundEnabled: true };
    saveSettings(settings);
    expect(loadSettings()).toEqual(settings);
  });

  it('returns defaults when nothing saved', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
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
