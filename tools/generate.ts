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

interface GenerateLevelResult {
  bank: LevelBank;
  failedIndices: number[];
}

function generateLevel(level: Level, count: number, force: boolean): GenerateLevelResult {
  const existing = readBank(level);
  const canReuseBank = existing !== null && existing.generatorVersion === GENERATOR_VERSION && !force;
  const puzzles: PuzzleRecord[] = [];
  const failedIndices: number[] = [];
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
      failedIndices.push(index);
      process.stdout.write(`\n  ! failed to generate ${level}#${index} after all retries\n`);
      continue;
    }
    puzzles.push(record);
    const avg = generated > 0 ? Math.round(totalMs / generated) : 0;
    process.stdout.write(`\r${level} ${index + 1}/${count} (avg ${avg}ms, fail ${failed})   `);
  }
  process.stdout.write('\n');

  // A puzzle missing from the middle of the array would leave every later id/index
  // pair mismatched (verify's "index liên tục từ 0" invariant) -- pushing whatever we
  // did generate would produce a bank that looks fine at a glance but is silently
  // short a puzzle. Only a fully populated 0..count-1 array is a valid bank.
  return {
    bank: { schemaVersion: SCHEMA_VERSION, generatorVersion: GENERATOR_VERSION, level, count, puzzles },
    failedIndices,
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
  let anyFailures = false;
  for (const level of LEVELS) {
    if (touchedLevels.includes(level)) {
      const { bank, failedIndices } = generateLevel(level, args.count, args.force);
      if (failedIndices.length > 0) {
        anyFailures = true;
        console.error(
          `  ✗ ${level}: ${failedIndices.length} index(es) failed after all retries (${failedIndices.join(', ')}) -- leaving ${level}.json untouched. Re-run to retry (attempts are seeded per index, so a fresh run tries the same seeds; increase MAX_ATTEMPTS in src/core/generator.ts if it keeps failing).`,
        );
        // Existing on-disk bank (if any) is left as-is -- a gapped bank must never replace a good one.
        const prior = existingManifest?.levels.find((l) => l.level === level);
        const priorBank = readBank(level);
        manifestLevels.push({ level, count: prior?.count ?? priorBank?.count ?? 0, file: `${level}.json` });
        continue;
      }
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

  if (anyFailures) {
    console.error('FAILED: one or more levels had unresolvable generation failures. See above.');
    process.exit(1);
  }
  console.log('Done.');
}

main();
