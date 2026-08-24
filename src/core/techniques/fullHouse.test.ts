import { describe, expect, it } from 'vitest';
import { fullHouse } from './fullHouse';
import { emptyGrid, fullCandidates } from './testUtils';

describe('fullHouse', () => {
  it('fills the last empty cell of a unit with the missing digit', () => {
    const grid = emptyGrid();
    grid.set([1, 2, 3, 0, 5, 6, 7, 8, 9], 0); // row 0, cell 3 empty -> missing digit 4
    const step = fullHouse.find(grid, fullCandidates());
    expect(step).not.toBeNull();
    expect(step!.placements).toEqual([{ idx: 3, digit: 4 }]);
    expect(step!.eliminations).toEqual([]);
  });

  it('returns null when no unit has exactly one empty cell', () => {
    const step = fullHouse.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
