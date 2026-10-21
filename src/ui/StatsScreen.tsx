import { Check, Clock, Lightbulb, Star, X, type LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { LEVELS } from '../core/levels';
import { summarizeByLevel } from '../game/progress';
import type { Stats } from '../storage/schema';
import { useI18n } from '../i18n/useI18n';
import type { Translate } from '../i18n';
import { ScreenHeader } from './ScreenHeader';
import { formatTime } from './Timer';
import { LEVEL_THEME, levelLabel } from './levelLabels';
import { useSavedProgress } from './hooks/useSavedProgress';

interface StatsScreenProps {
  stats: Stats;
  onBack: () => void;
}

function formatDuration(ms: number, t: Translate): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return t('stats.minutes', { count: minutes });
  return t('stats.hoursMinutes', { hours: Math.floor(minutes / 60), minutes: minutes % 60 });
}

interface Tile {
  icon: LucideIcon;
  chip: string;
  value: string;
  label: string;
}

export function StatsScreen({ stats, onBack }: StatsScreenProps): JSX.Element {
  const { t } = useI18n();
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
    { icon: Check, chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300', value: String(totals.solved), label: t('stats.solved') },
    { icon: Star, chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300', value: String(totalStars), label: t('stats.stars') },
    { icon: Clock, chip: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300', value: formatDuration(totals.timeMs, t), label: t('stats.time') },
    { icon: Check, chip: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300', value: String(totals.flawless), label: t('stats.flawless') },
    { icon: X, chip: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300', value: String(totals.mistakes), label: t('stats.mistakes') },
    { icon: Lightbulb, chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300', value: String(totals.hints), label: t('stats.hints') },
  ];

  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pb-8 pt-5">
      <ScreenHeader title={t('stats.title')} onBack={onBack} />

      <section className="grid grid-cols-2 gap-3" aria-label={t('stats.overviewAria')}>
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

      <h2 className="mt-1 text-xl font-black">{t('stats.byLevel')}</h2>
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
                  {levelLabel(level, t)}
                </span>
                <span className="text-sm font-extrabold tabular-nums text-accent">
                  {t('stats.levelSummary', { solved: summary[level].completed, stars: summary[level].stars })}
                </span>
              </div>
              <dl className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: t('stats.best'), value: s.bestMs === null ? '--:--' : formatTime(s.bestMs) },
                  { label: t('stats.average'), value: avg === null ? '--:--' : formatTime(avg) },
                  { label: t('stats.perfect'), value: String(s.perfectRuns) },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-soft px-1 py-2">
                    <dd className="text-lg font-black leading-none tabular-nums">{value}</dd>
                    <dt className="mt-1 text-xs font-extrabold text-accent">{label}</dt>
                  </div>
                ))}
              </dl>
              <div className="h-2.5 overflow-hidden rounded-full bg-soft" role="img" aria-label={avg === null ? t('stats.noTimeAria') : t('stats.avgAria', { time: formatTime(avg) })}>
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
        {t('stats.note')}
      </p>
    </main>
  );
}
