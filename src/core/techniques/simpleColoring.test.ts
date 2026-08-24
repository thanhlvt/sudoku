import { describe, expect, it } from 'vitest';
import { simpleColoring } from './simpleColoring';
import { clearBit, emptyGrid, fullCandidates } from './testUtils';

describe('simpleColoring', () => {
  it('eliminates a digit when two same-colored cells of a chain see each other', () => {
    const grid = emptyGrid();
    const cands = fullCandidates();
    const row0 = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const col1 = [1, 10, 19, 28, 37, 46, 55, 64, 73];
    // Strong link on digit 6 in row 0: only cols 0 and 1.
    for (const idx of row0) if (idx !== 0 && idx !== 1) clearBit(cands, idx, 6);
    // Strong link on digit 6 in col 1: only rows 0 and 2 (idx 1, idx 19).
    for (const idx of col1) if (idx !== 1 && idx !== 19) clearBit(cands, idx, 6);

    // Chain: idx0 (color A) - idx1 (color B) - idx19 (color A). idx0 and idx19 both
    // sit in box 0, so same-colored cells see each other -> color A is wrong.
    const step = simpleColoring.find(grid, cands);
    expect(step).not.toBeNull();
    expect(step!.eliminations).toEqual(
      expect.arrayContaining([
        { idx: 0, digit: 6 },
        { idx: 19, digit: 6 },
      ]),
    );
  });

  it('returns null when no digit forms a colorable chain', () => {
    const step = simpleColoring.find(emptyGrid(), fullCandidates());
    expect(step).toBeNull();
  });
});
