import { fnv1a } from '../core/rng';
import type { Level } from '../core/types';
import type { DailyState } from '../storage/schema';
import { puzzleIdOf } from './puzzleBank';

/** Difficulty by day, cycling every 7 days, so the streak mostly asks for a medium-sized effort. */
const DAILY_LEVELS: readonly Level[] = ['easy', 'medium', 'easy', 'hard', 'medium', 'hard', 'expert'];

const MS_PER_DAY = 86_400_000;

/** Local calendar day as `YYYY-MM-DD`. The date is passed in so this stays pure/testable. */
export function dateKey(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

function dayNumber(key: string): number {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

export function previousDateKey(key: string): string {
  const d = new Date((dayNumber(key) - 1) * MS_PER_DAY);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Deterministic puzzle of the day: same date -> same puzzle on every device. */
export function dailyPuzzle(key: string, countOf: (level: Level) => number): { level: Level; index: number; id: string } {
  const level = DAILY_LEVELS[dayNumber(key) % DAILY_LEVELS.length]!;
  const count = Math.max(1, countOf(level));
  const index = fnv1a(`daily:${key}`) % count;
  return { level, index, id: puzzleIdOf(level, index) };
}

/** The streak as the player should see it today: it survives until a whole day is missed. */
export function currentStreak(daily: DailyState, today: string): number {
  if (daily.lastDate === today || daily.lastDate === previousDateKey(today)) return daily.streak;
  return 0;
}

export function isDailyDone(daily: DailyState, today: string): boolean {
  return daily.lastDate === today;
}

export function recordDailyCompletion(daily: DailyState, today: string): DailyState {
  if (daily.lastDate === today) return daily;
  const streak = daily.lastDate === previousDateKey(today) ? daily.streak + 1 : 1;
  return { streak, longest: Math.max(daily.longest, streak), lastDate: today };
}
