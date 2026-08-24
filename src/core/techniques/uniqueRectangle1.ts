import { boxOf, candidateDigits, popcount } from '../board';
import type { Step, Technique } from '../types';
import { describeCell } from './helpers';

export const uniqueRectangle1: Technique = {
  name: 'unique-rectangle-1',
  cost: 36,
  find(grid, cands): Step | null {
    for (let r1 = 0; r1 < 9; r1++) {
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        for (let c1 = 0; c1 < 9; c1++) {
          for (let c2 = c1 + 1; c2 < 9; c2++) {
            const idxs = [r1 * 9 + c1, r1 * 9 + c2, r2 * 9 + c1, r2 * 9 + c2];
            if (idxs.some((i) => grid[i] !== 0)) continue;
            if (new Set(idxs.map(boxOf)).size !== 2) continue;

            for (let odd = 0; odd < 4; odd++) {
              const others = idxs.filter((_, k) => k !== odd);
              const om0 = cands[others[0]!]!;
              const om1 = cands[others[1]!]!;
              const om2 = cands[others[2]!]!;
              if (om0 !== om1 || om1 !== om2) continue;
              if (popcount(om0) !== 2) continue;

              const oddIdx = idxs[odd]!;
              const oddMask = cands[oddIdx]!;
              if ((oddMask & om0) !== om0) continue;
              if (oddMask === om0) continue;

              return {
                technique: 'unique-rectangle-1',
                cost: 36,
                placements: [],
                eliminations: candidateDigits(om0).map((digit) => ({ idx: oddIdx, digit })),
                cells: idxs,
                explain: `Hình chữ nhật ${idxs.map(describeCell).join(', ')} có 3 góc chỉ mang {${candidateDigits(
                  om0,
                ).join(',')}}; nếu góc còn lại (${describeCell(
                  oddIdx,
                )}) cũng chỉ mang 2 số đó thì bàn cờ có 2 nghiệm, nên các số đó bị loại khỏi ô ${describeCell(
                  oddIdx,
                )}.`,
              };
            }
          }
        }
      }
    }
    return null;
  },
};
