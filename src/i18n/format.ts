/** Locale-aware date/number text. Dates come in as `YYYY-MM-DD` keys or epoch milliseconds, never from the clock. */

function parseKey(key: string): { year: number; month: number; day: number } {
  const [year, month, day] = key.split('-').map(Number) as [number, number, number];
  return { year, month, day };
}

/** Day and month of a date key in the language's own order and separator: "5/10" in Vietnamese, "10/5" in US English. */
export function formatDayMonth(key: string, intl: string): string {
  const { year, month, day } = parseKey(key);
  return new Intl.DateTimeFormat(intl, { day: 'numeric', month: 'numeric', timeZone: 'UTC' }).format(Date.UTC(year, month - 1, day));
}

/** Full month name ("October", "tháng 10"), for a 1-based month. */
export function formatMonthName(month: number, intl: string): string {
  return new Intl.DateTimeFormat(intl, { month: 'long', timeZone: 'UTC' }).format(Date.UTC(2000, month - 1, 1));
}

/** Short month name in capitals ("OCT"), for a 1-based month. */
export function formatMonthShort(month: number, intl: string): string {
  return new Intl.DateTimeFormat(intl, { month: 'short', timeZone: 'UTC' }).format(Date.UTC(2000, month - 1, 1)).toUpperCase();
}

/** A moment as a calendar date in the player's time zone. */
export function formatDate(ms: number, intl: string): string {
  return new Intl.DateTimeFormat(intl, { day: 'numeric', month: 'numeric', year: 'numeric' }).format(ms);
}
