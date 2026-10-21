import { cloneGrid, computeCandidates, isComplete, parseGrid } from '../core/board';
import { applyStep } from '../core/logicalSolver';
import { TECHNIQUE_ORDER } from '../core/techniques';
import type { Candidates, Grid, Step } from '../core/types';

export interface TechniqueExample {
  /** The board at the moment the technique first applies. */
  grid: Grid;
  /** Candidates of every cell at that moment (what a player's notes would show). */
  candidates: Candidates;
  step: Step;
}

const MAX_STEPS = 500;

/**
 * Solves `puzzle` the way the rater does, cheapest technique first, and stops at the first time `technique`
 * is the one that makes progress. That moment is a ready-made worked example: the real board, the cells
 * involved and what the technique removes or places. Null when the puzzle never needs it.
 */
export function findTechniqueExample(puzzle: string, technique: string): TechniqueExample | null {
  const grid = parseGrid(puzzle);
  const candidates = computeCandidates(grid);
  for (let i = 0; i < MAX_STEPS && !isComplete(grid); i++) {
    let step: Step | null = null;
    for (const t of TECHNIQUE_ORDER) {
      step = t.find(grid, candidates);
      if (step) break;
    }
    if (!step) return null;
    if (step.technique === technique) {
      return { grid: cloneGrid(grid), candidates: new Uint16Array(candidates), step };
    }
    applyStep(grid, candidates, step);
  }
  return null;
}
