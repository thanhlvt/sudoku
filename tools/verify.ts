import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gridToString, parseGrid } from '../src/core/board';
import { rate } from '../src/core/rating';
import { countSolutions } from '../src/core/solver';
import type { Level, LevelBank } from '../src/core/types';

const LEVELS: Level[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUZZLES_DIR = join(ROOT, 'public', 'puzzles');

function parseArgs(argv: string[]): { level?: Level } {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--level') return { level: argv[i + 1] as Level };
  }
  return {};
}

function verifyLevel(level: Level): string[] {
  const errors: string[] = [];
  const path = join(PUZZLES_DIR, `${level}.json`);
  if (!existsSync(path)) {
    errors.push(`missing bank file`);
    return errors;
  }

  const bank = JSON.parse(readFileSync(path, 'utf-8')) as LevelBank;
  if (bank.level !== level) errors.push(`bank.level is "${bank.level}", expected "${level}"`);

  const seenIds = new Set<string>();
  bank.puzzles.forEach((record, i) => {
    const label = `#${record.id ?? i}`;

    if (record.index !== i) errors.push(`${label}: index ${record.index} !== expected position ${i}`);
    if (seenIds.has(record.id)) errors.push(`${label}: duplicate id`);
    seenIds.add(record.id);

    if (record.puzzle.length !== 81) errors.push(`${label}: puzzle length ${record.puzzle.length} !== 81`);
    if (record.solution.length !== 81 || record.solution.includes('.') || record.solution.includes('0')) {
      errors.push(`${label}: solution must be 81 chars with no empty cells`);
    }

    let puzzleGrid;
    let solutionGrid;
    try {
      puzzleGrid = parseGrid(record.puzzle);
      solutionGrid = parseGrid(record.solution);
    } catch (e) {
      errors.push(`${label}: failed to parse grids (${(e as Error).message})`);
      return;
    }

    for (let idx = 0; idx < 81; idx++) {
      if (puzzleGrid[idx] !== 0 && puzzleGrid[idx] !== solutionGrid[idx]) {
        errors.push(`${label}: given at cell ${idx} does not match the recorded solution`);
      }
    }

    if (gridToString(solutionGrid, '.') !== record.solution) {
      errors.push(`${label}: solution string does not round-trip through the grid`);
    }

    const actualGivens = record.puzzle.split('').filter((c) => c !== '.').length;
    if (actualGivens !== record.givens) {
      errors.push(`${label}: recorded givens=${record.givens} but actual is ${actualGivens}`);
    }

    if (countSolutions(puzzleGrid, 2) !== 1) {
      errors.push(`${label}: does not have a unique solution`);
    }

    const rating = rate(puzzleGrid);
    if (!rating.solved) {
      errors.push(`${label}: not solvable by pure logic`);
    } else if (rating.level !== level) {
      errors.push(`${label}: rated level "${rating.level}", expected "${level}"`);
    }
  });

  return errors;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const levels = args.level ? [args.level] : LEVELS;

  let totalErrors = 0;
  for (const level of levels) {
    const errors = verifyLevel(level);
    if (errors.length === 0) {
      console.log(`${level}: OK`);
    } else {
      console.log(`${level}: ${errors.length} error(s)`);
      for (const e of errors) console.log(`  - ${e}`);
      totalErrors += errors.length;
    }
  }

  if (totalErrors > 0) {
    console.error(`\nFAILED: ${totalErrors} error(s) found.`);
    process.exit(1);
  }
  console.log('\nAll puzzle banks verified OK.');
}

main();
