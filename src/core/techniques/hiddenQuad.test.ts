import { describe, expect, it } from 'vitest';
import { hiddenQuad } from './hiddenQuad';
import { bit, clearBit, emptyGrid, fullCandidates, setCands } from './testUtils';

describe('hiddenQuad', () => {
  it('detects a quad from overlapping pairs, each cell also carrying an extra candidate', () => {
    const grid = emptyGrid();
    const cands = fullCandidates();
    const row0 = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    for (const idx of row0) {
      if (idx > 3) {
        clearBit(cands, idx, 6);
        clearBit(cands, idx, 7);
        clearBit(cands, idx, 8);
        clearBit(cands, idx, 9);
      }
    }
    setCands(cands, 0, bit(6, 7, 1));
    setCands(cands, 1, bit(7, 8, 2));
    setCands(cands, 2, bit(8, 9, 3));
    setCands(cands, 3, bit(9, 6, 4));

    const step = hiddenQuad.find(grid, cands);
    expect(step).not.toBeNull();
    expect(step!.cells.sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
    expect(step!.eliminations).toEqual(
      expect.arrayContaining([
        { idx: 0, digit: 1 },
        { idx: 1, digit: 2 },
        { idx: 2, digit: 3 },
        { idx: 3, digit: 4 },
      ]),
    );
  });

  it('returns null when no unit has a hidden quad', () => {
    const step = hiddenQuad.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
