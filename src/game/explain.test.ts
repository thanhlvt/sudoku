import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ExplainCode, Explanation, LevelBank } from '../core/types';
import { LOCALES, translator } from '../i18n';
import { explainText } from './explain';
import { TECHNIQUES } from './techniqueInfo';
import { findTechniqueExample } from './techniqueExample';

const row = (n: number) => ({ kind: 'row' as const, n });
const col = (n: number) => ({ kind: 'col' as const, n });
const box = (n: number) => ({ kind: 'box' as const, n });
const cell = (r: number, c: number) => ({ row: r, col: c });

/** One of each explanation the solver can produce. */
const SAMPLES: Record<ExplainCode, Explanation['args']> = {
  'full-house': { unit: row(3), digit: 4 },
  'naked-single': { cell: cell(2, 5), digit: 7 },
  'hidden-single': { unit: box(5), digit: 3, cell: cell(5, 6) },
  pointing: { box: box(1), line: row(2), digit: 6, targets: [cell(2, 4), cell(2, 8)] },
  claiming: { line: col(4), box: box(2), digit: 9, targets: [cell(1, 5)] },
  'naked-subset': { unit: row(1), size: 3, cells: [cell(1, 1), cell(1, 2), cell(1, 3)], digits: [1, 2, 3] },
  'hidden-subset': { unit: col(7), size: 2, cells: [cell(1, 7), cell(4, 7)], digits: [5, 8] },
  fish: { size: 2, digit: 4, bases: [row(2), row(6)], targets: [cell(1, 3), cell(9, 3)] },
  skyscraper: { digit: 5, unitA: row(2), unitB: row(6), anchor: cell(2, 3), target: cell(4, 7) },
  'coloring-clash': { digit: 2, cellA: cell(1, 1), cellB: cell(1, 5), targets: [cell(1, 1), cell(3, 3)] },
  'coloring-both': { digit: 8, cell: cell(4, 4) },
  'unique-rectangle': { corners: [cell(1, 1), cell(1, 2), cell(2, 1), cell(2, 2)], digits: [3, 6], odd: cell(2, 2) },
  'w-wing': { cellA: cell(1, 1), cellB: cell(9, 9), x: 3, y: 7, targets: [cell(1, 9)] },
  'xy-wing': { pivot: cell(5, 5), digits: [1, 2], claw1: cell(5, 1), claw2: cell(1, 5), z: 3, targets: [cell(1, 1)] },
  'xyz-wing': { pivot: cell(5, 5), digits: [1, 2, 3], claw1: cell(5, 1), claw2: cell(1, 5), z: 3, targets: [cell(1, 1)] },
};

describe('explainText', () => {
  it.each(LOCALES)('writes a complete sentence for every kind of step in %s', (locale) => {
    const t = translator(locale);
    for (const [code, args] of Object.entries(SAMPLES)) {
      const text = explainText({ code: code as ExplainCode, args }, t);
      expect(text, code).not.toMatch(/^explain\./); // the catalog key was found
      expect(text, code).not.toMatch(/\{\w+\}/); // every placeholder was filled
      expect(text, code).not.toContain('undefined');
      expect(text.length, code).toBeGreaterThan(20);
    }
  });

  it('describes a step in English', () => {
    const t = translator('en');
    expect(explainText({ code: 'full-house', args: SAMPLES['full-house']! }, t)).toBe(
      'Row 3 has only 1 empty cell left, so that cell must be 4.',
    );
    expect(explainText({ code: 'hidden-single', args: SAMPLES['hidden-single']! }, t)).toBe(
      'In box 5, the digit 3 can only go in cell (row 5, column 6).',
    );
    expect(explainText({ code: 'naked-subset', args: SAMPLES['naked-subset']! }, t)).toBe(
      'In row 1, 3 cells (row 1, column 1; row 1, column 2; row 1, column 3) can only hold the digits {1, 2, 3}: a naked triple, so those digits are removed from the other cells of row 1.',
    );
    expect(explainText({ code: 'fish', args: SAMPLES.fish! }, t)).toContain('X-Wing: the digit 4 in row 2, row 6');
  });

  it('describes a step in Vietnamese', () => {
    const t = translator('vi');
    expect(explainText({ code: 'full-house', args: SAMPLES['full-house']! }, t)).toBe(
      'Hàng 3 chỉ còn đúng 1 ô trống, nên ô đó phải là số 4.',
    );
    expect(explainText({ code: 'naked-single', args: SAMPLES['naked-single']! }, t)).toBe(
      'Ô hàng 2, cột 5 chỉ còn duy nhất 1 số có thể điền: 7.',
    );
  });

  it('explains the steps the solver really finds on real puzzles', () => {
    const banks = (['hard', 'expert'] as const).map(
      (level) => JSON.parse(readFileSync(join(process.cwd(), 'public', 'puzzles', `${level}.json`), 'utf8')) as LevelBank,
    );
    const seen = new Set<string>();
    for (const bank of banks) {
      for (const { puzzle } of bank.puzzles.slice(0, 12)) {
        for (const { id } of TECHNIQUES) {
          const example = findTechniqueExample(puzzle, id);
          if (!example) continue;
          seen.add(example.step.explain.code);
          for (const locale of LOCALES) {
            const text = explainText(example.step.explain, translator(locale));
            expect(text, `${id} (${locale})`).not.toMatch(/\{\w+\}|undefined|NaN/);
          }
        }
      }
    }
    // Beyond the singles, the sample must have exercised several of the harder explanations too.
    expect(seen.size).toBeGreaterThanOrEqual(8);
  });
});
