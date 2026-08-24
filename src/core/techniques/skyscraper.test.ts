import { describe, expect, it } from 'vitest';
import { skyscraper } from './skyscraper';
import { clearBit, emptyGrid, fullCandidates } from './testUtils';

describe('skyscraper', () => {
  it('eliminates a digit from a cell that sees both free ends', () => {
    const grid = emptyGrid();
    const cands = fullCandidates();
    const row2 = [18, 19, 20, 21, 22, 23, 24, 25, 26];
    const row8 = [72, 73, 74, 75, 76, 77, 78, 79, 80];
    // Row 2: digit 5 only at col 3 (anchor, idx 21) and col 7 (free end, idx 25).
    for (const idx of row2) if (idx !== 21 && idx !== 25) clearBit(cands, idx, 5);
    // Row 8: digit 5 only at col 3 (anchor, idx 75) and col 8 (free end, idx 80).
    for (const idx of row8) if (idx !== 75 && idx !== 80) clearBit(cands, idx, 5);

    const step = skyscraper.find(grid, cands);
    expect(step).not.toBeNull();
    expect(step!.eliminations.every((e) => e.digit === 5)).toBe(true);
    expect(step!.eliminations.map((e) => e.idx)).toContain(70); // row 7, col 7
  });

  it('returns null when no digit forms a skyscraper pattern', () => {
    const step = skyscraper.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
