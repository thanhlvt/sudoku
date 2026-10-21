import type { Level } from '../core/types';
import type { MessageKey } from '../i18n';
import type { GameMode, SavedGame } from '../storage/schema';
import { MODE_XP_MULTIPLIER } from './modes';
import { starsFor } from './progress';
import { levelFromPuzzleId } from './puzzleBank';
import { WEEKLY_BONUS_XP } from './weekly';

/** Experience for a clean solve; fewer stars earn a fraction of it. */
const BASE_XP: Record<Level, number> = { beginner: 10, easy: 20, medium: 40, hard: 80, expert: 150 };
const STAR_FACTOR = [0, 0.6, 0.8, 1] as const;

/** `mode` is the challenge the puzzle was solved under, if any: those solves pay extra. */
export function xpForSolve(level: Level, mistakes: number, mode?: GameMode): number {
  const bonus = mode === undefined ? 1 : MODE_XP_MULTIPLIER;
  return Math.round(BASE_XP[level] * STAR_FACTOR[starsFor(mistakes)]! * bonus);
}

/** Experience for finished weekly challenges (each pays a flat bonus on top of its five puzzles). */
export function weeklyXp(weeksDone: number): number {
  return Math.max(0, weeksDone) * WEEKLY_BONUS_XP;
}

/** Total experience: one share per distinct solved puzzle (a save exists once per puzzle), so replays never inflate it. */
export function totalXp(games: readonly SavedGame[], weeksDone = 0): number {
  let xp = weeklyXp(weeksDone);
  for (const game of games) {
    if (game.status !== 'completed') continue;
    const level = levelFromPuzzleId(game.puzzleId);
    if (!Object.hasOwn(BASE_XP, level)) continue;
    xp += xpForSolve(level, game.mistakes, game.mode);
  }
  return xp;
}

/** Total experience needed to *reach* `level` (level 1 = 0): 100, 300, 600, 1000, ... */
export function xpToReach(level: number): number {
  return 50 * level * (level - 1);
}

export interface PlayerLevel {
  level: number;
  /** Catalog key of the title earned at this level. */
  titleKey: MessageKey;
  /** Experience earned inside this level, and the span of the level, for a progress bar. */
  into: number;
  span: number;
}

const TITLES: readonly { from: number; titleKey: MessageKey }[] = [
  { from: 1, titleKey: 'player.title.1' },
  { from: 5, titleKey: 'player.title.5' },
  { from: 10, titleKey: 'player.title.10' },
  { from: 15, titleKey: 'player.title.15' },
  { from: 20, titleKey: 'player.title.20' },
];

export function playerLevel(xp: number): PlayerLevel {
  let level = 1;
  while (xpToReach(level + 1) <= xp) level++;
  const titleKey = [...TITLES].reverse().find((t) => level >= t.from)!.titleKey;
  return { level, titleKey, into: xp - xpToReach(level), span: xpToReach(level + 1) - xpToReach(level) };
}
