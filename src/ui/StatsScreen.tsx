import { Check, Clock, Lightbulb, Star, X, type LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { LEVELS } from '../core/levels';
import { summarizeByLevel } from '../game/progress';
import type { Stats } from '../storage/schema';
import { ScreenHeader } from './ScreenHeader';
import { formatTime } from './Timer';
import { LEVEL_LABELS, LEVEL_THEME } from './levelLabels';
import { useSavedProgress } from './hooks/useSavedProgress';

interface StatsScreenProps {
  stats: Stats;
  onBack: () => void;
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes} phút`;
  return `${Math.floor(minutes / 60)}g ${minutes % 60}p`;
}

interface Tile {
  icon: LucideIcon;
  chip: string;
  value: string;
  label: string;
}

export function StatsScreen({ stats, onBack }: StatsScreenProps): JSX.Element {
  const { games } = useSavedProgress();

  const totals = useMemo(() => {
    const finished = games.filter((g) => g.status === 'completed');
    return {
      solved: finished.length,
      flawless: finished.filter((g) => g.mistakes === 0 && g.hintsUsed === 0).length,
      mistakes: finished.reduce((n, g) => n + g.mistakes, 0),
      hints: finished.reduce((n, g) => n + g.hintsUsed, 0),
      timeMs: games.reduce((n, g) => n + g.elapsedMs, 0),
    };
  }, [games]);
  const summary = useMemo(() => summarizeByLevel(games), [games]);
  const totalStars = LEVELS.reduce((n, level) => n + summary[level].stars, 0);
  const slowestAvg = Math.max(
    1,
    ...LEVELS.map((level) => {
      const s = stats[level];
      return s.completed > 0 ? s.totalMs / s.completed : 0;
    }),
  );

  const tiles: Tile[] = [
    { icon: Check, chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300', value: String(totals.solved), label: 'Màn đã giải' },
    { icon: Star, chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300', value: String(totalStars), label: 'Tổng số sao' },
    { icon: Clock, chip: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300', value: formatDuration(totals.timeMs), label: 'Thời gian chơi' },
    { icon: Check, chip: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300', value: String(totals.flawless), label: 'Không sai, không gợi ý' },
    { icon: X, chip: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300', value: String(totals.mistakes), label: 'Lần điền sai' },
    { icon: Lightbulb, chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300', value: String(totals.hints), label: 'Gợi ý đã dùng' },
  ];

  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pb-8 pt-5">
      <ScreenHeader title="Thống kê" onBack={onBack} />

      <section className="grid grid-cols-2 gap-3" aria-label="Tổng quan">
        {tiles.map(({ icon: Icon, chip, value, label }, i) => (
          <div key={label} className="card flex animate-screen-in items-center gap-3 p-3" style={{ animationDelay: `${i * 45}ms` }}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${chip}`}>
              <Icon size={20} strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xl font-black leading-tight tabular-nums">{value}</span>
              <span className="block text-sm font-bold leading-tight text-accent">{label}</span>
            </span>
          </div>
        ))}
      </section>

      <h2 className="mt-1 text-xl font-black">Theo cấp độ</h2>
      <ul className="flex flex-col gap-3">
        {LEVELS.map((level) => {
          const s = stats[level];
          const theme = LEVEL_THEME[level];
          const avg = s.completed > 0 ? s.totalMs / s.completed : null;
          return (
            <li key={level} className="card flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-lg font-black">
                  <span className={`h-3 w-3 rounded-full ${theme.bg}`} aria-hidden="true" />
                  {LEVEL_LABELS[level]}
                </span>
                <span className="text-sm font-extrabold tabular-nums text-accent">
                  {summary[level].completed} màn · {summary[level].stars} sao
                </span>
              </div>
              <dl className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Nhanh nhất', value: s.bestMs === null ? '--:--' : formatTime(s.bestMs) },
                  { label: 'Trung bình', value: avg === null ? '--:--' : formatTime(avg) },
                  { label: 'Hoàn hảo', value: String(s.perfectRuns) },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-soft px-1 py-2">
                    <dd className="text-lg font-black leading-none tabular-nums">{value}</dd>
                    <dt className="mt-1 text-xs font-extrabold text-accent">{label}</dt>
                  </div>
                ))}
              </dl>
              <div className="h-2.5 overflow-hidden rounded-full bg-soft" role="img" aria-label={avg === null ? 'Chưa có dữ liệu thời gian' : `Thời gian trung bình ${formatTime(avg)}`}>
                <span
                  className={`block h-full rounded-full ${theme.bg}`}
                  style={{ width: avg === null ? 0 : `max(${(avg / slowestAvg) * 100}%, 0.5rem)` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-sm font-bold leading-snug text-accent">
        Thanh dưới mỗi cấp so sánh thời gian trung bình giữa các cấp. Thời gian trung bình và số hoàn hảo tính cả những lần chơi lại.
      </p>
    </main>
  );
}
