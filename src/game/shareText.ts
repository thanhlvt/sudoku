import type { Translate } from '../i18n';

export interface ResultShare {
  /** The difficulty's name in the player's language, e.g. "Hard". */
  levelLabel: string;
  puzzleNumber: number;
  stars: number;
  elapsedMs: number;
  mistakes: number;
  hintsUsed: number;
  /** Set when this was a daily challenge: its date (`YYYY-MM-DD`) and the streak it reached. */
  daily?: { date: string; streak: number };
  /** Link to the puzzle, when the app has a public address to point at. */
  url?: string | null;
}

function clock(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  return `${String(Math.floor(totalSec / 60)).padStart(2, '0')}:${String(totalSec % 60).padStart(2, '0')}`;
}

/**
 * The text posted when the player shares a result: short, readable in any chat app, no personal data.
 * `formatDate` writes a `YYYY-MM-DD` key the way the player's language does (day/month order differs).
 */
export function buildResultText(r: ResultShare, t: Translate, formatDate: (key: string) => string): string {
  const stars = '⭐'.repeat(Math.max(0, Math.min(3, r.stars)));
  const title = r.daily ? t('share.dailyTitle', { date: formatDate(r.daily.date) }) : t('share.title');
  const lines = [
    title,
    t('share.level', { level: r.levelLabel, n: r.puzzleNumber, stars }),
    `⏱ ${clock(r.elapsedMs)} · ❌ ${t('share.mistakes', { count: r.mistakes })} · 💡 ${t('share.hints', { count: r.hintsUsed })}`,
  ];
  if (r.daily && r.daily.streak > 1) lines.push(`🔥 ${t('share.streak', { count: r.daily.streak })}`);
  if (r.url) lines.push(r.url);
  return lines.join('\n');
}
