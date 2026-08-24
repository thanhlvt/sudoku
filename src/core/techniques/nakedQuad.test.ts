import { describe, expect, it } from 'vitest';
import { nakedQuad } from './nakedQuad';
import { bit, emptyGrid, fullCandidates, setCands } from './testUtils';

describe('nakedQuad', () => {
  it('detects a quad from overlapping pairs covering exactly 4 digits', () => {
    const grid = emptyGrid();
    const cands = fullCandidates();
    setCands(cands, 0, bit(1, 2));
    setCands(cands, 1, bit(2, 3));
    setCands(cands, 2, bit(3, 4));
    setCands(cands, 3, bit(1, 4));
    const step = nakedQuad.find(grid, cands);
    expect(step).not.toBeNull();
    expect(step!.eliminations.length).toBeGreaterThan(0);
    for (const { idx, digit } of step!.eliminations) {
      expect([0, 1, 2, 3]).not.toContain(idx);
      expect([1, 2, 3, 4]).toContain(digit);
    }
  });

  it('returns null when no unit has a naked quad', () => {
    const step = nakedQuad.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
