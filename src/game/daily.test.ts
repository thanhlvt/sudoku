import { describe, expect, it } from 'vitest';
import type { DailyState } from '../storage/schema';
import { currentStreak, dailyPuzzle, dateKey, isDailyDone, previousDateKey, recordDailyCompletion } from './daily';

const counts = (): number => 100;

describe('dateKey / previousDateKey', () => {
  it('formats a local date with zero padding', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('steps back across month and year boundaries', () => {
    expect(previousDateKey('2026-03-01')).toBe('2026-02-28');
    expect(previousDateKey('2026-01-01')).toBe('2025-12-31');
    expect(previousDateKey('2024-03-01')).toBe('2024-02-29');
  });
});

describe('dailyPuzzle', () => {
  it('is deterministic for a date and stays within the level bank', () => {
    const a = dailyPuzzle('2026-10-21', counts);
    const b = dailyPuzzle('2026-10-21', counts);
    expect(a).toEqual(b);
    expect(a.index).toBeGreaterThanOrEqual(0);
    expect(a.index).toBeLessThan(100);
    expect(a.id).toBe(`${a.level}-${String(a.index + 1).padStart(3, '0')}`);
  });

  it('respects a small bank', () => {
    expect(dailyPuzzle('2026-10-21', () => 1).index).toBe(0);
  });

  it('varies across days', () => {
    const ids = new Set(
      Array.from({ length: 14 }, (_, i) => dailyPuzzle(`2026-10-${String(i + 1).padStart(2, '0')}`, counts).id),
    );
    expect(ids.size).toBeGreaterThan(10);
  });
});

describe('streak', () => {
  const day = (lastDate: string | null, streak: number, longest = streak): DailyState => ({ streak, longest, lastDate });

  it('starts at 1 on the first completion', () => {
    expect(recordDailyCompletion(day(null, 0), '2026-10-21')).toEqual(day('2026-10-21', 1));
  });

  it('extends when the previous day was completed', () => {
    expect(recordDailyCompletion(day('2026-10-20', 4), '2026-10-21')).toEqual(day('2026-10-21', 5));
  });

  it('resets to 1 after a missed day but remembers the longest run', () => {
    expect(recordDailyCompletion(day('2026-10-18', 6), '2026-10-21')).toEqual(day('2026-10-21', 1, 6));
  });

  it('is idempotent within the same day', () => {
    const done = day('2026-10-21', 3);
    expect(recordDailyCompletion(done, '2026-10-21')).toBe(done);
  });

  it('shows the streak as alive today or yesterday, and 0 once a day was missed', () => {
    expect(currentStreak(day('2026-10-21', 3), '2026-10-21')).toBe(3);
    expect(currentStreak(day('2026-10-20', 3), '2026-10-21')).toBe(3);
    expect(currentStreak(day('2026-10-19', 3), '2026-10-21')).toBe(0);
    expect(isDailyDone(day('2026-10-21', 3), '2026-10-21')).toBe(true);
    expect(isDailyDone(day('2026-10-20', 3), '2026-10-21')).toBe(false);
  });
});
