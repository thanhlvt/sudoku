import { describe, expect, it } from 'vitest';
import type { SavedGame } from '../storage/schema';
import { WEEKLY_LEVELS, weekEndKey, weekRangeMs, weekStartKey, weeklyProgress, weeklyPuzzles } from './weekly';

const counts = (): number => 100;

function solved(id: string, at: number | undefined, status: SavedGame['status'] = 'completed'): SavedGame {
  return {
    puzzleId: id,
    board: '',
    notes: '',
    elapsedMs: 0,
    mistakes: 0,
    hintsUsed: 0,
    status,
    completedAt: at,
    updatedAt: 1,
  };
}

describe('week boundaries', () => {
  it('starts the week on Monday', () => {
    // 2026-10-21 is a Wednesday.
    expect(weekStartKey('2026-10-21')).toBe('2026-10-19');
    expect(weekStartKey('2026-10-19')).toBe('2026-10-19');
    expect(weekStartKey('2026-10-25')).toBe('2026-10-19'); // Sunday belongs to the week that began on Monday
    expect(weekStartKey('2026-10-26')).toBe('2026-10-26');
  });

  it('crosses month and year boundaries', () => {
    expect(weekStartKey('2026-01-01')).toBe('2025-12-29');
    expect(weekStartKey('2026-03-01')).toBe('2026-02-23');
    expect(weekEndKey('2025-12-29')).toBe('2026-01-04');
    expect(weekEndKey('2026-10-19')).toBe('2026-10-25');
  });
});

describe('weeklyPuzzles', () => {
  it('gives five puzzles of rising difficulty, the same every time', () => {
    const a = weeklyPuzzles('2026-10-19', counts);
    expect(a.map((p) => p.level)).toEqual([...WEEKLY_LEVELS]);
    expect(weeklyPuzzles('2026-10-19', counts)).toEqual(a);
    for (const p of a) {
      expect(p.index).toBeGreaterThanOrEqual(0);
      expect(p.index).toBeLessThan(100);
      expect(p.id).toMatch(/^(easy|medium|hard|expert)-\d{3}$/);
    }
  });

  it('never repeats a puzzle, even in a tiny bank', () => {
    const ids = weeklyPuzzles('2026-10-19', () => 2).map((p) => p.id);
    // Both medium steps must differ (the bank has two puzzles).
    expect(ids[1]).not.toBe(ids[2]);
    expect(new Set(ids).size).toBe(5);
  });

  it('changes from week to week', () => {
    const a = weeklyPuzzles('2026-10-19', counts).map((p) => p.id).join();
    const b = weeklyPuzzles('2026-10-26', counts).map((p) => p.id).join();
    expect(a).not.toBe(b);
  });
});

describe('weeklyProgress', () => {
  const week = '2026-10-19';
  const puzzles = weeklyPuzzles(week, counts);
  const { startMs, endMs } = weekRangeMs(week);

  it('counts a puzzle solved during the week', () => {
    const progress = weeklyProgress(week, puzzles, [solved(puzzles[0]!.id, startMs + 1000)]);
    expect(progress).toEqual([true, false, false, false, false]);
  });

  it('does not count a solve from before the week, or after it', () => {
    const games = [solved(puzzles[0]!.id, startMs - 1), solved(puzzles[1]!.id, endMs)];
    expect(weeklyProgress(week, puzzles, games)).toEqual([false, false, false, false, false]);
  });

  it('counts the first and last instants of the week', () => {
    const games = [solved(puzzles[0]!.id, startMs), solved(puzzles[1]!.id, endMs - 1)];
    expect(weeklyProgress(week, puzzles, games).slice(0, 2)).toEqual([true, true]);
  });

  it('ignores unfinished games and solves with no recorded time', () => {
    const games = [solved(puzzles[0]!.id, startMs + 5, 'in-progress'), solved(puzzles[1]!.id, undefined)];
    expect(weeklyProgress(week, puzzles, games)).toEqual([false, false, false, false, false]);
  });

  it('reports a finished week when all five are solved inside it', () => {
    const games = puzzles.map((p, i) => solved(p.id, startMs + (i + 1) * 3_600_000));
    expect(weeklyProgress(week, puzzles, games).every(Boolean)).toBe(true);
  });
});
