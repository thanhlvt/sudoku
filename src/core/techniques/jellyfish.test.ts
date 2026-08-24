import { describe, expect, it } from 'vitest';
import { jellyfish } from './jellyfish';
import { clearBit, emptyGrid, fullCandidates } from './testUtils';

describe('jellyfish', () => {
  it('eliminates a digit from the 4 covering columns outside the 4 base rows', () => {
    const grid = emptyGrid();
    const cands = fullCandidates();
    const row0 = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const row2 = [18, 19, 20, 21, 22, 23, 24, 25, 26];
    const row4 = [36, 37, 38, 39, 40, 41, 42, 43, 44];
    const row6 = [54, 55, 56, 57, 58, 59, 60, 61, 62];
    for (const idx of row0) if (idx !== 0 && idx !== 3) clearBit(cands, idx, 9);
    for (const idx of row2) if (idx !== 21 && idx !== 24) clearBit(cands, idx, 9);
    for (const idx of row4) if (idx !== 42 && idx !== 44) clearBit(cands, idx, 9);
    for (const idx of row6) if (idx !== 54 && idx !== 62) clearBit(cands, idx, 9);

    const step = jellyfish.find(grid, cands);
    expect(step).not.toBeNull();
    expect(step!.eliminations.length).toBe(20);
    for (const { idx, digit } of step!.eliminations) {
      expect(digit).toBe(9);
      const col = idx % 9;
      const row = Math.floor(idx / 9);
      expect([0, 3, 6, 8]).toContain(col);
      expect([0, 2, 4, 6]).not.toContain(row);
    }
  });

  it('returns null when no digit forms a 4x4 Jellyfish pattern', () => {
    const step = jellyfish.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
