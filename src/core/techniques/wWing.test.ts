import { describe, expect, it } from 'vitest';
import { wWing } from './wWing';
import { bit, clearBit, emptyGrid, fullCandidates, setCands } from './testUtils';

describe('wWing', () => {
  it('eliminates x from cells seen by both bivalue cells, linked via a strong link on y', () => {
    const grid = emptyGrid();
    const cands = fullCandidates();
    // A and B share candidates {4,5}, do not see each other directly.
    setCands(cands, 0, bit(4, 5)); // A: row 0, col 0
    setCands(cands, 12, bit(4, 5)); // B: row 1, col 3

    // Strong link on digit 5 in row 2: only col 0 (sees A) and col 3 (sees B) hold it.
    const row2 = [18, 19, 20, 21, 22, 23, 24, 25, 26];
    for (const idx of row2) if (idx !== 18 && idx !== 21) clearBit(cands, idx, 5);

    const step = wWing.find(grid, cands);
    expect(step).not.toBeNull();
    expect(step!.eliminations.length).toBeGreaterThan(0);
    for (const { idx, digit } of step!.eliminations) {
      expect([0, 12, 18, 21]).not.toContain(idx);
      expect(digit).toBe(4);
    }
  });

  it('returns null when no W-Wing pattern exists', () => {
    const step = wWing.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
