import { PEERS, cloneGrid, computeCandidates, digitToBit, isComplete } from './board';
import { TECHNIQUE_ORDER } from './techniques';
import type { Candidates, Grid, Step } from './types';

const MAX_ITERATIONS = 500;

export interface LogicalSolveResult {
  solved: boolean;
  grid: Grid;
  steps: Step[];
  stuckAt?: Grid;
}

export function solveLogically(grid: Grid, opts?: { allowed?: string[] }): LogicalSolveResult {
  const working = cloneGrid(grid);
  const cands = computeCandidates(working);
  const steps: Step[] = [];
  const techniques = opts?.allowed
    ? TECHNIQUE_ORDER.filter((t) => opts.allowed!.includes(t.name))
    : TECHNIQUE_ORDER;

  let iterations = 0;
  while (iterations < MAX_ITERATIONS) {
    iterations++;
    if (isComplete(working)) {
      return { solved: true, grid: working, steps };
    }
    let step: Step | null = null;
    for (const technique of techniques) {
      step = technique.find(working, cands);
      if (step) break;
    }
    if (!step) {
      return { solved: false, grid: working, steps, stuckAt: cloneGrid(working) };
    }
    applyStep(working, cands, step);
    steps.push(step);
  }
  return { solved: false, grid: working, steps, stuckAt: cloneGrid(working) };
}

function applyStep(grid: Grid, cands: Candidates, step: Step): void {
  for (const { idx, digit } of step.placements) {
    grid[idx] = digit;
    cands[idx] = 0;
    const bit = digitToBit(digit);
    for (const peer of PEERS[idx]!) {
      cands[peer]! &= ~bit;
    }
  }
  for (const { idx, digit } of step.eliminations) {
    cands[idx]! &= ~digitToBit(digit);
  }
}
