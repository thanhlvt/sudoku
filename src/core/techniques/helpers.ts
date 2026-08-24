import { COLS, ROWS, UNITS, boxOf, candidateDigits, colOf, popcount, rowOf } from '../board';
import type { Candidates, Grid, Step, Technique, Unit } from '../types';

export function combinations<T>(items: readonly T[], k: number): T[][] {
  const result: T[][] = [];
  const combo: T[] = [];
  function backtrack(start: number): void {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < items.length; i++) {
      combo.push(items[i]!);
      backtrack(i + 1);
      combo.pop();
    }
  }
  backtrack(0);
  return result;
}

export function emptyCellsOf(unit: Unit, grid: Grid): number[] {
  const out: number[] = [];
  for (const idx of unit) if (grid[idx] === 0) out.push(idx);
  return out;
}

export function cellsWithCandidate(cells: readonly number[], cands: Candidates, bit: number): number[] {
  const out: number[] = [];
  for (const idx of cells) if ((cands[idx]! & bit) !== 0) out.push(idx);
  return out;
}

/** True when every cell in `unit` shares the same row. */
export function isRowUnit(unit: Unit): boolean {
  const r0 = rowOf(unit[0]!);
  return unit.every((i) => rowOf(i) === r0);
}

/** True when every cell in `unit` shares the same column. */
export function isColUnit(unit: Unit): boolean {
  const c0 = colOf(unit[0]!);
  return unit.every((i) => colOf(i) === c0);
}

export function describeUnit(unit: Unit): string {
  if (isRowUnit(unit)) return `hàng ${rowOf(unit[0]!) + 1}`;
  if (isColUnit(unit)) return `cột ${colOf(unit[0]!) + 1}`;
  return `khối ${boxOf(unit[0]!) + 1}`;
}

export function describeCell(idx: number): string {
  return `hàng ${rowOf(idx) + 1}, cột ${colOf(idx) + 1}`;
}

export function describeCells(idxs: readonly number[]): string {
  return idxs.map(describeCell).join('; ');
}

/**
 * Naked subset of size k in `unit`: k cells whose candidate union has
 * exactly k digits -> eliminate those digits from every other cell in
 * the unit. Only cells with 2..k candidates participate.
 */
export function findNakedSubsetInUnit(
  unit: Unit,
  grid: Grid,
  cands: Candidates,
  k: number,
): { cells: number[]; mask: number } | null {
  const candidates = emptyCellsOf(unit, grid).filter((idx) => {
    const pc = popcount(cands[idx]!);
    return pc >= 2 && pc <= k;
  });
  if (candidates.length < k) return null;
  for (const combo of combinations(candidates, k)) {
    let unionMask = 0;
    for (const idx of combo) unionMask |= cands[idx]!;
    if (popcount(unionMask) !== k) continue;
    // Must actually eliminate something from the rest of the unit.
    const rest = emptyCellsOf(unit, grid).filter((idx) => !combo.includes(idx));
    const wouldEliminate = rest.some((idx) => (cands[idx]! & unionMask) !== 0);
    if (wouldEliminate) return { cells: combo, mask: unionMask };
  }
  return null;
}

/**
 * Hidden subset of size k in `unit`: k digits whose combined cell set
 * has exactly k cells -> eliminate every other digit from those cells.
 */
export function findHiddenSubsetInUnit(
  unit: Unit,
  grid: Grid,
  cands: Candidates,
  k: number,
): { cells: number[]; digitMask: number } | null {
  const empties = emptyCellsOf(unit, grid);
  const presentDigits: number[] = [];
  for (let d = 1; d <= 9; d++) {
    const bit = 1 << (d - 1);
    if (empties.some((idx) => (cands[idx]! & bit) !== 0)) presentDigits.push(bit);
  }
  if (presentDigits.length < k) return null;
  for (const combo of combinations(presentDigits, k)) {
    let digitMask = 0;
    for (const bit of combo) digitMask |= bit;
    const cells = empties.filter((idx) => (cands[idx]! & digitMask) !== 0);
    if (cells.length !== k) continue;
    const wouldEliminate = cells.some((idx) => (cands[idx]! & ~digitMask & 0x1ff) !== 0);
    if (wouldEliminate) return { cells, digitMask };
  }
  return null;
}

const SUBSET_NAMES = ['', '', 'cặp', 'bộ ba', 'bộ bốn'];

export function nakedSubsetTechnique(name: string, cost: number, k: number): Technique {
  return {
    name,
    cost,
    find(grid, cands): Step | null {
      for (const unit of UNITS) {
        const found = findNakedSubsetInUnit(unit, grid, cands, k);
        if (!found) continue;
        const { cells, mask } = found;
        const rest = emptyCellsOf(unit, grid).filter((idx) => !cells.includes(idx));
        const eliminations: { idx: number; digit: number }[] = [];
        for (const idx of rest) {
          for (const digit of candidateDigits(cands[idx]! & mask)) {
            eliminations.push({ idx, digit });
          }
        }
        if (eliminations.length === 0) continue;
        const digits = candidateDigits(mask).join(', ');
        return {
          technique: name,
          cost,
          placements: [],
          eliminations,
          cells: [...cells, ...eliminations.map((e) => e.idx)],
          explain: `Trong ${describeUnit(unit)}, ${cells.length} ô (${describeCells(
            cells,
          )}) chỉ có thể chứa các số {${digits}} — đây là một ${SUBSET_NAMES[k]} ẩn giấu, nên các số đó bị loại khỏi những ô khác trong ${describeUnit(unit)}.`,
        };
      }
      return null;
    },
  };
}

interface FishMatch {
  baseIdxs: number[];
  coverIdxs: number[];
}

function findFishForDigit(
  size: number,
  baseUnits: readonly Unit[],
  grid: Grid,
  cands: Candidates,
  digitBit: number,
): FishMatch | null {
  const qualifying: { b: number; covers: number[] }[] = [];
  for (let b = 0; b < 9; b++) {
    const unit = baseUnits[b]!;
    const covers: number[] = [];
    for (let ci = 0; ci < 9; ci++) {
      const idx = unit[ci]!;
      if (grid[idx] === 0 && (cands[idx]! & digitBit) !== 0) covers.push(ci);
    }
    if (covers.length >= 1 && covers.length <= size) qualifying.push({ b, covers });
  }
  if (qualifying.length < size) return null;
  for (const combo of combinations(qualifying, size)) {
    const coverSet = new Set<number>();
    for (const q of combo) for (const c of q.covers) coverSet.add(c);
    if (coverSet.size !== size) continue;
    return { baseIdxs: combo.map((q) => q.b), coverIdxs: [...coverSet] };
  }
  return null;
}

const FISH_NAMES = ['', '', 'X-Wing', '', 'Swordfish', '', '', '', 'Jellyfish'];

export function fishTechnique(name: string, cost: number, size: number): Technique {
  return {
    name,
    cost,
    find(grid, cands): Step | null {
      const orientations: readonly [readonly Unit[], readonly Unit[]][] = [
        [ROWS, COLS],
        [COLS, ROWS],
      ];
      for (const [baseUnits, coverUnits] of orientations) {
        for (let d = 1; d <= 9; d++) {
          const bit = 1 << (d - 1);
          const found = findFishForDigit(size, baseUnits, grid, cands, bit);
          if (!found) continue;
          const { baseIdxs, coverIdxs } = found;

          const baseCellsSet = new Set<number>();
          for (const b of baseIdxs) for (const ci of coverIdxs) baseCellsSet.add(baseUnits[b]![ci]!);

          const eliminations: { idx: number; digit: number }[] = [];
          for (const c of coverIdxs) {
            const coverUnit = coverUnits[c]!;
            for (let b2 = 0; b2 < 9; b2++) {
              if (baseIdxs.includes(b2)) continue;
              const idx = coverUnit[b2]!;
              if (grid[idx] === 0 && (cands[idx]! & bit) !== 0) eliminations.push({ idx, digit: d });
            }
          }
          if (eliminations.length === 0) continue;

          const baseLabels = baseIdxs.map((b) => describeUnit(baseUnits[b]!)).join(', ');
          return {
            technique: name,
            cost,
            placements: [],
            eliminations,
            cells: [...baseCellsSet, ...eliminations.map((e) => e.idx)],
            explain: `${FISH_NAMES[size]}: số ${d} trong ${baseLabels} chỉ nằm ở đúng ${size} vị trí chung cột/hàng, nên bị loại khỏi các ô còn lại của những cột/hàng đó (${describeCells(
              eliminations.map((e) => e.idx),
            )}).`,
          };
        }
      }
      return null;
    },
  };
}

export function hiddenSubsetTechnique(name: string, cost: number, k: number): Technique {
  return {
    name,
    cost,
    find(grid, cands): Step | null {
      for (const unit of UNITS) {
        const found = findHiddenSubsetInUnit(unit, grid, cands, k);
        if (!found) continue;
        const { cells, digitMask } = found;
        const eliminations: { idx: number; digit: number }[] = [];
        for (const idx of cells) {
          for (const digit of candidateDigits(cands[idx]! & ~digitMask & 0x1ff)) {
            eliminations.push({ idx, digit });
          }
        }
        if (eliminations.length === 0) continue;
        const digits = candidateDigits(digitMask).join(', ');
        return {
          technique: name,
          cost,
          placements: [],
          eliminations,
          cells,
          explain: `Trong ${describeUnit(unit)}, các số {${digits}} chỉ còn nằm được ở ${cells.length} ô (${describeCells(
            cells,
          )}) — đây là một ${SUBSET_NAMES[k]} ẩn, nên mọi số khác bị loại khỏi các ô đó.`,
        };
      }
      return null;
    },
  };
}
