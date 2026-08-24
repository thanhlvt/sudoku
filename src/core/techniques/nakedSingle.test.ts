import { describe, expect, it } from 'vitest';
import { nakedSingle } from './nakedSingle';
import { bit, emptyGrid, fullCandidates, setCands } from './testUtils';

describe('nakedSingle', () => {
  it('finds a cell with exactly one remaining candidate', () => {
    const grid = emptyGrid();
    const cands = fullCandidates();
    setCands(cands, 40, bit(7));
    const step = nakedSingle.find(grid, cands);
    expect(step).not.toBeNull();
    expect(step!.placements).toEqual([{ idx: 40, digit: 7 }]);
  });

  it('returns null when every empty cell has more than one candidate', () => {
    const step = nakedSingle.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
