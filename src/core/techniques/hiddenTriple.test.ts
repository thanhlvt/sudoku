import { describe, expect, it } from 'vitest';
import { hiddenTriple } from './hiddenTriple';
import { bit, clearBit, emptyGrid, fullCandidates, setCands } from './testUtils';

describe('hiddenTriple', () => {
  it('detects a triple even when each cell also carries an extra candidate', () => {
    const grid = emptyGrid();
    const cands = fullCandidates();
    const row0 = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    for (const idx of row0) {
      if (idx > 2) {
        clearBit(cands, idx, 7);
        clearBit(cands, idx, 8);
        clearBit(cands, idx, 9);
      }
    }
    setCands(cands, 0, bit(7, 8, 1));
    setCands(cands, 1, bit(8, 9, 2));
    setCands(cands, 2, bit(7, 9, 3));

    const step = hiddenTriple.find(grid, cands);
    expect(step).not.toBeNull();
    expect(step!.cells.sort((a, b) => a - b)).toEqual([0, 1, 2]);
    expect(step!.eliminations).toEqual(
      expect.arrayContaining([
        { idx: 0, digit: 1 },
        { idx: 1, digit: 2 },
        { idx: 2, digit: 3 },
      ]),
    );
  });

  it('returns null when no unit has a hidden triple', () => {
    const step = hiddenTriple.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
