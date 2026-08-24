import { describe, expect, it } from 'vitest';
import { hiddenSingleBox } from './hiddenSingleBox';
import { clearBit, emptyGrid, fullCandidates } from './testUtils';

describe('hiddenSingleBox', () => {
  it('finds a digit that only fits one cell within a box', () => {
    const grid = emptyGrid();
    const cands = fullCandidates();
    const box0 = [0, 1, 2, 9, 10, 11, 18, 19, 20];
    for (const idx of box0) {
      if (idx !== 10) clearBit(cands, idx, 5);
    }
    const step = hiddenSingleBox.find(grid, cands);
    expect(step).not.toBeNull();
    expect(step!.placements).toEqual([{ idx: 10, digit: 5 }]);
  });

  it('returns null when every digit fits multiple cells in every box', () => {
    const step = hiddenSingleBox.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
