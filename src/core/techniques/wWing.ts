import { PEERS, UNITS, candidateDigits, popcount } from '../board';
import type { Step, Technique } from '../types';
import { describeCell, describeCells } from './helpers';

export const wWing: Technique = {
  name: 'w-wing',
  cost: 33,
  find(grid, cands): Step | null {
    const bivalue: number[] = [];
    for (let i = 0; i < 81; i++) {
      if (grid[i] === 0 && popcount(cands[i]!) === 2) bivalue.push(i);
    }

    for (let i = 0; i < bivalue.length; i++) {
      for (let j = i + 1; j < bivalue.length; j++) {
        const A = bivalue[i]!;
        const B = bivalue[j]!;
        if (cands[A] !== cands[B]) continue;
        if (PEERS[A]!.includes(B)) continue;

        const digits = candidateDigits(cands[A]!);
        for (const yDigit of digits) {
          const xDigit = digits.find((d) => d !== yDigit)!;
          const yBit = 1 << (yDigit - 1);
          const xBit = 1 << (xDigit - 1);

          let linked = false;
          for (const unit of UNITS) {
            const withY = unit.filter((idx) => grid[idx] === 0 && (cands[idx]! & yBit) !== 0);
            if (withY.length !== 2) continue;
            const [c1, c2] = withY as [number, number];
            const c1SeesA = c1 !== A && c1 !== B && PEERS[A]!.includes(c1);
            const c2SeesB = c2 !== A && c2 !== B && PEERS[B]!.includes(c2);
            const c2SeesA = c2 !== A && c2 !== B && PEERS[A]!.includes(c2);
            const c1SeesB = c1 !== A && c1 !== B && PEERS[B]!.includes(c1);
            if ((c1SeesA && c2SeesB) || (c2SeesA && c1SeesB)) {
              linked = true;
              break;
            }
          }
          if (!linked) continue;

          const peersA = new Set(PEERS[A]!);
          const eliminations: { idx: number; digit: number }[] = [];
          for (const c of PEERS[B]!) {
            if (!peersA.has(c)) continue;
            if (grid[c] === 0 && (cands[c]! & xBit) !== 0) eliminations.push({ idx: c, digit: xDigit });
          }
          if (eliminations.length > 0) {
            return {
              technique: 'w-wing',
              cost: 33,
              placements: [],
              eliminations,
              cells: [A, B, ...eliminations.map((e) => e.idx)],
              explain: `W-Wing giữa ${describeCell(A)} và ${describeCell(B)} (cùng {${xDigit},${yDigit}}), nối bởi liên kết mạnh trên số ${yDigit}: số ${xDigit} bị loại khỏi ${describeCells(
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
