import { describe, expect, it } from 'vitest';
import { pointing } from './pointing';
import { clearBit, emptyGrid, fullCandidates } from './testUtils';

describe('pointing', () => {
  it('locks a digit to one row within a box and eliminates it elsewhere in that row', () => {
    const grid = emptyGrid();
    const cands = fullCandidates();
    const box0 = [0, 1, 2, 9, 10, 11, 18, 19, 20];
    // Keep digit 7 only in cells 0 and 1 (both row 0) within box 0.
    for (const idx of box0) {
      if (idx !== 0 && idx !== 1) clearBit(cands, idx, 7);
    }
    const step = pointing.find(grid, cands);
    expect(step).not.toBeNull();
    expect(step!.eliminations.every((e) => e.digit === 7)).toBe(true);
    const eliminatedCells = step!.eliminations.map((e) => e.idx).sort((a, b) => a - b);
    expect(eliminatedCells).toEqual([3, 4, 5, 6, 7, 8]);
  });

  it('returns null when no digit is confined to a single row/col within any box', () => {
    const step = pointing.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
