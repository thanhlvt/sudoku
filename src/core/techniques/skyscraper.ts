import { COLS, PEERS, ROWS, colOf, rowOf } from '../board';
import type { Step, Technique, Unit } from '../types';
import { combinations, describeCell, describeUnit } from './helpers';

export const skyscraper: Technique = {
  name: 'skyscraper',
  cost: 26,
  find(grid, cands): Step | null {
    for (const baseUnits of [ROWS, COLS] as const) {
      for (let d = 1; d <= 9; d++) {
        const bit = 1 << (d - 1);
        const rowsWithTwo: { unit: Unit; cells: number[] }[] = [];
        for (const unit of baseUnits) {
          const cells = unit.filter((idx) => grid[idx] === 0 && (cands[idx]! & bit) !== 0);
          if (cells.length === 2) rowsWithTwo.push({ unit, cells });
        }
        for (const [a, b] of combinations(rowsWithTwo, 2)) {
          for (const anchorA of a!.cells) {
            for (const anchorB of b!.cells) {
              if (baseUnits === ROWS ? colOf(anchorA) !== colOf(anchorB) : rowOf(anchorA) !== rowOf(anchorB)) {
                continue;
              }
              const endA = a!.cells.find((x) => x !== anchorA)!;
              const endB = b!.cells.find((x) => x !== anchorB)!;
              const peersEndA = new Set(PEERS[endA]!);
              const eliminations: { idx: number; digit: number }[] = [];
              for (const c of PEERS[endB]!) {
                if (c === endA || !peersEndA.has(c)) continue;
                if (grid[c] === 0 && (cands[c]! & bit) !== 0) eliminations.push({ idx: c, digit: d });
              }
              if (eliminations.length > 0) {
                return {
                  technique: 'skyscraper',
                  cost: 26,
                  placements: [],
                  eliminations,
                  cells: [anchorA, anchorB, endA, endB, ...eliminations.map((e) => e.idx)],
                  explain: `Skyscraper trên số ${d}: ${describeUnit(a!.unit)} và ${describeUnit(
                    b!.unit,
                  )} mỗi hàng/cột chỉ còn 2 vị trí, chung một cột/hàng ở ${describeCell(
                    anchorA,
                  )}, nên số ${d} bị loại khỏi ô ${describeCell(eliminations[0]!.idx)}.`,
                };
              }
            }
          }
        }
      }
    }
    return null;
  },
};
