import { LEVELS } from '../core/levels';
import type { Level } from '../core/types';
import type { MessageKey, Translate } from '../i18n';
import type { DailyState, GameMode, SavedGame, Stats } from '../storage/schema';
import { summarizeByLevel } from './progress';

/** Everything an achievement can be computed from. All of it already exists; nothing is stored per achievement. */
export interface AchievementContext {
  games: readonly SavedGame[];
  stats: Stats;
  daily: DailyState;
  /** How many weekly challenges have been finished. */
  weeklyDone: number;
}

/** Name of the symbol the UI draws; kept as a string so this module stays free of React. */
export type AchievementIcon = 'trophy' | 'flame' | 'zap' | 'star' | 'target' | 'crown' | 'medal' | 'calendar';

export interface AchievementDef {
  /** Its name and description are in the catalogs, as `ach.<id>.title` and `ach.<id>.desc`. */
  id: string;
  icon: AchievementIcon;
  /** `progress(ctx) >= target` unlocks it. */
  target: number;
  progress: (ctx: AchievementContext) => number;
}

const MINUTE_MS = 60_000;

function completed(ctx: AchievementContext): SavedGame[] {
  return ctx.games.filter((g) => g.status === 'completed');
}

const solved = (ctx: AchievementContext): number => completed(ctx).length;
const flawless = (ctx: AchievementContext): number =>
  completed(ctx).filter((g) => g.mistakes === 0 && g.hintsUsed === 0).length;
const solvedAt =
  (level: Level) =>
  (ctx: AchievementContext): number =>
    summarizeByLevel(ctx.games)[level].completed;
const levelsTried = (ctx: AchievementContext): number => {
  const summary = summarizeByLevel(ctx.games);
  return LEVELS.filter((level) => summary[level].completed > 0).length;
};
/** 1 when the level's best time is at or under the limit, otherwise 0. */
const fasterThan =
  (level: Level, limitMs: number) =>
  (ctx: AchievementContext): number => {
    const best = ctx.stats[level].bestMs;
    return best !== null && best <= limitMs ? 1 : 0;
  };
const longestStreak = (ctx: AchievementContext): number => ctx.daily.longest;
const solvedUnder =
  (mode: GameMode) =>
  (ctx: AchievementContext): number =>
    completed(ctx).filter((g) => g.mode === mode).length;
const weeks = (ctx: AchievementContext): number => ctx.weeklyDone;

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'solved-1', icon: 'medal', target: 1, progress: solved },
  { id: 'solved-10', icon: 'medal', target: 10, progress: solved },
  { id: 'solved-50', icon: 'trophy', target: 50, progress: solved },
  { id: 'solved-100', icon: 'crown', target: 100, progress: solved },

  { id: 'flawless-1', icon: 'star', target: 1, progress: flawless },
  { id: 'flawless-10', icon: 'star', target: 10, progress: flawless },
  { id: 'flawless-30', icon: 'crown', target: 30, progress: flawless },

  { id: 'daily-1', icon: 'calendar', target: 1, progress: longestStreak },
  { id: 'streak-3', icon: 'flame', target: 3, progress: longestStreak },
  { id: 'streak-7', icon: 'flame', target: 7, progress: longestStreak },
  { id: 'streak-30', icon: 'flame', target: 30, progress: longestStreak },

  { id: 'hard-1', icon: 'target', target: 1, progress: solvedAt('hard') },
  { id: 'expert-1', icon: 'target', target: 1, progress: solvedAt('expert') },
  { id: 'expert-10', icon: 'crown', target: 10, progress: solvedAt('expert') },
  { id: 'all-levels', icon: 'trophy', target: 5, progress: levelsTried },

  { id: 'time-1', icon: 'zap', target: 1, progress: solvedUnder('time') },
  { id: 'perfect-1', icon: 'target', target: 1, progress: solvedUnder('perfect') },
  { id: 'perfect-10', icon: 'crown', target: 10, progress: solvedUnder('perfect') },
  { id: 'weekly-1', icon: 'calendar', target: 1, progress: weeks },
  { id: 'weekly-4', icon: 'trophy', target: 4, progress: weeks },

  { id: 'speed-easy', icon: 'zap', target: 1, progress: fasterThan('easy', 4 * MINUTE_MS) },
  { id: 'speed-medium', icon: 'zap', target: 1, progress: fasterThan('medium', 6 * MINUTE_MS) },
  { id: 'speed-hard', icon: 'zap', target: 1, progress: fasterThan('hard', 10 * MINUTE_MS) },
  { id: 'speed-expert', icon: 'zap', target: 1, progress: fasterThan('expert', 20 * MINUTE_MS) },
];

/** Player-facing name and description of an achievement, in the language `t` translates to. */
export function achievementText(id: string, t: Translate): { title: string; description: string } {
  return { title: t(`ach.${id}.title` as MessageKey), description: t(`ach.${id}.desc` as MessageKey) };
}

export interface AchievementStatus {
  def: AchievementDef;
  /** Progress clamped to the target, for a progress bar. */
  value: number;
  unlocked: boolean;
}

export function evaluateAchievements(ctx: AchievementContext): AchievementStatus[] {
  return ACHIEVEMENTS.map((def) => {
    const value = Math.min(def.target, Math.max(0, def.progress(ctx)));
    return { def, value, unlocked: value >= def.target };
  });
}

/** When each achievement was first unlocked (ms since epoch), keyed by id. */
export type UnlockedMap = Readonly<Record<string, number>>;

export interface UnlockResult {
  /** The stored map plus anything newly earned. Same object when nothing changed. */
  unlocked: UnlockedMap;
  added: AchievementDef[];
}

/**
 * Compares what the player has now earned against what was already recorded. Once recorded an achievement
 * stays unlocked even if the data behind it later shrinks (a replayed puzzle resets its save).
 */
export function unlockNew(stored: UnlockedMap, ctx: AchievementContext, now: number): UnlockResult {
  const added: AchievementDef[] = [];
  const next: Record<string, number> = { ...stored };
  for (const status of evaluateAchievements(ctx)) {
    if (status.unlocked && !Object.hasOwn(stored, status.def.id)) {
      next[status.def.id] = now;
      added.push(status.def);
    }
  }
  return added.length === 0 ? { unlocked: stored, added } : { unlocked: next, added };
}
