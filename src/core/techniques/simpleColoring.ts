import { PEERS, UNITS } from '../board';
import type { Step, Technique } from '../types';
import { describeCell, describeCells } from './helpers';

export const simpleColoring: Technique = {
  name: 'simple-coloring',
  cost: 34,
  find(grid, cands): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = 1 << (d - 1);
      const cellsWithD: number[] = [];
      for (let i = 0; i < 81; i++) {
        if (grid[i] === 0 && (cands[i]! & bit) !== 0) cellsWithD.push(i);
      }
      if (cellsWithD.length < 4) continue;

      const adj = new Map<number, number[]>();
      for (const idx of cellsWithD) adj.set(idx, []);
      for (const unit of UNITS) {
        const inUnit = unit.filter((idx) => grid[idx] === 0 && (cands[idx]! & bit) !== 0);
        if (inUnit.length === 2) {
          const [a, b] = inUnit as [number, number];
          adj.get(a)!.push(b);
          adj.get(b)!.push(a);
        }
      }

      const visited = new Set<number>();
      for (const start of cellsWithD) {
        if (visited.has(start)) continue;
        const color = new Map<number, 0 | 1>();
        const queue = [start];
        color.set(start, 0);
        visited.add(start);
        const component = [start];
        while (queue.length > 0) {
          const cur = queue.shift()!;
          for (const nx of adj.get(cur)!) {
            if (!visited.has(nx)) {
              visited.add(nx);
              color.set(nx, color.get(cur) === 0 ? 1 : 0);
              queue.push(nx);
              component.push(nx);
            }
          }
        }
        if (component.length < 3) continue;

        for (let i = 0; i < component.length; i++) {
          for (let j = i + 1; j < component.length; j++) {
            const ci = component[i]!;
            const cj = component[j]!;
            if (color.get(ci) === color.get(cj) && PEERS[ci]!.includes(cj)) {
              const wrongColor = color.get(ci)!;
              const elimCells = component.filter((x) => color.get(x) === wrongColor);
              return {
                technique: 'simple-coloring',
                cost: 34,
                placements: [],
                eliminations: elimCells.map((idx) => ({ idx, digit: d })),
                cells: component,
                explain: `Xích tô màu cho số ${d}: hai ô cùng màu ${describeCell(ci)} và ${describeCell(
                  cj,
                )} nhìn thấy nhau nên màu đó sai, loại số ${d} khỏi ${describeCells(elimCells)}.`,
              };
            }
          }
        }

        const groupA = component.filter((x) => color.get(x) === 0);
        const groupB = component.filter((x) => color.get(x) === 1);
        for (let i = 0; i < 81; i++) {
          if (grid[i] !== 0 || (cands[i]! & bit) === 0 || component.includes(i)) continue;
          const seesA = groupA.some((c) => PEERS[i]!.includes(c));
          const seesB = groupB.some((c) => PEERS[i]!.includes(c));
          if (seesA && seesB) {
            return {
              technique: 'simple-coloring',
              cost: 34,
              placements: [],
              eliminations: [{ idx: i, digit: d }],
              cells: [...component, i],
              explain: `Xích tô màu cho số ${d}: ô ${describeCell(
                i,
              )} nhìn thấy cả hai màu của xích, nên số ${d} bị loại khỏi ô đó.`,
            };
          }
        }
      }
    }
    return null;
  },
};
