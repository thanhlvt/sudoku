import type { Candidates, Grid } from '../types';

/** All 81 cells empty. Techniques never require a globally-consistent grid, only `grid[idx]===0`. */
export function emptyGrid(): Grid {
  return new Uint8Array(81);
}

/** Every empty cell starts with all 9 digits as candidates; tests narrow specific cells from there. */
export function fullCandidates(): Candidates {
  return new Uint16Array(81).fill(0x1ff);
}

export function bit(...digits: number[]): number {
  return digits.reduce((m, d) => m | (1 << (d - 1)), 0);
}

export function setCands(cands: Candidates, idx: number, mask: number): void {
  cands[idx] = mask;
}

export function clearBit(cands: Candidates, idx: number, digit: number): void {
  cands[idx]! &= ~(1 << (digit - 1));
}
