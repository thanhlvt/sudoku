import { BOXES, COLS, ROWS, boxOf } from '../board';
import type { Step, Technique } from '../types';
import { describeCells, describeUnit, emptyCellsOf } from './helpers';

export const claiming: Technique = {
  name: 'claiming',
  cost: 7,
  find(grid, cands): Step | null {
    for (const line of [...ROWS, ...COLS]) {
      const empties = emptyCellsOf(line, grid);
      for (let d = 1; d <= 9; d++) {
        const bit = 1 << (d - 1);
        const holders = empties.filter((idx) => (cands[idx]! & bit) !== 0);
        if (holders.length < 2) continue;

        const b0 = boxOf(holders[0]!);
        const sameBox = holders.every((idx) => boxOf(idx) === b0);
        if (!sameBox) continue;

        const box = BOXES[b0]!;
        const targets = box.filter((idx) => !line.includes(idx) && grid[idx] === 0 && (cands[idx]! & bit) !== 0);
        if (targets.length > 0) {
          return {
            technique: 'claiming',
            cost: 7,
            placements: [],
            eliminations: targets.map((idx) => ({ idx, digit: d })),
            cells: [...holders, ...targets],
            explain: `Trong ${describeUnit(line)}, số ${d} chỉ còn nằm trong ${describeUnit(
              box,
            )}, nên bị loại khỏi các ô còn lại của ${describeUnit(box)} (${describeCells(targets)}).`,
          };
        }
      }
    }
    return null;
  },
};
