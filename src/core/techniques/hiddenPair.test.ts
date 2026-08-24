import { describe, expect, it } from 'vitest';
import { hiddenPair } from './hiddenPair';
import { clearBit, emptyGrid, fullCandidates } from './testUtils';

describe('hiddenPair', () => {
  it('restricts the pair cells to just the two digits', () => {
    const grid = emptyGrid();
    const cands = fullCandidates();
    const row0 = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    for (const idx of row0) {
      if (idx !== 0 && idx !== 1) {
        clearBit(cands, idx, 8);
        clearBit(cands, idx, 9);
      }
    }
    const step = hiddenPair.find(grid, cands);
    expect(step).not.toBeNull();
    expect(step!.cells.sort((a, b) => a - b)).toEqual([0, 1]);
    expect(step!.eliminations.every((e) => e.idx === 0 || e.idx === 1)).toBe(true);
    expect(step!.eliminations.every((e) => e.digit !== 8 && e.digit !== 9)).toBe(true);
  });

  it('returns null when no unit has a hidden pair', () => {
    const step = hiddenPair.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
