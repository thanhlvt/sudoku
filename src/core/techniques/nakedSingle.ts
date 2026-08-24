import { bitToDigit, popcount } from '../board';
import type { Technique } from '../types';
import { describeCell } from './helpers';

export const nakedSingle: Technique = {
  name: 'naked-single',
  cost: 2,
  find(grid, cands) {
    for (let idx = 0; idx < 81; idx++) {
      if (grid[idx] !== 0) continue;
      const mask = cands[idx]!;
      if (popcount(mask) === 1) {
        const digit = bitToDigit(mask);
        return {
          technique: 'naked-single',
          cost: 2,
          placements: [{ idx, digit }],
          eliminations: [],
          cells: [idx],
          explain: `Ô ${describeCell(idx)} chỉ còn duy nhất 1 số có thể điền: ${digit}.`,
        };
      }
    }
    return null;
  },
};
