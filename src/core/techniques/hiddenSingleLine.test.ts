import { describe, expect, it } from 'vitest';
import { hiddenSingleLine } from './hiddenSingleLine';
import { clearBit, emptyGrid, fullCandidates } from './testUtils';

describe('hiddenSingleLine', () => {
  it('finds a digit that only fits one cell within a row', () => {
    const grid = emptyGrid();
    const cands = fullCandidates();
    const row0 = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    for (const idx of row0) {
      if (idx !== 4) clearBit(cands, idx, 6);
    }
    const step = hiddenSingleLine.find(grid, cands);
    expect(step).not.toBeNull();
    expect(step!.placements).toEqual([{ idx: 4, digit: 6 }]);
  });

  it('returns null when every digit fits multiple cells in every row/col', () => {
    const step = hiddenSingleLine.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
