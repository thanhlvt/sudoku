import { Check, Clock, Flame, Heart, Play, Settings as SettingsIcon, Star } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import type { Level, Manifest } from '../core/types';
import { currentStreak, isDailyDone } from '../game/daily';
import { heartsLeft, pickNextIndex, summarizeByLevel } from '../game/progress';
import { levelFromPuzzleId, puzzleIdOf } from '../game/puzzleBank';
import type { DailyState, Settings, Stats } from '../storage/schema';
import { SettingsSheet } from './SettingsSheet';
import { formatTime } from './Timer';
import { LEVEL_LABELS, LEVEL_THEME } from './levelLabels';
import { useSavedProgress } from './hooks/useSavedProgress';

interface HomeScreenProps {
  manifest: Manifest | null;
  stats: Stats;
  daily: DailyState;
  today: string;
  dailyId: string | null;
  settings: Settings;
  onSettingsChange: (patch: Partial<Settings>) => void;
  onNavigate: (hash: string) => void;
}

/** Entrance animation staggered by position, so the screen builds top to bottom. */
function stagger(i: number): CSSProperties {
  return { animationDelay: `${i * 60}ms` };
}

function Logo(): JSX.Element {
  const tiles = ['#22C55E', '#FFFFFF', '#F97316', '#0EA5E9', '#A78BFA', '#FFFFFF', '#FFFFFF', '#FACC15', '#F43F5E'];
  return (
    <svg width="48" height="48" viewBox="0 0 56 56" aria-hidden="true" className="shrink-0">
      <rect width="56" height="56" rx="14" fill="#312E81" />
      {tiles.map((fill, i) => (
        <rect key={i} x={7 + (i % 3) * 14} y={7 + Math.floor(i / 3) * 14} width="12" height="12" rx="3.5" fill={fill} />
      ))}
    </svg>
  );
}

export function HomeScreen({
  manifest,
  stats,
  daily,
  today,
  dailyId,
  settings,
  onSettingsChange,
  onNavigate,
}: HomeScreenProps): JSX.Element {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { games, byId, last } = useSavedProgress();
  const summary = useMemo(() => summarizeByLevel(games), [games]);

  const streak = currentStreak(daily, today);
  const dailyDone = isDailyDone(daily, today);
  const totalSolved = Object.values(summary).reduce((n, s) => n + s.completed, 0);
  const totalStars = Object.values(summary).reduce((n, s) => n + s.stars, 0);
  const bestMs = Object.values(stats).reduce<number | null>(
    (best, s) => (s.bestMs !== null && (best === null || s.bestMs < best) ? s.bestMs : best),
    null,
  );

  const resume = useMemo(() => {
    if (!manifest) return null;
    const lastGame = last ? byId.get(last.puzzleId) : undefined;
    let id: string;
    let label: string;
    if (last && lastGame?.status === 'in-progress') {
      id = last.puzzleId;
      label = 'Chơi tiếp';
    } else {
      const level: Level = last ? levelFromPuzzleId(last.puzzleId) : 'beginner';
      const count = manifest.levels.find((l) => l.level === level)?.count ?? 1;
      id = puzzleIdOf(level, pickNextIndex(level, count, byId));
      label = last ? 'Màn tiếp theo' : 'Bắt đầu chơi';
    }
    const level = levelFromPuzzleId(id);
    const number = Number(id.slice(id.lastIndexOf('-') + 1));
    return { id, label, title: `${LEVEL_LABELS[level]} · Màn ${number}`, game: byId.get(id) };
  }, [manifest, last, byId]);

  const [, month, day] = today.split('-');

  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pb-8 pt-5">
      <header className="flex animate-screen-in items-center gap-2.5">
        <Logo />
        <div className="min-w-0 flex-1">
          <h1 className="text-[1.9rem] font-black leading-none">Sudoku</h1>
          <p className="mt-1 whitespace-nowrap text-[0.95rem] font-bold text-accent">Rèn trí não mỗi ngày</p>
        </div>
        <div
          className="card flex h-11 items-center gap-1 !rounded-full px-3 text-lg font-black text-orange-700 dark:text-orange-300"
          aria-label={`Chuỗi ${streak} ngày`}
        >
          <Flame
            size={22}
            strokeWidth={2.5}
            aria-hidden="true"
            className={streak > 0 ? 'animate-flame fill-orange-500 text-orange-500' : 'text-accent/40'}
          />
          {streak}
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Cài đặt"
          className="btn btn-white btn-icon !h-11 !w-11 !rounded-2xl"
        >
          <SettingsIcon size={24} strokeWidth={2.5} aria-hidden="true" className="text-accent" />
        </button>
      </header>

      {resume && (
        <button
          type="button"
          onClick={() => onNavigate(`#/play/${resume.id}`)}
          className="btn btn-primary animate-screen-in relative !h-auto w-full justify-between gap-3 overflow-hidden !rounded-[1.75rem] px-5 py-5 text-left"
          style={stagger(1)}
        >
          <span aria-hidden="true" className="absolute -right-6 top-0 h-full w-28 skew-x-[-18deg] bg-white/10" />
          <span className="relative flex min-w-0 flex-col gap-2">
            <span className="text-sm font-black uppercase tracking-wider text-white/85">{resume.label}</span>
            <span className="text-[1.4rem] font-black leading-tight">{resume.title}</span>
            {resume.game && (
              <span className="mt-1 flex gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-base font-extrabold tabular-nums">
                  <Clock size={16} strokeWidth={3} aria-hidden="true" />
                  {formatTime(resume.game.elapsedMs)}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-base font-extrabold">
                  <Heart size={16} strokeWidth={3} className="fill-white" aria-hidden="true" />
                  {heartsLeft(resume.game.mistakes)}
                </span>
              </span>
            )}
          </span>
          <span
            className="cta-ring relative flex h-[3.75rem] w-[3.75rem] shrink-0 animate-float items-center justify-center rounded-full bg-white text-primary shadow-[0_4px_0_0_#DDD6FE]"
            style={{ '--ring': '255 255 255' } as CSSProperties}
            aria-hidden="true"
          >
            <Play size={30} strokeWidth={0} className="ml-1 fill-primary" />
          </span>
        </button>
      )}

      {manifest && dailyId && (
        <section
          className="flex animate-screen-in items-center gap-3 rounded-[1.5rem] bg-orange-50 p-4 shadow-[0_4px_0_0_#FED7AA] dark:bg-[#3A2417] dark:shadow-[0_4px_0_0_#5C3A22]"
          style={stagger(2)}
          aria-label="Thử thách hôm nay"
        >
          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-orange-500 text-white">
            <span className="text-xs font-black leading-none">TH{Number(month)}</span>
            <span className="text-3xl font-black leading-none">{Number(day)}</span>
          </div>
          <div className="min-w-0 flex-1 text-orange-950 dark:text-orange-50">
            <h2 className="text-[1.05rem] font-black leading-tight">Thử thách hôm nay</h2>
            <p className="mt-0.5 text-sm font-bold leading-snug text-orange-800 dark:text-orange-200">
              {dailyDone ? 'Đã hoàn thành hôm nay' : 'Hoàn thành để giữ chuỗi'}
              {' '}
              <Flame size={14} className="inline -translate-y-px fill-orange-500 text-orange-500" aria-hidden="true" />{' '}
              {streak} ngày
            </p>
          </div>
          {dailyDone ? (
            <span
              className="flex h-11 w-11 shrink-0 animate-pop-in items-center justify-center rounded-full bg-emerald-500 text-white"
              role="img"
              aria-label="Đã hoàn thành"
            >
              <Check size={24} strokeWidth={3.5} aria-hidden="true" />
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate(`#/play/${dailyId}`)}
              className="btn btn-orange cta-ring min-h-11 shrink-0 px-4 text-lg"
            >
              Chơi
            </button>
          )}
        </section>
      )}

      <section className="grid grid-cols-3 gap-3" aria-label="Thống kê">
        {[
          { icon: Check, chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300', value: String(totalSolved), label: 'Đã giải' },
          { icon: Star, chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300', value: String(totalStars), label: 'Sao' },
          { icon: Clock, chip: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300', value: bestMs === null ? '--:--' : formatTime(bestMs), label: 'Kỷ lục' },
        ].map(({ icon: Icon, chip, value, label }, i) => (
          <div key={label} className="card animate-screen-in flex flex-col gap-2 p-4" style={stagger(3 + i)}>
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${chip}`}>
              <Icon size={20} strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="text-[1.65rem] font-black leading-none tabular-nums">{value}</span>
            <span className="text-base font-bold text-accent">{label}</span>
          </div>
        ))}
      </section>

      <h2 className="mt-1 text-2xl font-black">Chọn độ khó</h2>
      <div className="flex flex-col gap-3">
        {(manifest?.levels ?? []).map(({ level, count }, i) => {
          const theme = LEVEL_THEME[level];
          const done = summary[level].completed;
          const pct = (done / Math.max(1, count)) * 100;
          return (
            <button
              key={level}
              type="button"
              onClick={() => onNavigate(`#/level/${level}`)}
              aria-label={`${LEVEL_LABELS[level]}, đã xong ${done} trên ${count} màn`}
              className="btn btn-white animate-screen-in w-full justify-start gap-4 !rounded-3xl p-4 text-left"
              style={stagger(6 + i)}
            >
              <span
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-[0_4px_0_0_var(--edge)] ${theme.bg}`}
                style={{ '--edge': `rgb(${theme.edgeRgb})` } as CSSProperties}
                aria-hidden="true"
              >
                {theme.n}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-2.5">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-xl font-black">{LEVEL_LABELS[level]}</span>
                  <span className="text-base font-extrabold tabular-nums text-accent">
                    {done}/{count}
                  </span>
                </span>
                <span className="h-3 overflow-hidden rounded-full bg-soft">
                  <span
                    className="block h-full animate-bar-grow rounded-full bg-emerald-500"
                    style={{ width: done > 0 ? `max(${pct}%, 0.75rem)` : 0 }}
                  />
                </span>
              </span>
            </button>
          );
        })}
        {!manifest && <p className="py-6 text-center text-base font-bold text-accent">Đang tải danh sách cấp độ...</p>}
      </div>

      {settingsOpen && (
        <SettingsSheet settings={settings} onChange={onSettingsChange} onClose={() => setSettingsOpen(false)} />
      )}
    </main>
  );
}
