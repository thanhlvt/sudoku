export interface ResultShare {
  /** e.g. "Khó". */
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

/** The text posted when the player shares a result: short, readable in any chat app, no personal data. */
export function buildResultText(r: ResultShare): string {
  const stars = '⭐'.repeat(Math.max(0, Math.min(3, r.stars)));
  const title = r.daily
    ? `Sudoku · Thử thách ${Number(r.daily.date.slice(8))}/${Number(r.daily.date.slice(5, 7))}`
    : 'Sudoku';
  const lines = [
    title,
    `${r.levelLabel} · Màn ${r.puzzleNumber} ${stars}`,
    `⏱ ${clock(r.elapsedMs)} · ❌ ${r.mistakes} lỗi · 💡 ${r.hintsUsed} gợi ý`,
  ];
  if (r.daily && r.daily.streak > 1) lines.push(`🔥 Chuỗi ${r.daily.streak} ngày`);
  if (r.url) lines.push(r.url);
  return lines.join('\n');
}
