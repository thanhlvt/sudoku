import type { Level } from '../core/types';
import type { SavedGame } from '../storage/schema';
import { levelFromPuzzleId, puzzleIdOf } from './puzzleBank';

export const MAX_HEARTS = 3;

/** Hearts are a readout of mistakes, not a hard limit: at 0 the player keeps playing. */
export function heartsLeft(mistakes: number): number {
  return Math.max(0, MAX_HEARTS - mistakes);
}

/** 3 stars for a clean solve, one fewer per mistake, never below 1. */
export function starsFor(mistakes: number): number {
  return Math.max(1, 3 - mistakes);
}

export interface LevelSummary {
  completed: number;
  stars: number;
}

export function summarizeByLevel(games: readonly SavedGame[]): Record<Level, LevelSummary> {
  const out: Record<Level, LevelSummary> = {
    beginner: { completed: 0, stars: 0 },
    easy: { completed: 0, stars: 0 },
    medium: { completed: 0, stars: 0 },
    hard: { completed: 0, stars: 0 },
    expert: { completed: 0, stars: 0 },
  };
  for (const game of games) {
    if (game.status !== 'completed') continue;
    const summary = out[levelFromPuzzleId(game.puzzleId)];
    if (!summary) continue;
    summary.completed++;
    summary.stars += starsFor(game.mistakes);
  }
  return out;
}

/**
 * Which puzzle of a level to offer next: the most recently touched game in progress, otherwise the
 * first puzzle never completed, otherwise the first one (everything is done; replay from the start).
 */
export function pickNextIndex(level: Level, count: number, games: ReadonlyMap<string, SavedGame>): number {
  let resume: SavedGame | null = null;
  for (let i = 0; i < count; i++) {
    const g = games.get(puzzleIdOf(level, i));
    if (g?.status === 'in-progress' && (resume === null || g.updatedAt > resume.updatedAt)) resume = g;
  }
  if (resume) return Number(resume.puzzleId.slice(resume.puzzleId.lastIndexOf('-') + 1)) - 1;
  for (let i = 0; i < count; i++) {
    if (games.get(puzzleIdOf(level, i))?.status !== 'completed') return i;
  }
  return 0;
}
