import { UNITS, bitToDigit } from '../board';
import type { Technique } from '../types';
import { describeUnit } from './helpers';

function digitBitOf(v: number): number {
  return 1 << (v - 1);
}

export const fullHouse: Technique = {
  name: 'full-house',
  cost: 1,
  find(grid, _cands) {
    for (const unit of UNITS) {
      let emptyIdx = -1;
      let count = 0;
      let usedMask = 0;
      for (const idx of unit) {
        const v = grid[idx]!;
        if (v === 0) {
          count++;
          emptyIdx = idx;
          if (count > 1) break;
        } else {
          usedMask |= digitBitOf(v);
        }
      }
      if (count === 1) {
        const missing = 0x1ff & ~usedMask;
        const digit = bitToDigit(missing);
        return {
          technique: 'full-house',
          cost: 1,
          placements: [{ idx: emptyIdx, digit }],
          eliminations: [],
          cells: [emptyIdx],
          explain: `${capitalize(describeUnit(unit))} chỉ còn đúng 1 ô trống, nên ô đó phải là số ${digit}.`,
        };
      }
    }
    return null;
  },
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
