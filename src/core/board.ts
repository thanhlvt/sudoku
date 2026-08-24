import type { Candidates, Grid, Unit } from './types';

function boxOf(idx: number): number {
  const r = Math.floor(idx / 9);
  const c = idx % 9;
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
}

function buildRows(): Unit[] {
  const rows: Unit[] = [];
  for (let r = 0; r < 9; r++) {
    const unit: number[] = [];
    for (let c = 0; c < 9; c++) unit.push(r * 9 + c);
    rows.push(Object.freeze(unit));
  }
  return rows;
}

function buildCols(): Unit[] {
  const cols: Unit[] = [];
  for (let c = 0; c < 9; c++) {
    const unit: number[] = [];
    for (let r = 0; r < 9; r++) unit.push(r * 9 + c);
    cols.push(Object.freeze(unit));
  }
  return cols;
}

function buildBoxes(): Unit[] {
  const boxes: Unit[] = [];
  for (let b = 0; b < 9; b++) {
    const br = Math.floor(b / 3) * 3;
    const bc = (b % 3) * 3;
    const unit: number[] = [];
    for (let r = br; r < br + 3; r++) {
      for (let c = bc; c < bc + 3; c++) unit.push(r * 9 + c);
    }
    boxes.push(Object.freeze(unit));
  }
  return boxes;
}

export const ROWS: readonly Unit[] = Object.freeze(buildRows());
export const COLS: readonly Unit[] = Object.freeze(buildCols());
export const BOXES: readonly Unit[] = Object.freeze(buildBoxes());

export const UNITS: readonly Unit[] = Object.freeze([...ROWS, ...COLS, ...BOXES]);

function buildUnitsOf(): readonly (readonly Unit[])[] {
  const result: (readonly Unit[])[] = [];
  for (let idx = 0; idx < 81; idx++) {
    const r = Math.floor(idx / 9);
    const c = idx % 9;
    const b = boxOf(idx);
    result.push(Object.freeze([ROWS[r]!, COLS[c]!, BOXES[b]!]));
  }
  return Object.freeze(result);
}

export const UNITS_OF: readonly (readonly Unit[])[] = buildUnitsOf();

function buildPeers(): readonly Uint8Array[] {
  const result: Uint8Array[] = [];
  for (let idx = 0; idx < 81; idx++) {
    const set = new Set<number>();
    for (const unit of UNITS_OF[idx]!) {
      for (const other of unit) {
        if (other !== idx) set.add(other);
      }
    }
    result.push(Uint8Array.from(set));
  }
  return Object.freeze(result);
}

export const PEERS: readonly Uint8Array[] = buildPeers();

export function parseGrid(s: string): Grid {
  const grid: Grid = new Uint8Array(81);
  let i = 0;
  for (const ch of s) {
    if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') continue;
    if (i >= 81) break;
    if (ch === '.' || ch === '0') {
      grid[i] = 0;
    } else {
      const d = ch.charCodeAt(0) - 48;
      if (d < 1 || d > 9) {
        throw new Error(`Invalid character in grid string: "${ch}"`);
      }
      grid[i] = d;
    }
    i++;
  }
  if (i !== 81) {
    throw new Error(`Grid string has ${i} cells, expected 81`);
  }
  return grid;
}

export function gridToString(g: Grid, empty: '.' | '0' = '.'): string {
  let out = '';
  for (let i = 0; i < 81; i++) {
    const v = g[i]!;
    out += v === 0 ? empty : String(v);
  }
  return out;
}

export function cloneGrid(g: Grid): Grid {
  return g.slice() as Grid;
}

export function computeCandidates(g: Grid): Candidates {
  const cands: Candidates = new Uint16Array(81);
  for (let idx = 0; idx < 81; idx++) {
    if (g[idx] !== 0) {
      cands[idx] = 0;
      continue;
    }
    let mask = 0b111111111;
    for (const peer of PEERS[idx]!) {
      const v = g[peer]!;
      if (v !== 0) mask &= ~(1 << (v - 1));
    }
    cands[idx] = mask & 0x1ff;
  }
  return cands;
}

export function isValidPlacement(g: Grid, idx: number, d: number): boolean {
  for (const peer of PEERS[idx]!) {
    if (g[peer] === d) return false;
  }
  return true;
}

export function isComplete(g: Grid): boolean {
  for (let i = 0; i < 81; i++) {
    if (g[i] === 0) return false;
  }
  return true;
}

export function findConflicts(g: Grid): Set<number> {
  const conflicts = new Set<number>();
  for (let idx = 0; idx < 81; idx++) {
    const v = g[idx]!;
    if (v === 0) continue;
    for (const peer of PEERS[idx]!) {
      if (g[peer] === v) {
        conflicts.add(idx);
        conflicts.add(peer);
      }
    }
  }
  return conflicts;
}

export function popcount(mask: number): number {
  let n = mask;
  n = n - ((n >> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
  n = (n + (n >> 4)) & 0x0f0f0f0f;
  return (n * 0x01010101) >> 24;
}

export function lowestBit(mask: number): number {
  return mask & -mask;
}

export function bitToDigit(bit: number): number {
  return 31 - Math.clz32(bit) + 1;
}

export function digitToBit(d: number): number {
  return 1 << (d - 1);
}

export function candidateDigits(mask: number): number[] {
  const digits: number[] = [];
  let m = mask;
  while (m !== 0) {
    const bit = lowestBit(m);
    digits.push(bitToDigit(bit));
    m &= ~bit;
  }
  return digits;
}
