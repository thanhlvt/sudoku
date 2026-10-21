import { Check, ChevronLeft, ChevronRight, Flame, Snowflake } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import type { Level, Manifest } from '../core/types';
import {
  CALENDAR_MONTHS_BACK,
  addMonths,
  compareMonths,
  monthWeeks,
  yearMonthOf,
  type YearMonth,
} from '../game/calendar';
import { MAX_FREEZES, currentStreak, dailyPuzzle } from '../game/daily';
import type { DailyState } from '../storage/schema';
import { formatMonthName } from '../i18n/format';
import type { MessageKey } from '../i18n';
import { useI18n } from '../i18n/useI18n';
import { ScreenHeader } from './ScreenHeader';
import { LEVEL_THEME, levelLabel } from './levelLabels';
import { useSavedProgress } from './hooks/useSavedProgress';

interface CalendarScreenProps {
  manifest: Manifest | null;
  daily: DailyState;
  today: string;
  onNavigate: (hash: string) => void;
  onBack: () => void;
}

/** Monday first, matching `monthWeeks`. */
const WEEKDAYS: readonly MessageKey[] = [
  'calendar.weekday.1',
  'calendar.weekday.2',
  'calendar.weekday.3',
  'calendar.weekday.4',
  'calendar.weekday.5',
  'calendar.weekday.6',
  'calendar.weekday.7',
];

export function CalendarScreen({ manifest, daily, today, onNavigate, onBack }: CalendarScreenProps): JSX.Element {
  const { t, intlLocale } = useI18n();
  const { byId } = useSavedProgress();
  const current = yearMonthOf(today);
  const earliest = addMonths(current, -CALENDAR_MONTHS_BACK);
  const [shown, setShown] = useState<YearMonth>(current);

  const countOf = useMemo(() => {
    const counts = new Map<Level, number>((manifest?.levels ?? []).map((l) => [l.level, l.count]));
    return (level: Level): number => counts.get(level) ?? 0;
  }, [manifest]);

  const weeks = useMemo(() => monthWeeks(shown), [shown]);
  const streak = currentStreak(daily, today);

  // Days of this month that can be played (today or earlier) and how many of those are done.
  let playable = 0;
  let done = 0;
  const dayInfo = new Map<string, { id: string; level: Level; done: boolean }>();
  if (manifest) {
    for (const key of weeks.flat()) {
      if (!key || key > today) continue;
      const { id, level } = dailyPuzzle(key, countOf);
      const isDone = byId.get(id)?.status === 'completed';
      dayInfo.set(key, { id, level, done: isDone });
      playable++;
      if (isDone) done++;
    }
  }

  const monthName = formatMonthName(shown.month, intlLocale);
  const canGoBack = compareMonths(shown, earliest) > 0;
  const canGoForward = compareMonths(shown, current) < 0;

  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pb-8 pt-5">
      <ScreenHeader title={t('calendar.title')} onBack={onBack} />

      <section className="grid grid-cols-3 gap-3" aria-label={t('calendar.streaksAria')}>
        <div className="card flex animate-screen-in flex-col gap-1 p-3 text-center">
          <Flame size={22} strokeWidth={2.5} className="mx-auto fill-orange-500 text-orange-500" aria-hidden="true" />
          <span className="text-2xl font-black leading-none tabular-nums">{streak}</span>
          <span className="text-sm font-bold text-accent">{t('calendar.current')}</span>
        </div>
        <div className="card flex animate-screen-in flex-col gap-1 p-3 text-center" style={{ animationDelay: '60ms' }}>
          <Flame size={22} strokeWidth={2.5} className="mx-auto text-accent" aria-hidden="true" />
          <span className="text-2xl font-black leading-none tabular-nums">{daily.longest}</span>
          <span className="text-sm font-bold text-accent">{t('calendar.longest')}</span>
        </div>
        <div className="card flex animate-screen-in flex-col gap-1 p-3 text-center" style={{ animationDelay: '120ms' }}>
          <Snowflake size={22} strokeWidth={2.5} className="mx-auto text-sky-500" aria-hidden="true" />
          <span className="text-2xl font-black leading-none tabular-nums">
            {daily.freezes}/{MAX_FREEZES}
          </span>
          <span className="text-sm font-bold text-accent">{t('calendar.freezes')}</span>
        </div>
      </section>
      <p className="-mt-1 text-sm font-bold leading-snug text-accent">
        {t('calendar.freezeHint')}
      </p>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShown((m) => addMonths(m, -1))}
          disabled={!canGoBack}
          aria-label={t('calendar.prevMonth')}
          className="btn btn-white btn-icon !h-11 !w-11 !rounded-xl"
        >
          <ChevronLeft size={24} strokeWidth={3.25} aria-hidden="true" className="text-accent" />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-black" aria-live="polite">
            {t('calendar.month', { month: shown.month, monthName, year: shown.year })}
          </h2>
          {manifest && (
            <p className="text-sm font-bold text-accent">
              {t('calendar.progress', { done, playable })}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShown((m) => addMonths(m, 1))}
          disabled={!canGoForward}
          aria-label={t('calendar.nextMonth')}
          className="btn btn-white btn-icon !h-11 !w-11 !rounded-xl"
        >
          <ChevronRight size={24} strokeWidth={3.25} aria-hidden="true" className="text-accent" />
        </button>
      </div>

      <div role="grid" aria-label={t('calendar.gridAria', { month: shown.month, monthName, year: shown.year })} className="flex flex-col gap-1.5">
        <div role="row" className="grid grid-cols-7 gap-1.5 text-center text-xs font-extrabold uppercase text-accent">
          {WEEKDAYS.map((w) => (
            <span key={w} role="columnheader">
              {t(w)}
            </span>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} role="row" className="grid grid-cols-7 gap-1.5">
            {week.map((key, di) => {
              if (!key) return <span key={di} role="gridcell" aria-hidden="true" />;
              const day = Number(key.slice(8));
              const info = dayInfo.get(key);
              const isToday = key === today;
              if (!info) {
                // Future day, or the bank has not loaded yet.
                return (
                  <span
                    key={key}
                    role="gridcell"
                    aria-label={t('calendar.dayAria', { day })}
                    className="flex aspect-square items-center justify-center rounded-xl text-base font-extrabold text-accent/40"
                  >
                    {day}
                  </span>
                );
              }
              const theme = LEVEL_THEME[info.level];
              const label = t(isToday ? 'calendar.dayStateTodayAria' : 'calendar.dayStateAria', {
                day,
                level: levelLabel(info.level, t),
                state: t(info.done ? 'common.done' : 'common.notDone'),
              });
              const style: CSSProperties = info.done
                ? ({ '--btn-bg': '34 197 94', '--btn-edge': '21 128 61', '--btn-fg': '255 255 255' } as CSSProperties)
                : {};
              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  onClick={() => onNavigate(`#/play/${info.id}`)}
                  aria-label={label}
                  className={`btn aspect-square flex-col !gap-0.5 !rounded-xl !px-0 !text-base ${
                    info.done ? '' : 'btn-white'
                  } ${isToday ? 'ring-[3px] ring-orange-500 ring-offset-2 ring-offset-page' : ''}`}
                  style={style}
                >
                  {info.done ? (
                    <Check size={18} strokeWidth={4} aria-hidden="true" />
                  ) : (
                    <span className="leading-none">{day}</span>
                  )}
                  <span className={`h-1.5 w-1.5 rounded-full ${info.done ? 'bg-white/80' : theme.bg}`} aria-hidden="true" />
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs font-bold text-accent" aria-label={t('calendar.legendAria')}>
        {(['easy', 'medium', 'hard', 'expert'] as const).map((level) => (
          <li key={level} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${LEVEL_THEME[level].bg}`} aria-hidden="true" />
            {levelLabel(level, t)}
          </li>
        ))}
      </ul>
      <p className="text-center text-sm font-bold text-accent">{t('calendar.footnote')}</p>
    </main>
  );
}
