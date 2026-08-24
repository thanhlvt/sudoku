import { PEERS, bitToDigit, candidateDigits, popcount } from '../board';
import type { Step, Technique } from '../types';
import { describeCell, describeCells } from './helpers';

export const xyWing: Technique = {
  name: 'xy-wing',
  cost: 30,
  find(grid, cands): Step | null {
    for (let pivot = 0; pivot < 81; pivot++) {
      if (grid[pivot] !== 0) continue;
      const pm = cands[pivot]!;
      if (popcount(pm) !== 2) continue;

      const peerList = Array.from(PEERS[pivot]!).filter((p) => grid[p] === 0 && popcount(cands[p]!) === 2);

      for (const p1 of peerList) {
        const m1 = cands[p1]!;
        const shared1 = m1 & pm;
        if (popcount(shared1) !== 1) continue;
        const zBit = m1 & ~pm & 0x1ff;
        if (popcount(zBit) !== 1) continue;

        for (const p2 of peerList) {
          if (p2 === p1) continue;
          const m2 = cands[p2]!;
          const shared2 = m2 & pm;
          if (popcount(shared2) !== 1 || shared2 === shared1) continue;
          if ((m2 & ~pm & 0x1ff) !== zBit) continue;

          const peers1 = new Set(PEERS[p1]!);
          const eliminations: { idx: number; digit: number }[] = [];
          const z = bitToDigit(zBit);
          for (const c of PEERS[p2]!) {
            if (c === pivot || !peers1.has(c)) continue;
            if (grid[c] === 0 && (cands[c]! & zBit) !== 0) eliminations.push({ idx: c, digit: z });
          }
          if (eliminations.length > 0) {
            return {
              technique: 'xy-wing',
              cost: 30,
              placements: [],
              eliminations,
              cells: [pivot, p1, p2, ...eliminations.map((e) => e.idx)],
              explain: `XY-Wing quanh ô trục ${describeCell(pivot)} (${candidateDigits(pm).join(
                ',',
              )}) và hai càng ${describeCell(p1)}, ${describeCell(p2)}: số ${z} bị loại khỏi ${describeCells(
                eliminations.map((e) => e.idx),
              )}.`,
            };
          }
        }
      }
    }
    return null;
  },
};
