import { describe, expect, it } from 'vitest';
import { claiming } from './claiming';
import { clearBit, emptyGrid, fullCandidates } from './testUtils';

describe('claiming', () => {
  it('locks a digit to one box within a row and eliminates it elsewhere in that box', () => {
    const grid = emptyGrid();
    const cands = fullCandidates();
    const row0 = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    // Keep digit 7 only in cells 0 and 1 (both in box 0) within row 0.
    for (const idx of row0) {
      if (idx !== 0 && idx !== 1) clearBit(cands, idx, 7);
    }
    const step = claiming.find(grid, cands);
    expect(step).not.toBeNull();
    expect(step!.eliminations.every((e) => e.digit === 7)).toBe(true);
    const eliminatedCells = step!.eliminations.map((e) => e.idx).sort((a, b) => a - b);
    expect(eliminatedCells).toEqual([9, 10, 11, 18, 19, 20]);
  });

  it('returns null when no digit in a line is confined to a single box', () => {
    const step = claiming.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
