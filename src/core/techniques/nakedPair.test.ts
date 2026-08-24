import { describe, expect, it } from 'vitest';
import { nakedPair } from './nakedPair';
import { bit, emptyGrid, fullCandidates, setCands } from './testUtils';

describe('nakedPair', () => {
  it('eliminates the pair digits from the rest of the unit', () => {
    const grid = emptyGrid();
    const cands = fullCandidates();
    setCands(cands, 0, bit(1, 2));
    setCands(cands, 1, bit(1, 2));
    const step = nakedPair.find(grid, cands);
    expect(step).not.toBeNull();
    expect(step!.eliminations.length).toBeGreaterThan(0);
    for (const { idx, digit } of step!.eliminations) {
      expect([0, 1]).not.toContain(idx);
      expect([1, 2]).toContain(digit);
    }
  });

  it('returns null when no unit has a naked pair', () => {
    const step = nakedPair.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
