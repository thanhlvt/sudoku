import { bitToDigit, cloneGrid, computeCandidates, digitToBit, lowestBit, popcount, PEERS } from './board';
import type { Candidates, Grid } from './types';

function findMRV(grid: Grid, cands: Candidates): number {
  let best = -1;
  let bestCount = 10;
  for (let i = 0; i < 81; i++) {
    if (grid[i] !== 0) continue;
    const pc = popcount(cands[i]!);
    if (pc === 0) return -2;
    if (pc < bestCount) {
      bestCount = pc;
      best = i;
      if (pc === 1) break;
    }
  }
  return best;
}

/**
 * Shared backtracking core. Mutates `grid`/`cands` in place and undoes on
 * backtrack via a reused stack (no per-node array allocation).
 */
function search(grid: Grid, cands: Candidates, limit: number, onSolution?: (g: Grid) => boolean): number {
  const undoBuf: number[] = [];
  let count = 0;
  let stopped = false;

  function place(idx: number, d: number): number {
    const bit = digitToBit(d);
    grid[idx] = d;
    const start = undoBuf.length;
    const peers = PEERS[idx]!;
    for (let i = 0; i < peers.length; i++) {
      const p = peers[i]!;
      if (grid[p] === 0 && (cands[p]! & bit) !== 0) {
        cands[p]! &= ~bit;
        undoBuf.push(p);
      }
    }
    return start;
  }

  function unplace(idx: number, d: number, start: number): void {
    const bit = digitToBit(d);
    grid[idx] = 0;
    for (let i = undoBuf.length - 1; i >= start; i--) {
      cands[undoBuf[i]!]! |= bit;
    }
    undoBuf.length = start;
  }

  function backtrack(): void {
    if (stopped || count >= limit) return;
    const idx = findMRV(grid, cands);
    if (idx === -2) return;
    if (idx === -1) {
      count++;
      if (onSolution && onSolution(grid)) stopped = true;
      return;
    }
    let m = cands[idx]!;
    while (m !== 0) {
      if (stopped || count >= limit) return;
      const bit = lowestBit(m);
      m &= ~bit;
      const d = bitToDigit(bit);
      const start = place(idx, d);
      backtrack();
      unplace(idx, d, start);
    }
  }

  backtrack();
  return count;
}

export function countSolutions(g: Grid, limit = 2): number {
  const grid = cloneGrid(g);
  const cands = computeCandidates(grid);
  return search(grid, cands, limit);
}

export function solveFirst(g: Grid): Grid | null {
  const grid = cloneGrid(g);
  const cands = computeCandidates(grid);
  let result: Grid | null = null;
  search(grid, cands, 1, (solved) => {
    result = cloneGrid(solved);
    return true;
  });
  return result;
}
