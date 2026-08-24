import { describe, expect, it } from 'vitest';
import { xyzWing } from './xyzWing';
import { bit, emptyGrid, fullCandidates, setCands } from './testUtils';

describe('xyzWing', () => {
  it('eliminates the shared digit z from cells seen by pivot and both pincers', () => {
    const grid = emptyGrid();
    const cands = fullCandidates();
    setCands(cands, 0, bit(1, 2, 3)); // pivot {x,y,z}
    setCands(cands, 1, bit(1, 3)); // pincer {x,z}, peer of pivot via row
    setCands(cands, 9, bit(2, 3)); // pincer {y,z}, peer of pivot via col

    const step = xyzWing.find(grid, cands);
    expect(step).not.toBeNull();
    expect(step!.eliminations.length).toBeGreaterThan(0);
    for (const { idx, digit } of step!.eliminations) {
      expect([0, 1, 9]).not.toContain(idx);
      expect(digit).toBe(3);
    }
  });

  it('returns null when no XYZ-Wing pattern exists', () => {
    const step = xyzWing.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
