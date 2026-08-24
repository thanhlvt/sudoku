import { describe, expect, it } from 'vitest';
import { swordfish } from './swordfish';
import { clearBit, emptyGrid, fullCandidates } from './testUtils';

describe('swordfish', () => {
  it('eliminates a digit from the 3 covering columns outside the 3 base rows', () => {
    const grid = emptyGrid();
    const cands = fullCandidates();
    const row0 = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const row3 = [27, 28, 29, 30, 31, 32, 33, 34, 35];
    const row6 = [54, 55, 56, 57, 58, 59, 60, 61, 62];
    for (const idx of row0) if (idx !== 1 && idx !== 4) clearBit(cands, idx, 6);
    for (const idx of row3) if (idx !== 31 && idx !== 34) clearBit(cands, idx, 6);
    for (const idx of row6) if (idx !== 55 && idx !== 61) clearBit(cands, idx, 6);

    const step = swordfish.find(grid, cands);
    expect(step).not.toBeNull();
    expect(step!.eliminations.length).toBe(18);
    for (const { idx, digit } of step!.eliminations) {
      expect(digit).toBe(6);
      const col = idx % 9;
      const row = Math.floor(idx / 9);
      expect([1, 4, 7]).toContain(col);
      expect([0, 3, 6]).not.toContain(row);
    }
  });

  it('returns null when no digit forms a 3x3 Swordfish pattern', () => {
    const step = swordfish.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
