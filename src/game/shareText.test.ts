import { describe, expect, it } from 'vitest';
import { formatDayMonth, translator } from '../i18n';
import { buildResultText as build, type ResultShare } from './shareText';

const vi = translator('vi');
const buildResultText = (r: ResultShare): string => build(r, vi, (key) => formatDayMonth(key, 'vi-VN'));

const base = { levelLabel: 'Khó', puzzleNumber: 12, stars: 3, elapsedMs: 272_000, mistakes: 0, hintsUsed: 1 };

describe('buildResultText', () => {
  it('summarises a normal solve', () => {
    expect(buildResultText(base)).toBe('Sudoku\nKhó · Màn 12 ⭐⭐⭐\n⏱ 04:32 · ❌ 0 lỗi · 💡 1 gợi ý');
  });

  it('names the day and streak of a daily challenge, and appends the link', () => {
    const text = buildResultText({
      ...base,
      stars: 2,
      daily: { date: '2026-10-05', streak: 5 },
      url: 'https://example.com/#/play/hard-012',
    });
    expect(text.split('\n')).toEqual([
      'Sudoku · Thử thách 5/10',
      'Khó · Màn 12 ⭐⭐',
      '⏱ 04:32 · ❌ 0 lỗi · 💡 1 gợi ý',
      '🔥 Chuỗi 5 ngày',
      'https://example.com/#/play/hard-012',
    ]);
  });

  it('leaves out a streak of one and a missing link', () => {
    const text = buildResultText({ ...base, daily: { date: '2026-10-21', streak: 1 }, url: null });
    expect(text).not.toContain('Chuỗi');
    expect(text.split('\n')).toHaveLength(3);
  });

  it('reads naturally in English, with plurals and the local day order', () => {
    const text = build(
      { ...base, levelLabel: 'Hard', mistakes: 1, hintsUsed: 2, daily: { date: '2026-10-05', streak: 5 } },
      translator('en'),
      (key) => formatDayMonth(key, 'en-US'),
    );
    expect(text.split('\n')).toEqual([
      'Sudoku · Challenge 10/5',
      'Hard · Puzzle 12 ⭐⭐⭐',
      '⏱ 04:32 · ❌ 1 mistake · 💡 2 hints',
      '🔥 5-day streak',
    ]);
  });

  it('clamps stars and formats long times', () => {
    const text = buildResultText({ ...base, stars: 7, elapsedMs: 3_725_000 });
    expect(text).toContain('⭐⭐⭐');
    expect(text).not.toContain('⭐⭐⭐⭐');
    expect(text).toContain('62:05');
  });
});
