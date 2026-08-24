import { describe, expect, it } from 'vitest';
import { xWing } from './xWing';
import { clearBit, emptyGrid, fullCandidates } from './testUtils';

describe('xWing', () => {
  it('eliminates a digit from the covering columns outside the two base rows', () => {
    const grid = emptyGrid();
    const cands = fullCandidates();
    const row0 = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const row3 = [27, 28, 29, 30, 31, 32, 33, 34, 35];
    for (const idx of row0) if (idx !== 1 && idx !== 6) clearBit(cands, idx, 5);
    for (const idx of row3) if (idx !== 28 && idx !== 33) clearBit(cands, idx, 5);

    const step = xWing.find(grid, cands);
    expect(step).not.toBeNull();
    expect(step!.eliminations.length).toBe(14);
    for (const { idx, digit } of step!.eliminations) {
      expect(digit).toBe(5);
      const col = idx % 9;
      const row = Math.floor(idx / 9);
      expect([1, 6]).toContain(col);
      expect([0, 3]).not.toContain(row);
    }
  });

  it('returns null when no digit forms a 2x2 X-Wing pattern', () => {
    const step = xWing.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
