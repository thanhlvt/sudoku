import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENERATOR_VERSION, generatePuzzle } from '../src/core/generator';
import type { Level, LevelBank, Manifest, PuzzleRecord } from '../src/core/types';

const LEVELS: Level[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];
const SCHEMA_VERSION = 1;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUZZLES_DIR = join(ROOT, 'public', 'puzzles');

interface Args {
  level: Level | 'all';
  count: number;
  force: boolean;
  stats: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { level: 'all', count: 20, force: false, stats: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--level') args.level = argv[++i] as Level | 'all';
    else if (a === '--count') args.count = Number(argv[++i]);
    else if (a === '--force') args.force = true;
    else if (a === '--stats') args.stats = true;
    else if (a === '--concurrency') i++; // accepted for CLI compatibility; generation is fast single-threaded
  }
  return args;
}

function bankPath(level: Level): string {
  return join(PUZZLES_DIR, `${level}.json`);
}

function readBank(level: Level): LevelBank | null {
  const path = bankPath(level);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as LevelBank;
  } catch {
    return null;
  }
}

function writeAtomic(path: string, content: string): void {
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, content, 'utf-8');
  renameSync(tmp, path);
}

function writeBank(level: Level, bank: LevelBank): void {
  writeAtomic(bankPath(level), JSON.stringify(bank, null, 2));
}

function writeManifest(manifest: Manifest): void {
  writeAtomic(join(PUZZLES_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
}

function generateLevel(level: Level, count: number, force: boolean): LevelBank {
  const existing = readBank(level);
  const canReuseBank = existing !== null && existing.generatorVersion === GENERATOR_VERSION && !force;
  const puzzles: PuzzleRecord[] = [];
  let generated = 0;
  let failed = 0;
  let totalMs = 0;

  for (let index = 0; index < count; index++) {
    const prior = canReuseBank ? existing!.puzzles[index] : undefined;
    if (prior) {
      puzzles.push(prior);
      continue;
    }
    const t0 = Date.now();
    const record = generatePuzzle(level, index);
    totalMs += Date.now() - t0;
    generated++;
    if (!record) {
      failed++;
      process.stdout.write(`\n  ! failed to generate ${level}#${index}, skipping\n`);
      continue;
    }
    puzzles.push(record);
    const avg = generated > 0 ? Math.round(totalMs / generated) : 0;
    process.stdout.write(`\r${level} ${index + 1}/${count} (avg ${avg}ms, fail ${failed})   `);
  }
  process.stdout.write('\n');

  return {
    schemaVersion: SCHEMA_VERSION,
    generatorVersion: GENERATOR_VERSION,
    level,
    count: puzzles.length,
    puzzles,
  };
}

function summarize(arr: number[]): string {
  if (arr.length === 0) return 'n/a';
  const sorted = [...arr].sort((a, b) => a - b);
  const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  return `min=${sorted[0]} max=${sorted[sorted.length - 1]} avg=${avg}`;
}

function printStats(bank: LevelBank): void {
  const maxCosts = bank.puzzles.map((p) => p.rating.maxCost);
  const scores = bank.puzzles.map((p) => p.rating.score);
  const givensArr = bank.puzzles.map((p) => p.givens);
  console.log(
    `  ${bank.level}: maxCost[${summarize(maxCosts)}] score[${summarize(scores)}] givens[${summarize(givensArr)}]`,
  );
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const touchedLevels = args.level === 'all' ? LEVELS : [args.level];

  if (!existsSync(PUZZLES_DIR)) mkdirSync(PUZZLES_DIR, { recursive: true });

  const existingManifestPath = join(PUZZLES_DIR, 'manifest.json');
  const existingManifest: Manifest | null = existsSync(existingManifestPath)
    ? (JSON.parse(readFileSync(existingManifestPath, 'utf-8')) as Manifest)
    : null;

  const manifestLevels: Manifest['levels'] = [];
  for (const level of LEVELS) {
    if (touchedLevels.includes(level)) {
      const bank = generateLevel(level, args.count, args.force);
      writeBank(level, bank);
      manifestLevels.push({ level, count: bank.count, file: `${level}.json` });
      if (args.stats) printStats(bank);
    } else {
      const prior = existingManifest?.levels.find((l) => l.level === level);
      const bank = readBank(level);
      manifestLevels.push({ level, count: prior?.count ?? bank?.count ?? 0, file: `${level}.json` });
    }
  }

  writeManifest({ schemaVersion: SCHEMA_VERSION, generatorVersion: GENERATOR_VERSION, levels: manifestLevels });
  console.log('Done.');
}

main();
