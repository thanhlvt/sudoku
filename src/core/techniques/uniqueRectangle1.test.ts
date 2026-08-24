import { describe, expect, it } from 'vitest';
import { uniqueRectangle1 } from './uniqueRectangle1';
import { bit, emptyGrid, fullCandidates, setCands } from './testUtils';

describe('uniqueRectangle1', () => {
  it('eliminates the pair digits from the corner that carries an extra candidate', () => {
    const grid = emptyGrid();
    const cands = fullCandidates();
    // Rectangle at rows 0,1 x cols 0,3 -> spans exactly boxes 0 and 1.
    setCands(cands, 0, bit(1, 2));
    setCands(cands, 3, bit(1, 2));
    setCands(cands, 9, bit(1, 2));
    setCands(cands, 12, bit(1, 2, 3)); // odd corner with extra candidate 3

    const step = uniqueRectangle1.find(grid, cands);
    expect(step).not.toBeNull();
    expect(step!.eliminations).toEqual(
      expect.arrayContaining([
        { idx: 12, digit: 1 },
        { idx: 12, digit: 2 },
      ]),
    );
  });

  it('returns null when no unique rectangle pattern exists', () => {
    const step = uniqueRectangle1.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
