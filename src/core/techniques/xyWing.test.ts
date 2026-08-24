import { describe, expect, it } from 'vitest';
import { xyWing } from './xyWing';
import { bit, emptyGrid, fullCandidates, setCands } from './testUtils';

describe('xyWing', () => {
  it('eliminates the shared digit z from cells seen by both pincers', () => {
    const grid = emptyGrid();
    const cands = fullCandidates();
    setCands(cands, 0, bit(1, 2)); // pivot {x,y}
    setCands(cands, 1, bit(1, 3)); // pincer {x,z}, peer of pivot via row
    setCands(cands, 9, bit(2, 3)); // pincer {y,z}, peer of pivot via col

    const step = xyWing.find(grid, cands);
    expect(step).not.toBeNull();
    expect(step!.eliminations.length).toBeGreaterThan(0);
    for (const { idx, digit } of step!.eliminations) {
      expect([0, 1, 9]).not.toContain(idx);
      expect(digit).toBe(3);
    }
  });

  it('returns null when no XY-Wing pattern exists', () => {
    const step = xyWing.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
