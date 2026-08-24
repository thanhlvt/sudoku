import { BOXES, COLS, ROWS, colOf, rowOf } from '../board';
import type { Step, Technique } from '../types';
import { describeCells, describeUnit, emptyCellsOf, isColUnit, isRowUnit } from './helpers';

export const pointing: Technique = {
  name: 'pointing',
  cost: 6,
  find(grid, cands): Step | null {
    for (const box of BOXES) {
      const empties = emptyCellsOf(box, grid);
      for (let d = 1; d <= 9; d++) {
        const bit = 1 << (d - 1);
        const holders = empties.filter((idx) => (cands[idx]! & bit) !== 0);
        if (holders.length < 2) continue;

        if (isRowUnit(holders)) {
          const line = ROWS[rowOf(holders[0]!)]!;
          const targets = line.filter((idx) => !box.includes(idx) && grid[idx] === 0 && (cands[idx]! & bit) !== 0);
          if (targets.length > 0) {
            return buildStep(box, line, holders, targets, d);
          }
        } else if (isColUnit(holders)) {
          const line = COLS[colOf(holders[0]!)]!;
          const targets = line.filter((idx) => !box.includes(idx) && grid[idx] === 0 && (cands[idx]! & bit) !== 0);
          if (targets.length > 0) {
            return buildStep(box, line, holders, targets, d);
          }
        }
      }
    }
    return null;
  },
};

function buildStep(
  box: readonly number[],
  line: readonly number[],
  holders: number[],
  targets: number[],
  digit: number,
): Step {
  return {
    technique: 'pointing',
    cost: 6,
    placements: [],
    eliminations: targets.map((idx) => ({ idx, digit })),
    cells: [...holders, ...targets],
    explain: `Trong ${describeUnit(box)}, số ${digit} chỉ còn nằm trên ${describeUnit(
      line,
    )}, nên bị loại khỏi các ô còn lại của ${describeUnit(line)} (${describeCells(targets)}).`,
  };
}
