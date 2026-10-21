import { describe, expect, it } from 'vitest';
import { addMonths, compareMonths, daysInMonth, keyOf, monthWeeks, yearMonthOf } from './calendar';

describe('calendar', () => {
  it('moves across year boundaries', () => {
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths({ year: 2026, month: 3 }, -14)).toEqual({ year: 2025, month: 1 });
  });

  it('compares months', () => {
    expect(compareMonths({ year: 2026, month: 3 }, { year: 2026, month: 3 })).toBe(0);
    expect(compareMonths({ year: 2026, month: 2 }, { year: 2026, month: 3 })).toBeLessThan(0);
    expect(compareMonths({ year: 2027, month: 1 }, { year: 2026, month: 12 })).toBeGreaterThan(0);
  });

  it('knows month lengths, including leap years', () => {
    expect(daysInMonth({ year: 2026, month: 2 })).toBe(28);
    expect(daysInMonth({ year: 2024, month: 2 })).toBe(29);
    expect(daysInMonth({ year: 2026, month: 10 })).toBe(31);
  });

  it('formats and parses date keys', () => {
    expect(keyOf({ year: 2026, month: 3 }, 5)).toBe('2026-03-05');
    expect(yearMonthOf('2026-03-05')).toEqual({ year: 2026, month: 3 });
  });

  it('lays a month out in Monday-first weeks', () => {
    // October 2026 starts on a Thursday: three blanks, then the 1st.
    const weeks = monthWeeks({ year: 2026, month: 10 });
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks[0]).toEqual([null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
    expect(weeks.at(-1)!.filter(Boolean).at(-1)).toBe('2026-10-31');
  });

  it('starts a week with no padding when the month begins on Monday', () => {
    // June 2026 starts on a Monday.
    expect(monthWeeks({ year: 2026, month: 6 })[0]![0]).toBe('2026-06-01');
  });

  it('handles a month that begins on Sunday (six blanks)', () => {
    // March 2026 starts on a Sunday.
    expect(monthWeeks({ year: 2026, month: 3 })[0]).toEqual([null, null, null, null, null, null, '2026-03-01']);
  });
});
