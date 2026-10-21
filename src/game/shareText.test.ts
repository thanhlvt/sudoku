import { describe, expect, it } from 'vitest';
import { buildResultText } from './shareText';

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

  it('clamps stars and formats long times', () => {
    const text = buildResultText({ ...base, stars: 7, elapsedMs: 3_725_000 });
    expect(text).toContain('⭐⭐⭐');
    expect(text).not.toContain('⭐⭐⭐⭐');
    expect(text).toContain('62:05');
  });
});
