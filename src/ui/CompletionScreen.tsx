import { ArrowRight, ChevronRight, Flame, GraduationCap, Share2, Snowflake, Sparkles, Star, Trophy } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { Level } from '../core/types';
import { achievementText, type AchievementDef } from '../game/achievements';
import { MODE_INFO } from '../game/modes';
import type { MessageKey } from '../i18n';
import { useI18n } from '../i18n/useI18n';
import type { GameMode } from '../storage/schema';
import { AchievementIcon } from './AchievementIcon';
import { Confetti } from './Confetti';
import { formatTime } from './Timer';
import { levelLabel } from './levelLabels';

/** What finishing this puzzle earned beyond the result itself. Absent when a finished puzzle is merely reopened. */
export interface CompletionReward {
  xp: number;
  /** The player level reached, when this solve crossed a level. */
  levelUp: number | null;
  /** Catalog key of the name of a board palette that this level just unlocked. */
  paletteUnlocked: MessageKey | null;
  achievements: AchievementDef[];
  /** Streak length reached when it is a milestone (3, 7, 30...). */
  streakMilestone: number | null;
  freezeUsed: boolean;
  freezeEarned: boolean;
  /** The challenge mode this solve was played under, which pays +50% XP. */
  mode: GameMode | null;
  /** Progress of this week's challenge, when the puzzle is one of its five. */
  weekly: { done: number; total: number; bonusXp: number | null } | null;
}

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
  reward: CompletionReward | null;
  /** The hardest technique this puzzle needs, when known, with a link to its lesson. */
  technique: { label: string; onLearn: () => void } | null;
  /** Feedback after sharing, e.g. "Result copied". */
  shareNote: string | null;
  onShare: () => void;
  hasNext: boolean;
  /** Label for the main button; defaults to "Next puzzle". */
  nextLabel?: string;
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
  reward,
  technique,
  shareNote,
  onShare,
  hasNext,
  nextLabel,
  onNext,
  onReplay,
  onList,
}: CompletionScreenProps): JSX.Element {
  const { t } = useI18n();
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
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden pb-6">
        <Confetti />
        <div className="relative flex items-end gap-2" role="img" aria-label={t('common.starsOf', { count: stars, total: 3 })}>
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

      <div className="mx-auto max-h-[80dvh] w-full max-w-md animate-sheet-up overflow-y-auto rounded-t-[2rem] bg-card px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7 [animation-delay:0.15s]">
        <h2 id="completion-title" className="text-center text-[2.5rem] font-black leading-none text-primary-dark dark:text-violet-300">
          {t('completion.title')}
        </h2>
        <p className="mt-2 text-center text-lg font-extrabold text-accent">
          {t('completion.subtitle', { level: levelLabel(level, t), n: puzzleNumber, stars })}
        </p>

        <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[
            { id: 'time', label: t('completion.time'), value: formatTime(elapsedMs), tone: 'bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100' },
            { id: 'mistakes', label: t('completion.mistakes'), value: String(mistakes), tone: 'bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100' },
            { id: 'hints', label: t('completion.hints'), value: String(hintsUsed), tone: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100' },
          ].map(({ id, label, value, tone }, i) => (
            <div
              key={id}
              className={`relative animate-pop-in rounded-2xl px-2 pb-3 pt-4 ${tone}`}
              style={{ animationDelay: `${0.5 + i * 0.1}s` }}
            >
              {id === 'time' && isNewRecord && (
                <span className="absolute inset-x-0 -top-3 flex justify-center">
                  <span className="animate-badge-wobble whitespace-nowrap rounded-full bg-emerald-700 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-wide text-white">
                    {t('completion.newRecord')}
                  </span>
                </span>
              )}
              <dd className="text-[1.75rem] font-black leading-none tabular-nums">{value}</dd>
              <dt className="mt-1.5 text-base font-extrabold">{label}</dt>
            </div>
          ))}
        </dl>

        {reward && (
          <ul className="mt-3 flex flex-col gap-1.5" aria-label={t('completion.rewardsAria')}>
            <li className="flex animate-pop-in items-center justify-center gap-2 text-base font-extrabold text-primary-dark [animation-delay:0.8s] dark:text-violet-300">
              <Sparkles size={18} strokeWidth={2.75} aria-hidden="true" />+{reward.xp} XP
              {reward.levelUp !== null && (
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-sm font-black text-white">{t('completion.levelUp', { level: reward.levelUp })}</span>
              )}
            </li>
            {reward.mode && (
              <li className="text-center text-sm font-extrabold text-accent">
                {t('completion.modeBonus', { mode: t(MODE_INFO[reward.mode].labelKey) })}
              </li>
            )}
            {reward.weekly && (
              <li className="flex items-center justify-center gap-2 text-base font-extrabold text-primary-dark dark:text-violet-300">
                {t('completion.weekly', { done: reward.weekly.done, total: reward.weekly.total })}
                {reward.weekly.bonusXp !== null && (
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-sm font-black text-white">
                    {t('completion.weeklyDone', { xp: reward.weekly.bonusXp })}
                  </span>
                )}
              </li>
            )}
            {reward.paletteUnlocked && (
              <li className="text-center text-sm font-extrabold text-accent">{t('completion.palette', { name: t(reward.paletteUnlocked) })}</li>
            )}
            {reward.streakMilestone !== null && (
              <li className="flex animate-pop-in items-center justify-center gap-2 rounded-2xl bg-orange-100 px-3 py-2 text-base font-black text-orange-900 [animation-delay:0.9s] dark:bg-orange-900/40 dark:text-orange-100">
                <Flame size={20} className="fill-orange-500 text-orange-500" aria-hidden="true" />
                {t('completion.streakMilestone', { count: reward.streakMilestone })}
              </li>
            )}
            {reward.freezeUsed && (
              <li className="flex items-center justify-center gap-2 text-sm font-extrabold text-sky-700 dark:text-sky-300">
                <Snowflake size={16} aria-hidden="true" />
                {t('completion.freezeUsed')}
              </li>
            )}
            {reward.freezeEarned && (
              <li className="flex items-center justify-center gap-2 text-sm font-extrabold text-sky-700 dark:text-sky-300">
                <Snowflake size={16} aria-hidden="true" />
                {t('completion.freezeEarned')}
              </li>
            )}
            {reward.achievements.map((a, i) => (
              <li
                key={a.id}
                className="flex animate-pop-in items-center gap-2.5 rounded-2xl bg-amber-100 px-2.5 py-1.5 text-amber-950 dark:bg-amber-900/40 dark:text-amber-50"
                style={{ animationDelay: `${1 + i * 0.12}s` }}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-amber-950">
                  <AchievementIcon name={a.icon} size={18} />
                </span>
                <span className="min-w-0 truncate text-base font-black leading-tight">
                  <span className="mr-1.5 text-xs font-extrabold uppercase tracking-wide opacity-70">{t('completion.newAchievement')}</span>
                  {achievementText(a.id, t).title}
                </span>
              </li>
            ))}
          </ul>
        )}

        {technique && (
          <button
            type="button"
            onClick={technique.onLearn}
            aria-label={t('completion.techniqueAria', { label: technique.label })}
            className="mx-auto mt-3 flex max-w-full items-center gap-2 rounded-full bg-soft px-4 py-1.5 text-sm font-extrabold text-accent"
          >
            <GraduationCap size={18} strokeWidth={2.75} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{t('completion.technique', { label: technique.label })}</span>
            <ChevronRight size={16} strokeWidth={3.5} className="shrink-0" aria-hidden="true" />
          </button>
        )}

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-base font-extrabold text-accent">
          {dailyStreak !== null ? (
            <>
              <Flame size={18} className="fill-orange-500 text-orange-500" aria-hidden="true" />
              {t('completion.dailyStreak', { count: dailyStreak })}
            </>
          ) : stars < 3 ? (
            <>
              {t('completion.needNoMistakes')}
              <Star size={16} strokeWidth={3} aria-hidden="true" />
            </>
          ) : (
            t('completion.perfect')
          )}
        </p>

        <button
          ref={primaryRef}
          type="button"
          onClick={hasNext ? onNext : onList}
          className="btn btn-primary cta-ring cta-shine mt-4 min-h-16 w-full text-xl"
        >
          {hasNext ? (nextLabel ?? t('completion.nextPuzzle')) : t('completion.levelList')}
          <ArrowRight size={24} strokeWidth={3} aria-hidden="true" />
        </button>
        <div className={`mt-3 grid gap-3 ${hasNext ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <button type="button" onClick={onReplay} className="btn btn-soft min-h-14 whitespace-nowrap !px-2 text-base">
            {t('completion.replay')}
          </button>
          {hasNext && (
            <button type="button" onClick={onList} className="btn btn-soft min-h-14 whitespace-nowrap !px-2 text-base">
              {t('completion.list')}
            </button>
          )}
          <button type="button" onClick={onShare} className="btn btn-soft min-h-14 whitespace-nowrap !px-2 text-base">
            <Share2 size={18} strokeWidth={2.75} aria-hidden="true" />
            {t('completion.share')}
          </button>
        </div>
        {shareNote && (
          <p role="status" className="mt-2 text-center text-sm font-extrabold text-accent">
            {shareNote}
          </p>
        )}
      </div>
    </div>
  );
}
