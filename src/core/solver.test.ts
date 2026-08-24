import { describe, expect, it } from 'vitest';
import { parseGrid, gridToString } from './board';
import { countSolutions, solveFirst } from './solver';

const VALID_PUZZLE = [
  '53..7....',
  '6..195...',
  '.98....6.',
  '8...6...3',
  '4..8.3..1',
  '7...2...6',
  '.6....28.',
  '...419..5',
  '....8..79',
].join('');
const VALID_SOLUTION = [
  '534678912',
  '672195348',
  '198342567',
  '859761423',
  '426853791',
  '713924856',
  '961537284',
  '287419635',
  '345286179',
].join('');

describe('countSolutions', () => {
  it('returns 1 for a proper unique puzzle', () => {
    expect(countSolutions(parseGrid(VALID_PUZZLE), 2)).toBe(1);
  });

  it('returns 0 for a contradictory board', () => {
    const grid = parseGrid(VALID_PUZZLE);
    grid[1] = grid[0]!; // duplicate digit within row 0 -> contradiction
    expect(countSolutions(grid, 2)).toBe(0);
  });

  it('returns more than 1 when too many clues are removed', () => {
    const grid = parseGrid(VALID_PUZZLE);
    // Strip down to very few givens -> many completions possible.
    let kept = 0;
    for (let i = 0; i < 81; i++) {
      if (grid[i] !== 0) {
        if (kept >= 12) grid[i] = 0;
        else kept++;
      }
    }
    expect(countSolutions(grid, 2)).toBeGreaterThan(1);
  });

  it('stops early at the given limit', () => {
    const empty = parseGrid('.'.repeat(81));
    expect(countSolutions(empty, 2)).toBe(2);
  });
});

describe('solveFirst', () => {
  it('solves the puzzle to the known unique solution', () => {
    const solved = solveFirst(parseGrid(VALID_PUZZLE));
    expect(solved).not.toBeNull();
    expect(gridToString(solved!, '.')).toBe(VALID_SOLUTION);
  });

  it('returns null for a contradictory board', () => {
    const grid = parseGrid(VALID_PUZZLE);
    grid[1] = grid[0]!;
    expect(solveFirst(grid)).toBeNull();
  });

  it('does not mutate the input grid', () => {
    const grid = parseGrid(VALID_PUZZLE);
    const before = gridToString(grid, '.');
    solveFirst(grid);
    expect(gridToString(grid, '.')).toBe(before);
  });
});
