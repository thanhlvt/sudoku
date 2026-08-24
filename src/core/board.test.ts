import { describe, expect, it } from 'vitest';
import {
  PEERS,
  bitToDigit,
  candidateDigits,
  cloneGrid,
  computeCandidates,
  digitToBit,
  findConflicts,
  gridToString,
  isComplete,
  isValidPlacement,
  lowestBit,
  parseGrid,
  popcount,
} from './board';

// Classic Wikipedia Sudoku example — verified puzzle/solution pair.
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

describe('parseGrid / gridToString round-trip', () => {
  it('round-trips a puzzle string with dots for empty cells', () => {
    const grid = parseGrid(VALID_PUZZLE);
    expect(gridToString(grid, '.')).toBe(VALID_PUZZLE);
  });

  it('accepts 0 as empty and whitespace is ignored', () => {
    const withZerosAndSpaces = VALID_PUZZLE.replace(/\./g, '0').replace(/(.{9})/g, '$1\n');
    const grid = parseGrid(withZerosAndSpaces);
    expect(gridToString(grid, '.')).toBe(VALID_PUZZLE);
  });

  it('throws on invalid character', () => {
    expect(() => parseGrid('x'.repeat(81))).toThrow();
  });

  it('throws when length is not 81', () => {
    expect(() => parseGrid('123')).toThrow();
  });
});

describe('PEERS', () => {
  it('PEERS[0] has exactly 20 elements, none equal to 0', () => {
    const peers = PEERS[0]!;
    expect(peers.length).toBe(20);
    expect(Array.from(peers)).not.toContain(0);
  });

  it('every cell has exactly 20 unique peers', () => {
    for (let i = 0; i < 81; i++) {
      const peers = PEERS[i]!;
      expect(peers.length).toBe(20);
      expect(new Set(peers).size).toBe(20);
      expect(Array.from(peers)).not.toContain(i);
    }
  });
});

describe('computeCandidates', () => {
  it('returns 0 for filled cells', () => {
    const grid = parseGrid(VALID_PUZZLE);
    const cands = computeCandidates(grid);
    for (let i = 0; i < 81; i++) {
      if (grid[i] !== 0) expect(cands[i]).toBe(0);
    }
  });

  it('excludes digits already used by peers', () => {
    const grid = parseGrid(VALID_PUZZLE);
    const cands = computeCandidates(grid);
    for (let i = 0; i < 81; i++) {
      if (grid[i] !== 0) continue;
      for (const d of candidateDigits(cands[i]!)) {
        expect(isValidPlacement(grid, i, d)).toBe(true);
      }
    }
  });
});

describe('isValidPlacement / isComplete / findConflicts', () => {
  it('rejects a digit already present on a peer', () => {
    const grid = parseGrid(VALID_PUZZLE);
    expect(isValidPlacement(grid, 1, 5)).toBe(false); // row 0 already has 5
  });

  it('isComplete is false for a puzzle, true for a full solution', () => {
    expect(isComplete(parseGrid(VALID_PUZZLE))).toBe(false);
    expect(isComplete(parseGrid(VALID_SOLUTION))).toBe(true);
  });

  it('findConflicts detects a duplicate in a row', () => {
    const grid = cloneGrid(parseGrid(VALID_SOLUTION));
    grid[1] = grid[0]!; // duplicate within row 0
    const conflicts = findConflicts(grid);
    expect(conflicts.has(0)).toBe(true);
    expect(conflicts.has(1)).toBe(true);
  });

  it('findConflicts is empty for a valid solution', () => {
    expect(findConflicts(parseGrid(VALID_SOLUTION)).size).toBe(0);
  });
});

describe('bit helpers', () => {
  it('digitToBit / bitToDigit round-trip for all digits', () => {
    for (let d = 1; d <= 9; d++) {
      expect(bitToDigit(digitToBit(d))).toBe(d);
    }
  });

  it('popcount counts set bits', () => {
    expect(popcount(0)).toBe(0);
    expect(popcount(0b111111111)).toBe(9);
    expect(popcount(0b10101)).toBe(3);
  });

  it('lowestBit returns the lowest set bit', () => {
    expect(lowestBit(0b10100)).toBe(0b100);
  });

  it('candidateDigits lists digits in ascending order', () => {
    expect(candidateDigits(digitToBit(3) | digitToBit(9) | digitToBit(1))).toEqual([1, 3, 9]);
  });
});
