import { LEVELS } from '../core/levels';
import type { Level } from '../core/types';
import type { DailyState, SavedGame, Stats } from '../storage/schema';
import { summarizeByLevel } from './progress';

/** Everything an achievement can be computed from. All of it already exists; nothing is stored per achievement. */
export interface AchievementContext {
  games: readonly SavedGame[];
  stats: Stats;
  daily: DailyState;
}

/** Name of the symbol the UI draws; kept as a string so this module stays free of React. */
export type AchievementIcon = 'trophy' | 'flame' | 'zap' | 'star' | 'target' | 'crown' | 'medal' | 'calendar';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
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

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'solved-1', title: 'Bước đầu tiên', description: 'Giải xong màn đầu tiên', icon: 'medal', target: 1, progress: solved },
  { id: 'solved-10', title: 'Khởi động', description: 'Giải 10 màn', icon: 'medal', target: 10, progress: solved },
  { id: 'solved-50', title: 'Nghiện Sudoku', description: 'Giải 50 màn', icon: 'trophy', target: 50, progress: solved },
  { id: 'solved-100', title: 'Trăm trận trăm thắng', description: 'Giải 100 màn', icon: 'crown', target: 100, progress: solved },

  { id: 'flawless-1', title: 'Không tì vết', description: 'Giải một màn không sai và không dùng gợi ý', icon: 'star', target: 1, progress: flawless },
  { id: 'flawless-10', title: 'Chính xác', description: 'Giải 10 màn không sai, không gợi ý', icon: 'star', target: 10, progress: flawless },
  { id: 'flawless-30', title: 'Bộ óc máy tính', description: 'Giải 30 màn không sai, không gợi ý', icon: 'crown', target: 30, progress: flawless },

  { id: 'daily-1', title: 'Thử thách đầu tiên', description: 'Hoàn thành một thử thách hằng ngày', icon: 'calendar', target: 1, progress: longestStreak },
  { id: 'streak-3', title: 'Ba ngày liền', description: 'Chuỗi thử thách 3 ngày', icon: 'flame', target: 3, progress: longestStreak },
  { id: 'streak-7', title: 'Một tuần lửa', description: 'Chuỗi thử thách 7 ngày', icon: 'flame', target: 7, progress: longestStreak },
  { id: 'streak-30', title: 'Thói quen thép', description: 'Chuỗi thử thách 30 ngày', icon: 'flame', target: 30, progress: longestStreak },

  { id: 'hard-1', title: 'Thử sức với khó', description: 'Giải một màn cấp Khó', icon: 'target', target: 1, progress: solvedAt('hard') },
  { id: 'expert-1', title: 'Chuyên gia', description: 'Giải một màn cấp Chuyên gia', icon: 'target', target: 1, progress: solvedAt('expert') },
  { id: 'expert-10', title: 'Bậc thầy suy luận', description: 'Giải 10 màn cấp Chuyên gia', icon: 'crown', target: 10, progress: solvedAt('expert') },
  { id: 'all-levels', title: 'Đủ năm cấp', description: 'Giải ít nhất một màn ở mỗi cấp độ', icon: 'trophy', target: 5, progress: levelsTried },

  { id: 'speed-easy', title: 'Nhanh như chớp', description: 'Giải một màn Dễ trong 4 phút', icon: 'zap', target: 1, progress: fasterThan('easy', 4 * MINUTE_MS) },
  { id: 'speed-medium', title: 'Tay nhanh', description: 'Giải một màn Trung bình trong 6 phút', icon: 'zap', target: 1, progress: fasterThan('medium', 6 * MINUTE_MS) },
  { id: 'speed-hard', title: 'Tốc độ ánh sáng', description: 'Giải một màn Khó trong 10 phút', icon: 'zap', target: 1, progress: fasterThan('hard', 10 * MINUTE_MS) },
  { id: 'speed-expert', title: 'Siêu tốc', description: 'Giải một màn Chuyên gia trong 20 phút', icon: 'zap', target: 1, progress: fasterThan('expert', 20 * MINUTE_MS) },
];

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
