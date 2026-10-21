import { fnv1a } from '../core/rng';
import type { Level } from '../core/types';
import type { SavedGame } from '../storage/schema';
import { puzzleIdOf } from './puzzleBank';

/** The weekly challenge: five puzzles of rising difficulty, all to be solved within the (Monday-first) week. */
export const WEEKLY_LEVELS: readonly Level[] = ['easy', 'medium', 'medium', 'hard', 'expert'];
/** Experience for finishing all five, on top of what the puzzles pay. */
export const WEEKLY_BONUS_XP = 300;

/** The current week as the screens need it: its Monday and the ids of its five puzzles. */
export interface WeeklyWeek {
  key: string;
  ids: string[];
}

export interface WeeklyPuzzle {
  level: Level;
  index: number;
  id: string;
}

/** `YYYY-MM-DD` of the Monday of the week that contains `key`. */
export function weekStartKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  const sinceMonday = (date.getUTCDay() + 6) % 7; // Sunday is 0 in getUTCDay
  date.setUTCDate(date.getUTCDate() - sinceMonday);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

/** `YYYY-MM-DD` of the Sunday that ends the week starting at `weekKey`. */
export function weekEndKey(weekKey: string): string {
  const [y, m, d] = weekKey.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d + 6));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

/**
 * The week's five puzzles: deterministic for a week (the same on every device), distinct from each other, and
 * independent of the player's progress.
 */
export function weeklyPuzzles(weekKey: string, countOf: (level: Level) => number): WeeklyPuzzle[] {
  const used = new Set<string>();
  return WEEKLY_LEVELS.map((level, i) => {
    const count = Math.max(1, countOf(level));
    let index = fnv1a(`weekly:${weekKey}:${i}`) % count;
    // Two steps share a level (medium): never give the same puzzle twice.
    for (let tries = 0; used.has(puzzleIdOf(level, index)) && tries < count; tries++) index = (index + 1) % count;
    const id = puzzleIdOf(level, index);
    used.add(id);
    return { level, index, id };
  });
}

/** The week as a half-open range of local-time milliseconds. */
export function weekRangeMs(weekKey: string): { startMs: number; endMs: number } {
  const [y, m, d] = weekKey.split('-').map(Number) as [number, number, number];
  return { startMs: new Date(y, m - 1, d).getTime(), endMs: new Date(y, m - 1, d + 7).getTime() };
}

/**
 * Which of the week's puzzles are done. A solve only counts if it happened *during* the week, so a puzzle the
 * player happened to finish earlier does not pre-complete the challenge.
 */
export function weeklyProgress(weekKey: string, puzzles: readonly { id: string }[], games: readonly SavedGame[]): boolean[] {
  const { startMs, endMs } = weekRangeMs(weekKey);
  const byId = new Map(games.map((g) => [g.puzzleId, g]));
  return puzzles.map((p) => {
    const g = byId.get(p.id);
    return g?.status === 'completed' && g.completedAt !== undefined && g.completedAt >= startMs && g.completedAt < endMs;
  });
}
