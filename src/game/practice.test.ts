import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TECHNIQUE_ORDER } from '../core/techniques';
import type { Level, LevelBank, PuzzleRecord } from '../core/types';
import type { SavedGame } from '../storage/schema';
import { indexPuzzles, masteredTechniques, practicePuzzles, usesOf } from './practice';
import { LOCALES, translate, type Translate } from '../i18n';
import { TECHNIQUES, isTechniqueId, techniqueInfo, techniqueLabel } from './techniqueInfo';
import { findTechniqueExample } from './techniqueExample';

function loadBank(level: Level): LevelBank {
  return JSON.parse(readFileSync(join(process.cwd(), 'public', 'puzzles', `${level}.json`), 'utf8')) as LevelBank;
}

const fake = (id: string, hardest: string, score: number, counts: Record<string, number>): PuzzleRecord =>
  ({ id, index: 0, puzzle: '', solution: '', givens: 0, symmetry: 'none', seed: 0, rating: { maxCost: 0, score, hardest, counts } }) as PuzzleRecord;

const bankOf = (puzzles: PuzzleRecord[]): LevelBank =>
  ({ schemaVersion: 1, generatorVersion: 1, level: 'hard', count: puzzles.length, puzzles }) as LevelBank;

const inLocale =
  (locale: (typeof LOCALES)[number]): Translate =>
  (key, params) =>
    translate(locale, key, params);

describe('technique info', () => {
  it('describes exactly the techniques the solver has, in the same order', () => {
    expect(TECHNIQUES.map((t) => t.id)).toEqual(TECHNIQUE_ORDER.map((t) => t.name));
  });

  it.each(LOCALES)('has a lesson for every technique in %s', (locale) => {
    const t = inLocale(locale);
    for (const { id } of TECHNIQUES) {
      const info = techniqueInfo(id, t)!;
      expect(info.label).not.toMatch(/^tech./);
      expect(info.group).not.toMatch(/^tech./);
      expect(info.summary.length).toBeGreaterThan(10);
      expect(info.steps.length).toBeGreaterThan(0);
      expect(info.steps.every((s) => s.length > 0)).toBe(true);
      expect(info.tip.length).toBeGreaterThan(0);
    }
  });

  it('shows unknown ids unchanged', () => {
    expect(techniqueLabel('x-wing', inLocale('en'))).toBe('X-Wing');
    expect(techniqueLabel('some-new-technique', inLocale('en'))).toBe('some-new-technique');
    expect(techniqueInfo('some-new-technique', inLocale('en'))).toBeUndefined();
    expect(isTechniqueId('x-wing')).toBe(true);
    expect(isTechniqueId('__proto__')).toBe(false);
    expect(isTechniqueId(5)).toBe(false);
  });
});

describe('practicePuzzles', () => {
  it('ranks puzzles built around the technique first, then lighter ones first', () => {
    const banks = [
      bankOf([
        fake('hard-001', 'x-wing', 300, { 'x-wing': 1 }),
        fake('hard-002', 'naked-triple', 100, { 'x-wing': 1 }), // merely uses it
        fake('hard-003', 'x-wing', 200, { 'x-wing': 2 }),
        fake('hard-004', 'naked-pair', 50, {}), // does not use it
      ]),
    ];
    expect(practicePuzzles('x-wing', banks).map((p) => p.id)).toEqual(['hard-003', 'hard-001', 'hard-002']);
  });

  it('tolerates records with no usable rating', () => {
    const broken = { id: 'hard-009', rating: null } as unknown as PuzzleRecord;
    const missing = { id: 'hard-010' } as unknown as PuzzleRecord;
    expect(practicePuzzles('x-wing', [bankOf([broken, missing])])).toEqual([]);
    expect(usesOf(broken, 'x-wing')).toBe(0);
  });
});

describe('masteredTechniques', () => {
  const puzzles = indexPuzzles([bankOf([fake('hard-001', 'x-wing', 1, { 'x-wing': 1, 'naked-single': 9 })])]);
  const game = (extra: Partial<SavedGame>): SavedGame => ({
    puzzleId: 'hard-001',
    board: '',
    notes: '',
    elapsedMs: 0,
    mistakes: 0,
    hintsUsed: 0,
    status: 'completed',
    updatedAt: 1,
    ...extra,
  });
  const techniques = ['x-wing', 'naked-single', 'swordfish'];

  it('counts every technique a hint-free solve needed', () => {
    expect([...masteredTechniques([game({})], puzzles, techniques)].sort()).toEqual(['naked-single', 'x-wing']);
  });

  it('ignores solves that used hints, unfinished games and unknown puzzles', () => {
    expect(masteredTechniques([game({ hintsUsed: 1 })], puzzles, techniques).size).toBe(0);
    expect(masteredTechniques([game({ status: 'in-progress' })], puzzles, techniques).size).toBe(0);
    expect(masteredTechniques([game({ puzzleId: 'hard-099' })], puzzles, techniques).size).toBe(0);
  });
});

describe('findTechniqueExample on the real bank', () => {
  it('finds a worked example for techniques that the bank uses', () => {
    const hard = loadBank('hard');
    const puzzle = practicePuzzles('x-wing', [hard])[0]!;
    const example = findTechniqueExample(puzzle.puzzle, 'x-wing');
    expect(example).not.toBeNull();
    expect(example!.step.technique).toBe('x-wing');
    expect(example!.step.eliminations.length).toBeGreaterThan(0);
    expect(example!.step.cells.length).toBeGreaterThan(0);
    // The candidates describe the same moment: every eliminated digit is still a candidate there.
    for (const { idx, digit } of example!.step.eliminations) {
      expect(example!.candidates[idx]! & (1 << (digit - 1))).not.toBe(0);
    }
  });

  it('returns null when the puzzle never needs the technique', () => {
    const beginner = loadBank('beginner').puzzles[0]!;
    expect(findTechniqueExample(beginner.puzzle, 'x-wing')).toBeNull();
  });

  it('agrees with the bank: every technique the ratings say a puzzle needs yields an example', () => {
    const hard = loadBank('hard');
    for (const technique of ['naked-pair', 'pointing', 'naked-triple']) {
      const puzzle = practicePuzzles(technique, [hard])[0]!;
      expect(findTechniqueExample(puzzle.puzzle, technique)?.step.technique).toBe(technique);
    }
  });
});
