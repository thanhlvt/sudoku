import type { Level } from '../core/types';
import type { SavedGame } from '../storage/schema';
import { starsFor } from './progress';
import { levelFromPuzzleId } from './puzzleBank';

/** Experience for a clean solve; fewer stars earn a fraction of it. */
const BASE_XP: Record<Level, number> = { beginner: 10, easy: 20, medium: 40, hard: 80, expert: 150 };
const STAR_FACTOR = [0, 0.6, 0.8, 1] as const;

export function xpForSolve(level: Level, mistakes: number): number {
  return Math.round(BASE_XP[level] * STAR_FACTOR[starsFor(mistakes)]!);
}

/** Total experience: one share per distinct solved puzzle (a save exists once per puzzle), so replays never inflate it. */
export function totalXp(games: readonly SavedGame[]): number {
  let xp = 0;
  for (const game of games) {
    if (game.status !== 'completed') continue;
    const level = levelFromPuzzleId(game.puzzleId);
    if (!Object.hasOwn(BASE_XP, level)) continue;
    xp += xpForSolve(level, game.mistakes);
  }
  return xp;
}

/** Total experience needed to *reach* `level` (level 1 = 0): 100, 300, 600, 1000, ... */
export function xpToReach(level: number): number {
  return 50 * level * (level - 1);
}

export interface PlayerLevel {
  level: number;
  title: string;
  /** Experience earned inside this level, and the span of the level, for a progress bar. */
  into: number;
  span: number;
}

const TITLES: readonly { from: number; title: string }[] = [
  { from: 1, title: 'Tân binh' },
  { from: 5, title: 'Người luyện trí' },
  { from: 10, title: 'Cao thủ' },
  { from: 15, title: 'Đại sư' },
  { from: 20, title: 'Huyền thoại' },
];

export function playerLevel(xp: number): PlayerLevel {
  let level = 1;
  while (xpToReach(level + 1) <= xp) level++;
  const title = [...TITLES].reverse().find((t) => level >= t.from)!.title;
  return { level, title, into: xp - xpToReach(level), span: xpToReach(level + 1) - xpToReach(level) };
}
