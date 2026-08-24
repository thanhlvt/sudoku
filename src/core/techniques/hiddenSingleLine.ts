import { COLS, ROWS } from '../board';
import type { Technique } from '../types';
import { describeCell, describeUnit, emptyCellsOf } from './helpers';

export const hiddenSingleLine: Technique = {
  name: 'hidden-single-line',
  cost: 4,
  find(grid, cands) {
    for (const unit of [...ROWS, ...COLS]) {
      const empties = emptyCellsOf(unit, grid);
      for (let d = 1; d <= 9; d++) {
        const bit = 1 << (d - 1);
        const holders = empties.filter((idx) => (cands[idx]! & bit) !== 0);
        if (holders.length === 1) {
          const idx = holders[0]!;
          return {
            technique: 'hidden-single-line',
            cost: 4,
            placements: [{ idx, digit: d }],
            eliminations: [],
            cells: [idx],
            explain: `Trong ${describeUnit(unit)}, số ${d} chỉ còn nằm được ở ô ${describeCell(idx)}.`,
          };
        }
      }
    }
    return null;
  },
};
