import { describe, expect, it } from 'vitest';
import { parseGrid } from './board';
import { generatePuzzle } from './generator';
import { rate } from './rating';
import { countSolutions } from './solver';
import { TIERS } from './rating';

describe('generatePuzzle', () => {
  it('is deterministic: same (level, index) produces the same puzzle', () => {
    const a = generatePuzzle('easy', 0);
    const b = generatePuzzle('easy', 0);
    expect(a).not.toBeNull();
    expect(a).toEqual(b);
  });

  for (const level of ['beginner', 'easy', 'medium', 'hard', 'expert'] as const) {
    it(`produces valid puzzles satisfying all tier constraints for ${level}`, () => {
      const tier = TIERS.find((t) => t.level === level)!;
      for (let index = 0; index < 3; index++) {
        const record = generatePuzzle(level, index);
        expect(record).not.toBeNull();
        const { puzzle, solution, givens, rating, id } = record!;

        expect(puzzle.length).toBe(81);
        expect(solution.length).toBe(81);
        expect(id).toBe(`${level}-${String(index + 1).padStart(3, '0')}`);

        const puzzleGrid = parseGrid(puzzle);
        expect(countSolutions(puzzleGrid, 2)).toBe(1);

        const actualRating = rate(puzzleGrid);
        expect(actualRating.solved).toBe(true);
        expect(actualRating.level).toBe(level);
        expect(actualRating.maxCost).toBe(rating.maxCost);

        expect(rating.maxCost).toBeGreaterThanOrEqual(tier.maxCostRange[0]);
        expect(rating.maxCost).toBeLessThanOrEqual(tier.maxCostRange[1]);

        const actualGivens = puzzle.split('').filter((c) => c !== '.').length;
        expect(actualGivens).toBe(givens);
      }
    });
  }

  it('a rotational-180 symmetric puzzle is actually symmetric about the center', () => {
    let record = generatePuzzle('beginner', 1)!;
    let attempts = 0;
    while (record.symmetry !== 'rotational-180' && attempts < 5) {
      record = generatePuzzle('beginner', 1 + attempts)!;
      attempts++;
    }
    if (record.symmetry === 'rotational-180') {
      const chars = record.puzzle.split('');
      for (let i = 0; i < 81; i++) {
        const isEmptyA = chars[i] === '.';
        const isEmptyB = chars[80 - i] === '.';
        expect(isEmptyA).toBe(isEmptyB);
      }
    }
  });
});
