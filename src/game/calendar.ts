/** Month view helpers for the daily-challenge calendar. Dates are `YYYY-MM-DD` keys; nothing here reads the clock. */

export interface YearMonth {
  year: number;
  /** 1-12. */
  month: number;
}

/** How far back the calendar lets the player browse. */
export const CALENDAR_MONTHS_BACK = 12;

export function yearMonthOf(key: string): YearMonth {
  const [year, month] = key.split('-').map(Number) as [number, number];
  return { year, month };
}

export function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function compareMonths(a: YearMonth, b: YearMonth): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

export function daysInMonth({ year, month }: YearMonth): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function keyOf({ year, month }: YearMonth, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Weeks of the month, Monday first; days outside the month are `null`. Every week has 7 entries. */
export function monthWeeks(ym: YearMonth): (string | null)[][] {
  const firstWeekday = new Date(Date.UTC(ym.year, ym.month - 1, 1)).getUTCDay(); // 0 = Sunday
  const offset = (firstWeekday + 6) % 7; // Monday = 0
  const cells: (string | null)[] = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= daysInMonth(ym); day++) cells.push(keyOf(ym, day));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
