// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { applyBackup, createBackup, parseBackup } from './backup';
import {
  DEFAULT_SETTINGS,
  KEYS,
  listGames,
  loadAchievements,
  loadDaily,
  loadSettings,
  loadStats,
  saveAchievements,
  saveDaily,
  saveGame,
  saveSettings,
  saveStats,
  saveWeekly,
  loadWeekly,
  defaultStats,
  type SavedGame,
} from './schema';

function game(id: string, extra: Partial<SavedGame> = {}): SavedGame {
  return {
    puzzleId: id,
    board: '.'.repeat(81),
    notes: '0'.repeat(243),
    elapsedMs: 5000,
    mistakes: 1,
    hintsUsed: 0,
    status: 'completed',
    completedAt: 99,
    updatedAt: 100,
    ...extra,
  };
}

function seed(): void {
  saveGame(game('easy-001'));
  saveGame(game('hard-007', { status: 'in-progress', completedAt: undefined }));
  saveSettings({ ...DEFAULT_SETTINGS, theme: 'dark', boardPalette: 'forest' });
  const stats = defaultStats();
  stats.easy.completed = 4;
  saveStats(stats);
  saveDaily({ streak: 3, longest: 5, lastDate: '2026-10-21', freezes: 1 });
  saveAchievements({ 'solved-1': 123 });
  saveWeekly({ done: ['2026-10-19'] });
  saveGame(game('easy-009', { mode: 'time' }));
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('backup round trip', () => {
  it('restores everything that was backed up', () => {
    seed();
    const text = createBackup(555);
    window.localStorage.clear();

    const parsed = parseBackup(text);
    expect(parsed).not.toBeNull();
    expect(parsed!.exportedAt).toBe(555);
    applyBackup(parsed!);

    expect(
      listGames()
        .map((g) => g.puzzleId)
        .sort(),
    ).toEqual(['easy-001', 'easy-009', 'hard-007']);
    expect(loadSettings()).toMatchObject({ theme: 'dark', boardPalette: 'forest' });
    expect(loadStats().easy.completed).toBe(4);
    expect(loadDaily()).toEqual({ streak: 3, longest: 5, lastDate: '2026-10-21', freezes: 1 });
    expect(loadAchievements()).toEqual({ 'solved-1': 123 });
    expect(loadWeekly()).toEqual({ done: ['2026-10-19'] });
    expect(listGames().find((g) => g.puzzleId === 'easy-009')?.mode).toBe('time');
  });

  it('replaces existing progress instead of merging into it', () => {
    seed();
    const text = createBackup(1);
    saveGame(game('medium-050'));
    applyBackup(parseBackup(text)!);
    expect(listGames().map((g) => g.puzzleId)).not.toContain('medium-050');
  });

  it('never writes solutions or anything outside the known parts', () => {
    seed();
    const text = createBackup(1);
    expect(text).not.toContain('solution');
    expect(Object.keys(JSON.parse(text).data).sort()).toEqual(['achievements', 'daily', 'games', 'last', 'settings', 'stats', 'weekly']);
  });
});

describe('parseBackup rejects what is not a backup', () => {
  it.each([
    ['not json', '{nope'],
    ['an array', '[]'],
    ['another app', JSON.stringify({ app: 'other', format: 1, data: {} })],
    ['a future format', JSON.stringify({ app: 'sudoku', format: 2, data: {} })],
    ['no data', JSON.stringify({ app: 'sudoku', format: 1 })],
    ['empty data', JSON.stringify({ app: 'sudoku', format: 1, data: {} })],
  ])('%s', (_name, text) => {
    expect(parseBackup(text)).toBeNull();
  });

  it('refuses an enormous file without parsing it', () => {
    expect(parseBackup('x'.repeat(9_000_000))).toBeNull();
  });
});

describe('parseBackup sanitises hostile content', () => {
  it('drops games that are malformed, mis-filed or have a bad id, and keeps the good ones', () => {
    const text = JSON.stringify({
      app: 'sudoku',
      format: 1,
      data: {
        games: {
          'easy-001': game('easy-001'),
          'easy-002': game('easy-003'), // filed under the wrong key
          '__proto__-001': game('__proto__-001'),
          'easy-004': { puzzleId: 'easy-004', board: 'short' },
          'easy-005': 'nope',
        },
      },
    });
    const parsed = parseBackup(text)!;
    expect(parsed.games.map((g) => g.puzzleId)).toEqual(['easy-001']);
  });

  it('keeps only well-formed parts of the rest', () => {
    const text = JSON.stringify({
      app: 'sudoku',
      format: 1,
      data: {
        settings: { theme: 'dark', boardPalette: 'nonsense', soundEnabled: 'loud' },
        daily: { streak: -4, longest: 'x', lastDate: 'yesterday', freezes: 99 },
        achievements: { 'solved-1': 5, 'bad id!': 6 },
        stats: 'nope',
        last: { puzzleId: '../etc', at: 1 },
      },
    });
    const parsed = parseBackup(text)!;
    expect(parsed.settings).toMatchObject({ theme: 'dark', boardPalette: 'violet', soundEnabled: true });
    expect(parsed.daily).toEqual({ streak: 0, longest: 0, lastDate: null, freezes: 0 });
    expect(parsed.achievements).toEqual({ 'solved-1': 5 });
    expect(parsed.stats).toBeNull();
    expect(parsed.last).toBeNull();
  });

  it('leaves untouched what a backup does not contain', () => {
    saveSettings({ ...DEFAULT_SETTINGS, theme: 'light' });
    const text = JSON.stringify({ app: 'sudoku', format: 1, data: { games: { 'easy-001': game('easy-001') } } });
    applyBackup(parseBackup(text)!);
    // Progress is wiped and replaced; settings not in the file fall back to defaults, not to stale values.
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    expect(window.localStorage.getItem(KEYS.settings)).toBeNull();
  });
});
