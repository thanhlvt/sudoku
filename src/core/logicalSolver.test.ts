import { describe, expect, it } from 'vitest';
import { gridToString, parseGrid } from './board';
import { solveLogically } from './logicalSolver';

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

describe('solveLogically', () => {
  it('solves an already-complete grid with zero steps', () => {
    const result = solveLogically(parseGrid(VALID_SOLUTION));
    expect(result.solved).toBe(true);
    expect(result.steps).toEqual([]);
  });

  it('solves a real puzzle down to its unique solution using pure logic', () => {
    const result = solveLogically(parseGrid(VALID_PUZZLE));
    expect(result.solved).toBe(true);
    expect(gridToString(result.grid, '.')).toBe(VALID_SOLUTION);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('does not mutate the input grid', () => {
    const grid = parseGrid(VALID_PUZZLE);
    const before = gridToString(grid, '.');
    solveLogically(grid);
    expect(gridToString(grid, '.')).toBe(before);
  });

  it('returns solved:false without hanging when no technique can proceed', () => {
    const empty = parseGrid('.'.repeat(81));
    const result = solveLogically(empty);
    expect(result.solved).toBe(false);
    expect(result.stuckAt).toBeDefined();
  });

  it('respects the allowed-technique whitelist', () => {
    const result = solveLogically(parseGrid(VALID_PUZZLE), { allowed: ['naked-single'] });
    expect(result.steps.every((s) => s.technique === 'naked-single')).toBe(true);
  });
});
