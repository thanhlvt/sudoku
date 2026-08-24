import { PEERS, bitToDigit, candidateDigits, popcount } from '../board';
import type { Step, Technique } from '../types';
import { describeCell, describeCells } from './helpers';

export const xyzWing: Technique = {
  name: 'xyz-wing',
  cost: 32,
  find(grid, cands): Step | null {
    for (let pivot = 0; pivot < 81; pivot++) {
      if (grid[pivot] !== 0) continue;
      const pm = cands[pivot]!;
      if (popcount(pm) !== 3) continue;

      const pincers = Array.from(PEERS[pivot]!).filter(
        (p) => grid[p] === 0 && popcount(cands[p]!) === 2 && (cands[p]! & ~pm & 0x1ff) === 0,
      );

      for (let i = 0; i < pincers.length; i++) {
        for (let j = i + 1; j < pincers.length; j++) {
          const p1 = pincers[i]!;
          const p2 = pincers[j]!;
          const m1 = cands[p1]!;
          const m2 = cands[p2]!;
          if ((m1 | m2) !== pm) continue;
          const zBit = m1 & m2;
          if (popcount(zBit) !== 1) continue;

          const peersP1 = new Set(PEERS[p1]!);
          const peersPivot = new Set(PEERS[pivot]!);
          const z = bitToDigit(zBit);
          const eliminations: { idx: number; digit: number }[] = [];
          for (const c of PEERS[p2]!) {
            if (c === pivot || c === p1) continue;
            if (!peersP1.has(c) || !peersPivot.has(c)) continue;
            if (grid[c] === 0 && (cands[c]! & zBit) !== 0) eliminations.push({ idx: c, digit: z });
          }
          if (eliminations.length > 0) {
            return {
              technique: 'xyz-wing',
              cost: 32,
              placements: [],
              eliminations,
              cells: [pivot, p1, p2, ...eliminations.map((e) => e.idx)],
              explain: `XYZ-Wing quanh ô trục ${describeCell(pivot)} (${candidateDigits(pm).join(
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
