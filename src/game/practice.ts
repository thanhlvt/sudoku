import type { LevelBank, PuzzleRecord } from '../core/types';
import type { SavedGame } from '../storage/schema';

/**
 * How many times `puzzle` needs `technique`. Reads defensively: the bank is fetched JSON and only its grids
 * are validated, so a record without a usable `rating` simply counts as not using anything.
 */
export function usesOf(puzzle: PuzzleRecord, technique: string): number {
  const counts: unknown = (puzzle.rating as { counts?: unknown } | undefined)?.counts;
  if (typeof counts !== 'object' || counts === null) return 0;
  const n = (counts as Record<string, unknown>)[technique];
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0;
}

function hardestOf(puzzle: PuzzleRecord): string | null {
  const hardest: unknown = (puzzle.rating as { hardest?: unknown } | undefined)?.hardest;
  return typeof hardest === 'string' ? hardest : null;
}

function scoreOf(puzzle: PuzzleRecord): number {
  const score: unknown = (puzzle.rating as { score?: unknown } | undefined)?.score;
  return typeof score === 'number' && Number.isFinite(score) ? score : Number.MAX_SAFE_INTEGER;
}

/**
 * Puzzles worth practising `technique` on, best first: the ones where it is the hardest step needed (so it is
 * the heart of the puzzle), then the rest that merely use it; within each group the lighter puzzles first.
 */
export function practicePuzzles(technique: string, banks: readonly LevelBank[]): PuzzleRecord[] {
  const all = banks.flatMap((bank) => bank.puzzles).filter((p) => usesOf(p, technique) > 0);
  return all.sort((a, b) => {
    const aCore = hardestOf(a) === technique ? 0 : 1;
    const bCore = hardestOf(b) === technique ? 0 : 1;
    return aCore - bCore || scoreOf(a) - scoreOf(b) || a.id.localeCompare(b.id);
  });
}

export function indexPuzzles(banks: readonly LevelBank[]): Map<string, PuzzleRecord> {
  return new Map(banks.flatMap((bank) => bank.puzzles).map((p) => [p.id, p]));
}

/**
 * A technique counts as mastered once the player has solved, with no hints, a puzzle that needs it.
 * Derived from saved games, so it needs no storage of its own.
 */
export function masteredTechniques(
  games: readonly SavedGame[],
  puzzles: ReadonlyMap<string, PuzzleRecord>,
  techniques: readonly string[],
): Set<string> {
  const mastered = new Set<string>();
  for (const game of games) {
    if (game.status !== 'completed' || game.hintsUsed > 0) continue;
    const puzzle = puzzles.get(game.puzzleId);
    if (!puzzle) continue;
    for (const technique of techniques) {
      if (usesOf(puzzle, technique) > 0) mastered.add(technique);
    }
  }
  return mastered;
}
