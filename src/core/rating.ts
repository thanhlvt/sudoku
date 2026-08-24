import { solveLogically } from './logicalSolver';
import type { Grid, Level, Rating } from './types';

export const TIERS = [
  { level: 'beginner', maxCostRange: [0, 3], givens: [40, 50] },
  { level: 'easy', maxCostRange: [4, 4], givens: [34, 40] },
  { level: 'medium', maxCostRange: [5, 10], givens: [30, 36] },
  { level: 'hard', maxCostRange: [11, 22], givens: [26, 32] },
  { level: 'expert', maxCostRange: [23, 40], givens: [22, 28] },
] as const;

export function rate(grid: Grid): Rating {
  const result = solveLogically(grid);

  const counts: Record<string, number> = {};
  let maxCost = 0;
  let score = 0;
  let hardest: string | null = null;
  for (const step of result.steps) {
    counts[step.technique] = (counts[step.technique] ?? 0) + 1;
    score += step.cost;
    if (step.cost > maxCost) {
      maxCost = step.cost;
      hardest = step.technique;
    }
  }

  let level: Level | null = null;
  if (result.solved) {
    for (const tier of TIERS) {
      if (maxCost >= tier.maxCostRange[0] && maxCost <= tier.maxCostRange[1]) {
        level = tier.level;
        break;
      }
    }
  }

  return { solved: result.solved, maxCost, score, hardest, counts, level };
}
