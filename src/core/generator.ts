import { cloneGrid, gridToString, isValidPlacement } from './board';
import { fnv1a, mulberry32, shuffleInPlace } from './rng';
import { rate, TIERS } from './rating';
import { countSolutions } from './solver';
import type { Grid, Level, PuzzleRecord, Symmetry } from './types';

export const GENERATOR_VERSION = 1;

// Easy targets an exact maxCost of 4 (hidden-single-line only, nothing harder) -- a
// narrow window that a random symmetric dig can easily jump straight past. Medium and
// hard were occasionally missing that window too, so their budgets are padded as well.
const MAX_ATTEMPTS: Record<Level, number> = {
  beginner: 50,
  easy: 200,
  medium: 300,
  hard: 2000,
  expert: 400,
};

function generateFullGrid(rand: () => number): Grid {
  const grid: Grid = new Uint8Array(81);

  function backtrack(pos: number): boolean {
    if (pos === 81) return true;
    const digits = shuffleInPlace([1, 2, 3, 4, 5, 6, 7, 8, 9], rand);
    for (const d of digits) {
      if (isValidPlacement(grid, pos, d)) {
        grid[pos] = d;
        if (backtrack(pos + 1)) return true;
        grid[pos] = 0;
      }
    }
    return false;
  }

  backtrack(0);
  return grid;
}

function chooseSymmetry(level: Level, rand: () => number): Symmetry {
  switch (level) {
    case 'beginner':
    case 'easy':
      return 'rotational-180';
    case 'medium':
      return rand() < 0.5 ? 'rotational-180' : 'mirror-vertical';
    case 'hard':
      return rand() < 0.5 ? 'rotational-180' : 'none';
    case 'expert':
      return 'none';
  }
}

function pairOf(idx: number, symmetry: Symmetry): number {
  if (symmetry === 'rotational-180') return 80 - idx;
  if (symmetry === 'mirror-vertical') {
    const r = Math.floor(idx / 9);
    const c = idx % 9;
    return r * 9 + (8 - c);
  }
  return idx;
}

interface Tier {
  level: Level;
  maxCostRange: readonly [number, number];
  givens: readonly [number, number];
}

function digHoles(
  solution: Grid,
  symmetry: Symmetry,
  tier: Tier,
  rand: () => number,
): { grid: Grid; givens: number } {
  const grid = cloneGrid(solution);
  const cellOrder = shuffleInPlace(
    Array.from({ length: 81 }, (_, i) => i),
    rand,
  );
  const [minGivens, maxGivens] = tier.givens;
  const [minCost, maxCostCeil] = tier.maxCostRange;
  // Some tiers (e.g. easy: maxCost must be exactly 4) target a narrow window that a
  // single greedy dig-to-the-floor pass can easily overshoot. Instead, check after
  // every accepted removal whether we're currently inside the target window, and dig
  // a bit past the givens floor (down to a hard floor) looking for that moment.
  const hardFloor = Math.max(minGivens - 10, 17);
  let givens = 81;

  const tryRemove = (idx: number): boolean => {
    if (grid[idx] === 0) return false;
    const pair = pairOf(idx, symmetry);
    if (pair !== idx && grid[pair] === 0) return false;

    const savedA = grid[idx]!;
    const savedB = pair !== idx ? grid[pair]! : 0;
    grid[idx] = 0;
    if (pair !== idx) grid[pair] = 0;

    if (countSolutions(grid, 2) !== 1 || rate(grid).maxCost > maxCostCeil) {
      grid[idx] = savedA;
      if (pair !== idx) grid[pair] = savedB;
      return false;
    }
    givens -= pair !== idx ? 2 : 1;
    return true;
  };

  for (const idx of cellOrder) {
    if (givens <= hardFloor) break;
    if (!tryRemove(idx)) continue;
    if (givens < minGivens || givens > maxGivens) continue;
    const rating = rate(grid);
    if (rating.solved && rating.maxCost >= minCost && rating.maxCost <= maxCostCeil) {
      return { grid, givens };
    }
  }

  return { grid, givens };
}

export function generatePuzzle(level: Level, index: number): PuzzleRecord | null {
  const tier = TIERS.find((t) => t.level === level)!;
  const maxAttempts = MAX_ATTEMPTS[level];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const seedStr =
      attempt === 0 ? `${level}#${index}#${GENERATOR_VERSION}` : `${level}#${index}#${GENERATOR_VERSION}#${attempt}`;
    const seed = fnv1a(seedStr);
    const rand = mulberry32(seed);

    const solution = generateFullGrid(rand);
    const symmetry = chooseSymmetry(level, rand);
    const { grid: puzzleGrid, givens } = digHoles(solution, symmetry, tier, rand);

    if (countSolutions(puzzleGrid, 2) !== 1) continue;
    const rating = rate(puzzleGrid);
    if (!rating.solved || rating.hardest === null) continue;
    if (rating.maxCost < tier.maxCostRange[0] || rating.maxCost > tier.maxCostRange[1]) continue;
    if (givens < tier.givens[0] || givens > tier.givens[1]) continue;

    return {
      id: `${level}-${String(index + 1).padStart(3, '0')}`,
      index,
      puzzle: gridToString(puzzleGrid, '.'),
      solution: gridToString(solution, '.'),
      givens,
      symmetry,
      seed,
      rating: {
        maxCost: rating.maxCost,
        score: rating.score,
        hardest: rating.hardest,
        counts: rating.counts,
      },
    };
  }

  return null;
}
