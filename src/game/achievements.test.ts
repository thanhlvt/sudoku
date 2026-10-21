import { describe, expect, it } from 'vitest';
import { DEFAULT_DAILY, defaultStats, type DailyState, type SavedGame, type Stats } from '../storage/schema';
import { ACHIEVEMENTS, evaluateAchievements, unlockNew, type AchievementContext } from './achievements';

function game(id: string, extra: Partial<SavedGame> = {}): SavedGame {
  return {
    puzzleId: id,
    board: '.'.repeat(81),
    notes: '0'.repeat(243),
    elapsedMs: 60_000,
    mistakes: 0,
    hintsUsed: 0,
    status: 'completed',
    updatedAt: 1,
    ...extra,
  };
}

function ctx(games: SavedGame[] = [], stats: Stats = defaultStats(), daily: DailyState = DEFAULT_DAILY): AchievementContext {
  return { games, stats, daily };
}

const status = (c: AchievementContext, id: string) => evaluateAchievements(c).find((s) => s.def.id === id)!;

describe('achievements', () => {
  it('has unique ids', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('unlocks nothing for a new player', () => {
    expect(evaluateAchievements(ctx()).filter((s) => s.unlocked)).toEqual([]);
  });

  it('counts only completed games', () => {
    const c = ctx([game('easy-001'), game('easy-002', { status: 'in-progress' })]);
    expect(status(c, 'solved-1').unlocked).toBe(true);
    expect(status(c, 'solved-10').value).toBe(1);
  });

  it('counts flawless solves: no mistakes and no hints', () => {
    const c = ctx([
      game('easy-001'),
      game('easy-002', { mistakes: 1 }),
      game('easy-003', { hintsUsed: 1 }),
    ]);
    expect(status(c, 'flawless-1').unlocked).toBe(true);
    expect(status(c, 'flawless-10').value).toBe(1);
  });

  it('tracks the longest daily streak, not the current one', () => {
    const c = ctx([], defaultStats(), { streak: 1, longest: 7, lastDate: '2026-10-21', freezes: 0 });
    expect(status(c, 'streak-7').unlocked).toBe(true);
    expect(status(c, 'streak-30').unlocked).toBe(false);
  });

  it('counts how many distinct levels were solved', () => {
    const c = ctx([game('beginner-001'), game('easy-001'), game('easy-002'), game('expert-001')]);
    expect(status(c, 'all-levels').value).toBe(3);
    expect(status(c, 'expert-1').unlocked).toBe(true);
    expect(status(c, 'hard-1').unlocked).toBe(false);
  });

  it('unlocks a speed achievement only at or under the limit', () => {
    const slow = defaultStats();
    slow.hard.bestMs = 11 * 60_000;
    expect(status(ctx([], slow), 'speed-hard').unlocked).toBe(false);
    const fast = defaultStats();
    fast.hard.bestMs = 10 * 60_000;
    expect(status(ctx([], fast), 'speed-hard').unlocked).toBe(true);
  });

  it('ignores games whose id is not a known level', () => {
    expect(status(ctx([game('__proto__-001')]), 'all-levels').value).toBe(0);
  });
});

describe('unlockNew', () => {
  it('records the time of newly earned achievements and lists them', () => {
    const result = unlockNew({}, ctx([game('easy-001')]), 1234);
    expect(result.added.map((a) => a.id)).toEqual(['solved-1', 'flawless-1']);
    expect(result.unlocked).toEqual({ 'solved-1': 1234, 'flawless-1': 1234 });
  });

  it('does not report or re-stamp what was already unlocked', () => {
    const stored = { 'solved-1': 1, 'flawless-1': 2 };
    const result = unlockNew(stored, ctx([game('easy-001')]), 9999);
    expect(result.added).toEqual([]);
    expect(result.unlocked).toBe(stored);
  });

  it('keeps an achievement unlocked after the data behind it is gone', () => {
    const stored = { 'solved-1': 1 };
    const result = unlockNew(stored, ctx([]), 5);
    expect(result.unlocked).toBe(stored);
  });
});
