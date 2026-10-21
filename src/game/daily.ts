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

/** Streak lengths worth a celebration on the result screen. */
export const STREAK_MILESTONES: readonly number[] = [3, 7, 14, 30, 60, 100, 365];
/** A freeze is earned for every 7 days of streak, up to this many held at once. */
export const FREEZE_EVERY_DAYS = 7;
export const MAX_FREEZES = 2;

/**
 * The streak as the player should see it today: it survives until a whole day is missed -- or, with a freeze
 * in hand, until two are (a freeze covers exactly one missed day, and is spent when the next challenge is done).
 */
export function currentStreak(daily: DailyState, today: string): number {
  const yesterday = previousDateKey(today);
  if (daily.lastDate === today || daily.lastDate === yesterday) return daily.streak;
  if (daily.freezes > 0 && daily.lastDate === previousDateKey(yesterday)) return daily.streak;
  return 0;
}

export function isDailyDone(daily: DailyState, today: string): boolean {
  return daily.lastDate === today;
}

export interface DailyCompletion {
  next: DailyState;
  /** The streak length reached, when it is one of `STREAK_MILESTONES` and this completion extended it. */
  milestone: number | null;
  /** A freeze was spent to bridge a missed day. */
  freezeUsed: boolean;
  /** A freeze was earned by this completion. */
  freezeEarned: boolean;
}

/** What finishing today's challenge does to the streak. Pure: `today` is passed in. */
export function completeDaily(daily: DailyState, today: string): DailyCompletion {
  if (daily.lastDate === today) return { next: daily, milestone: null, freezeUsed: false, freezeEarned: false };
  const yesterday = previousDateKey(today);
  let streak = 1;
  let freezes = daily.freezes;
  let freezeUsed = false;
  if (daily.lastDate === yesterday) {
    streak = daily.streak + 1;
  } else if (daily.freezes > 0 && daily.lastDate === previousDateKey(yesterday)) {
    streak = daily.streak + 1;
    freezes--;
    freezeUsed = true;
  }
  let freezeEarned = false;
  if (streak > 1 && streak % FREEZE_EVERY_DAYS === 0 && freezes < MAX_FREEZES) {
    freezes++;
    freezeEarned = true;
  }
  return {
    next: { streak, longest: Math.max(daily.longest, streak), lastDate: today, freezes },
    milestone: streak > 1 && STREAK_MILESTONES.includes(streak) ? streak : null,
    freezeUsed,
    freezeEarned,
  };
}

export function recordDailyCompletion(daily: DailyState, today: string): DailyState {
  return completeDaily(daily, today).next;
}
