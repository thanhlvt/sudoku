import { Check, Hourglass, Play, Target } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import { LEVELS } from '../core/levels';
import type { Level, Manifest } from '../core/types';
import { MODE_INFO, MODE_XP_MULTIPLIER, TIME_LIMIT_MS } from '../game/modes';
import { pickFreshIndex } from '../game/progress';
import { puzzleIdOf } from '../game/puzzleBank';
import { WEEKLY_BONUS_XP, weekEndKey, weeklyProgress, type WeeklyWeek } from '../game/weekly';
import { loadWeekly, type GameMode } from '../storage/schema';
import { ScreenHeader } from './ScreenHeader';
import { formatTime } from './Timer';
import { LEVEL_LABELS, LEVEL_THEME } from './levelLabels';
import { useSavedProgress } from './hooks/useSavedProgress';

interface ModesScreenProps {
  manifest: Manifest | null;
  weekly: WeeklyWeek | null;
  onNavigate: (hash: string) => void;
  onBack: () => void;
}

function dayMonth(key: string): string {
  return `${Number(key.slice(8))}/${Number(key.slice(5, 7))}`;
}

const DONE_STYLE = { '--btn-bg': '34 197 94', '--btn-edge': '21 128 61', '--btn-fg': '255 255 255' } as CSSProperties;

export function ModesScreen({ manifest, weekly, onNavigate, onBack }: ModesScreenProps): JSX.Element {
  const { games, byId } = useSavedProgress();
  const [message, setMessage] = useState<string | null>(null);

  const counts = useMemo(() => new Map<Level, number>((manifest?.levels ?? []).map((l) => [l.level, l.count])), [manifest]);

  const steps = useMemo(() => {
    if (!weekly) return null;
    const done = weeklyProgress(weekly.key, weekly.ids.map((id) => ({ id })), games);
    return weekly.ids.map((id, i) => ({ id, done: done[i]!, level: id.slice(0, id.lastIndexOf('-')) as Level }));
  }, [weekly, games]);
  const doneCount = steps?.filter((s) => s.done).length ?? 0;
  const weeksFinished = loadWeekly().done.length;
  const weekFinished = weekly !== null && loadWeekly().done.includes(weekly.key);
  const nextStep = steps?.find((s) => !s.done);

  const wins = (mode: GameMode): number => games.filter((g) => g.status === 'completed' && g.mode === mode).length;

  function start(mode: GameMode, level: Level): void {
    const fresh = pickFreshIndex(level, counts.get(level) ?? 0, byId);
    if (fresh === null) {
      setMessage(`Bạn đã chơi hết các màn cấp ${LEVEL_LABELS[level]}. Hãy thử cấp khác.`);
      return;
    }
    setMessage(null);
    onNavigate(`#/play/${puzzleIdOf(level, fresh)}/${mode}`);
  }

  const modeCards: { mode: GameMode; icon: typeof Hourglass; chip: string }[] = [
    { mode: 'time', icon: Hourglass, chip: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300' },
    { mode: 'perfect', icon: Target, chip: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' },
  ];

  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pb-8 pt-5">
      <ScreenHeader title="Chế độ thử thách" onBack={onBack} />

      <section className="card flex animate-screen-in flex-col gap-4 p-4" aria-label="Chuỗi thử thách tuần">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Chuỗi thử thách tuần</h2>
            <p className="text-sm font-bold text-accent">
              {weekly ? `Tuần ${dayMonth(weekly.key)} – ${dayMonth(weekEndKey(weekly.key))}` : 'Đang tải...'} · năm màn, tăng dần độ khó
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-sm font-black tabular-nums text-white">{doneCount}/5</span>
        </div>

        <ol className="grid grid-cols-5 gap-2" aria-label="Các màn trong tuần">
          {(steps ?? Array.from({ length: 5 }, () => null)).map((step, i) => {
            if (!step) return <li key={i} className="aspect-square animate-pulse rounded-2xl bg-soft" aria-hidden="true" />;
            const theme = LEVEL_THEME[step.level];
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(`#/play/${step.id}`)}
                  aria-label={`Bước ${i + 1}, ${LEVEL_LABELS[step.level]}, ${step.done ? 'đã xong' : 'chưa làm'}`}
                  className={`btn aspect-square w-full flex-col !gap-1 !rounded-2xl !px-0 text-lg ${step.done ? '' : 'btn-white'}`}
                  style={step.done ? DONE_STYLE : undefined}
                >
                  {step.done ? <Check size={22} strokeWidth={4} aria-hidden="true" /> : <span className="leading-none">{i + 1}</span>}
                  <span className={`h-1.5 w-1.5 rounded-full ${step.done ? 'bg-white/80' : theme.bg}`} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ol>

        {weekFinished ? (
          <p className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-100 px-3 py-3 text-base font-extrabold text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100">
            <Check size={20} strokeWidth={4} aria-hidden="true" />
            Bạn đã hoàn thành tuần này
          </p>
        ) : (
          <button
            type="button"
            disabled={!nextStep}
            onClick={() => nextStep && onNavigate(`#/play/${nextStep.id}`)}
            className="btn btn-primary cta-ring min-h-14 w-full text-lg"
          >
            <Play size={20} strokeWidth={0} className="fill-white" aria-hidden="true" />
            {doneCount === 0 ? 'Bắt đầu chuỗi tuần' : 'Làm màn tiếp theo'}
          </button>
        )}
        <p className="text-sm font-bold leading-snug text-accent">
          Giải đủ cả năm màn trong tuần (tính từ thứ Hai) để nhận thêm {WEEKLY_BONUS_XP} XP. Bạn đã hoàn thành {weeksFinished} tuần.
        </p>
      </section>

      {modeCards.map(({ mode, icon: Icon, chip }, n) => (
        <section
          key={mode}
          className="card flex animate-screen-in flex-col gap-3 p-4"
          style={{ animationDelay: `${(n + 1) * 70}ms` }}
          aria-label={MODE_INFO[mode].label}
        >
          <div className="flex items-start gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${chip}`}>
              <Icon size={24} strokeWidth={2.75} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black leading-tight">{MODE_INFO[mode].label}</h2>
              <p className="text-sm font-bold leading-snug text-accent">
                {MODE_INFO[mode].rule} Thưởng thêm {Math.round((MODE_XP_MULTIPLIER - 1) * 100)}% XP.
              </p>
            </div>
            <span className="shrink-0 text-sm font-extrabold tabular-nums text-accent">Thắng {wins(mode)}</span>
          </div>
          <div className="grid grid-cols-5 gap-2" role="group" aria-label={`Chọn cấp cho ${MODE_INFO[mode].label}`}>
            {LEVELS.map((level) => {
              const theme = LEVEL_THEME[level];
              return (
                <button
                  key={level}
                  type="button"
                  disabled={!manifest}
                  onClick={() => start(mode, level)}
                  aria-label={`${MODE_INFO[mode].label}, cấp ${LEVEL_LABELS[level]}${
                    mode === 'time' ? `, ${formatTime(TIME_LIMIT_MS[level])}` : ''
                  }`}
                  className="btn min-h-[4.25rem] flex-col !gap-1 !rounded-2xl !px-0 text-white"
                  style={{ '--btn-bg': theme.rgb, '--btn-edge': theme.edgeRgb, '--btn-fg': '255 255 255' } as CSSProperties}
                >
                  <span className="text-xl leading-none">{theme.n}</span>
                  <span className="text-[0.7rem] font-extrabold leading-none opacity-90">
                    {mode === 'time' ? formatTime(TIME_LIMIT_MS[level]) : 'Chơi'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {message && (
        <p role="status" className="text-center text-base font-extrabold text-accent">
          {message}
        </p>
      )}
      <p className="text-center text-sm font-bold leading-snug text-accent">
        Mỗi lượt mở một màn bạn chưa chơi. Cấp 1 Mới bắt đầu · 2 Dễ · 3 Trung bình · 4 Khó · 5 Chuyên gia.
      </p>
    </main>
  );
}
