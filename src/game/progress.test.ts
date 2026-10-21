import { describe, expect, it } from 'vitest';
import type { SavedGame } from '../storage/schema';
import { heartsLeft, pickNextIndex, starsFor, summarizeByLevel } from './progress';

function game(puzzleId: string, status: SavedGame['status'], mistakes = 0, updatedAt = 1): SavedGame {
  return { puzzleId, board: '', notes: '', elapsedMs: 0, mistakes, hintsUsed: 0, status, updatedAt };
}

describe('hearts and stars', () => {
  it('loses one heart per mistake and floors at zero', () => {
    expect([0, 1, 2, 3, 7].map(heartsLeft)).toEqual([3, 2, 1, 0, 0]);
  });

  it('awards 3 stars for a clean solve, one fewer per mistake, min 1', () => {
    expect([0, 1, 2, 3, 9].map(starsFor)).toEqual([3, 2, 1, 1, 1]);
  });
});

describe('summarizeByLevel', () => {
  it('counts only completed games and sums their stars per level', () => {
    const summary = summarizeByLevel([
      game('beginner-001', 'completed', 0),
      game('beginner-002', 'completed', 1),
      game('beginner-003', 'in-progress'),
      game('hard-010', 'completed', 4),
    ]);
    expect(summary.beginner).toEqual({ completed: 2, stars: 5 });
    expect(summary.hard).toEqual({ completed: 1, stars: 1 });
    expect(summary.easy).toEqual({ completed: 0, stars: 0 });
  });
});

describe('pickNextIndex', () => {
  const byId = (...games: SavedGame[]): Map<string, SavedGame> => new Map(games.map((g) => [g.puzzleId, g]));

  it('starts at the first puzzle for a fresh level', () => {
    expect(pickNextIndex('easy', 20, byId())).toBe(0);
  });

  it('skips completed puzzles to the first unfinished one', () => {
    expect(pickNextIndex('easy', 20, byId(game('easy-001', 'completed'), game('easy-002', 'completed')))).toBe(2);
  });

  it('prefers the most recently updated game in progress', () => {
    const games = byId(
      game('easy-001', 'completed'),
      game('easy-005', 'in-progress', 0, 10),
      game('easy-008', 'in-progress', 0, 99),
    );
    expect(pickNextIndex('easy', 20, games)).toBe(7);
  });

  it('wraps to the first puzzle when the whole level is completed', () => {
    const games = byId(game('easy-001', 'completed'), game('easy-002', 'completed'));
    expect(pickNextIndex('easy', 2, games)).toBe(0);
  });
});
