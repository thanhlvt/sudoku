import { ArrowRight, Flame, Star, Trophy } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { Level } from '../core/types';
import { Confetti } from './Confetti';
import { formatTime } from './Timer';
import { LEVEL_LABELS } from './levelLabels';

interface CompletionScreenProps {
  level: Level;
  puzzleNumber: number;
  stars: number;
  elapsedMs: number;
  mistakes: number;
  hintsUsed: number;
  isNewRecord: boolean;
  /** Current daily-challenge streak when this puzzle was today's challenge, otherwise null. */
  dailyStreak: number | null;
  hasNext: boolean;
  onNext: () => void;
  onReplay: () => void;
  onList: () => void;
}

// Left / middle / right: the middle star is bigger and sits higher, like a podium.
const STAR_SLOTS = [
  { size: 52, lift: 'translate-y-6 -rotate-12' },
  { size: 76, lift: '-translate-y-1' },
  { size: 52, lift: 'translate-y-6 rotate-12' },
] as const;

export function CompletionScreen({
  level,
  puzzleNumber,
  stars,
  elapsedMs,
  mistakes,
  hintsUsed,
  isNewRecord,
  dailyStreak,
  hasNext,
  onNext,
  onReplay,
  onList,
}: CompletionScreenProps): JSX.Element {
  const primaryRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    primaryRef.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-title"
      className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-night"
    >
      <div className="relative flex flex-1 flex-col items-center justify-center pb-6">
        <Confetti />
        <div className="relative flex items-end gap-2" role="img" aria-label={`${stars} trên 3 sao`}>
          {STAR_SLOTS.map(({ size, lift }, i) => (
            <span key={i} className={`block ${lift}`}>
              <Star
                size={size}
                strokeWidth={2.5}
                aria-hidden="true"
                className={`animate-star-pop ${i < stars ? 'fill-amber-400 text-amber-600' : 'fill-indigo-500/50 text-indigo-300'}`}
                style={{ animationDelay: `${0.45 + i * 0.22}s` }}
              />
            </span>
          ))}
        </div>
        <div className="relative mt-5 flex h-28 w-28 animate-trophy-drop items-center justify-center rounded-full bg-amber-400 shadow-[0_6px_0_0_#B45309]">
          <Trophy size={56} strokeWidth={2.25} className="text-amber-900" aria-hidden="true" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-md animate-sheet-up rounded-t-[2rem] bg-card px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7 [animation-delay:0.15s]">
        <h2 id="completion-title" className="text-center text-[2.5rem] font-black leading-none text-primary-dark dark:text-violet-300">
          Tuyệt vời!
        </h2>
        <p className="mt-2 text-center text-lg font-extrabold text-accent">
          {LEVEL_LABELS[level]} · Màn {puzzleNumber} · {stars}/3 sao
        </p>

        <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Thời gian', value: formatTime(elapsedMs), tone: 'bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100' },
            { label: 'Lỗi', value: String(mistakes), tone: 'bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100' },
            { label: 'Gợi ý', value: String(hintsUsed), tone: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100' },
          ].map(({ label, value, tone }, i) => (
            <div
              key={label}
              className={`relative animate-pop-in rounded-2xl px-2 pb-3 pt-4 ${tone}`}
              style={{ animationDelay: `${0.5 + i * 0.1}s` }}
            >
              {label === 'Thời gian' && isNewRecord && (
                <span className="absolute inset-x-0 -top-3 flex justify-center">
                  <span className="animate-badge-wobble whitespace-nowrap rounded-full bg-emerald-700 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-wide text-white">
                    Kỷ lục mới
                  </span>
                </span>
              )}
              <dd className="text-[1.75rem] font-black leading-none tabular-nums">{value}</dd>
              <dt className="mt-1.5 text-base font-extrabold">{label}</dt>
            </div>
          ))}
        </dl>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-base font-extrabold text-accent">
          {dailyStreak !== null ? (
            <>
              <Flame size={18} className="fill-orange-500 text-orange-500" aria-hidden="true" />
              Chuỗi thử thách {dailyStreak} ngày
            </>
          ) : stars < 3 ? (
            <>
              Không mắc lỗi nào để nhận đủ 3 sao
              <Star size={16} strokeWidth={3} aria-hidden="true" />
            </>
          ) : (
            'Hoàn hảo! Bạn không mắc lỗi nào.'
          )}
        </p>

        <button
          ref={primaryRef}
          type="button"
          onClick={hasNext ? onNext : onList}
          className="btn btn-primary cta-ring cta-shine mt-4 min-h-16 w-full text-xl"
        >
          {hasNext ? 'Màn tiếp theo' : 'Danh sách màn'}
          <ArrowRight size={24} strokeWidth={3} aria-hidden="true" />
        </button>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button type="button" onClick={onReplay} className="btn btn-soft min-h-14 whitespace-nowrap !px-3 text-base">
            Chơi lại
          </button>
          {hasNext && (
            <button type="button" onClick={onList} className="btn btn-soft min-h-14 whitespace-nowrap !px-3 text-base">
              Danh sách màn
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
