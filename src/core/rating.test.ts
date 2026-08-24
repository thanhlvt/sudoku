import { describe, expect, it } from 'vitest';
import { parseGrid } from './board';
import { rate } from './rating';

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

describe('rate', () => {
  it('is idempotent', () => {
    const grid = parseGrid(VALID_PUZZLE);
    expect(rate(grid)).toEqual(rate(grid));
  });

  it('assigns a level to a puzzle solvable by pure logic', () => {
    const result = rate(parseGrid(VALID_PUZZLE));
    expect(result.solved).toBe(true);
    expect(result.level).not.toBeNull();
    expect(result.hardest).not.toBeNull();
  });

  it('returns solved:false and level:null for an empty grid', () => {
    const result = rate(parseGrid('.'.repeat(81)));
    expect(result.solved).toBe(false);
    expect(result.level).toBeNull();
  });
});
