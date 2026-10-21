import { describe, expect, it } from 'vitest';
import { parseGrid } from '../core/board';
import type { Grid } from '../core/types';
import { completedUnitCells } from './unitComplete';

const SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

function boardWithout(...holes: number[]): Grid {
  const g = parseGrid(SOLUTION);
  for (const h of holes) g[h] = 0;
  return g;
}

describe('completedUnitCells', () => {
  const solution = parseGrid(SOLUTION);

  it('returns nothing while every unit through the cell still has a hole', () => {
    // Holes in row 0 (1), column 0 (9) and box 0 (10) -> no unit through cell 0 is complete.
    expect(completedUnitCells(boardWithout(1, 9, 10), solution, 0).size).toBe(0);
  });

  it('flags the row, column and box when the last cell of each is filled correctly', () => {
    const result = completedUnitCells(parseGrid(SOLUTION), solution, 0);
    expect(result.get(0)).toBe(0);
    expect(result.get(8)).toBe(8); // far end of the row
    expect(result.get(72)).toBe(8); // far end of the column
    expect(result.get(20)).toBe(8); // far corner of the box
  });

  it('only flags units that are really complete', () => {
    // Cell 80 stays open, but it shares no unit with cell 0, so row 0 / column 0 / box 0 are all complete.
    const result = completedUnitCells(boardWithout(80), solution, 0);
    expect(result.has(80)).toBe(false);
    expect(result.get(1)).toBe(1);
    // Cell 8 is open: row 0 is incomplete (cell 5 is only in that row), column 0 and box 0 are complete.
    const partial = completedUnitCells(boardWithout(8), solution, 0);
    expect(partial.has(5)).toBe(false);
    expect(partial.has(9)).toBe(true);
  });

  it('ignores a wrong or empty cell', () => {
    const wrong = parseGrid(SOLUTION);
    wrong[0] = 9;
    expect(completedUnitCells(wrong, solution, 0).size).toBe(0);
    expect(completedUnitCells(boardWithout(0), solution, 0).size).toBe(0);
  });
});
