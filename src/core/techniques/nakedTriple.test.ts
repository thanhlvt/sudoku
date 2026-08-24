import { describe, expect, it } from 'vitest';
import { nakedTriple } from './nakedTriple';
import { bit, emptyGrid, fullCandidates, setCands } from './testUtils';

describe('nakedTriple', () => {
  it('detects a triple even when no single cell holds all three digits ({1,2} {2,3} {1,3})', () => {
    const grid = emptyGrid();
    const cands = fullCandidates();
    setCands(cands, 0, bit(1, 2));
    setCands(cands, 1, bit(2, 3));
    setCands(cands, 2, bit(1, 3));
    const step = nakedTriple.find(grid, cands);
    expect(step).not.toBeNull();
    expect(step!.eliminations.length).toBeGreaterThan(0);
    for (const { idx, digit } of step!.eliminations) {
      expect([0, 1, 2]).not.toContain(idx);
      expect([1, 2, 3]).toContain(digit);
    }
  });

  it('returns null when no unit has a naked triple', () => {
    const step = nakedTriple.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
