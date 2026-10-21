import { Lock } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { achievementText, evaluateAchievements } from '../game/achievements';
import { formatDate } from '../i18n/format';
import { useI18n } from '../i18n/useI18n';
import { loadWeekly, type DailyState, type Stats } from '../storage/schema';
import { AchievementIcon } from './AchievementIcon';
import { PlayerCard } from './PlayerCard';
import { ScreenHeader } from './ScreenHeader';
import { useAchievements } from './hooks/useAchievements';
import { useSavedProgress } from './hooks/useSavedProgress';

interface AchievementsScreenProps {
  stats: Stats;
  daily: DailyState;
  onBack: () => void;
}

export function AchievementsScreen({ stats, daily, onBack }: AchievementsScreenProps): JSX.Element {
  const { t, intlLocale } = useI18n();
  const { games } = useSavedProgress();
  const { unlocked, check } = useAchievements();

  // Anything earned before this feature existed (or in another tab) is recorded the first time the list opens.
  useEffect(() => {
    check();
  }, [check]);

  const rows = useMemo(() => {
    const statuses = evaluateAchievements({ games, stats, daily, weeklyDone: loadWeekly().done.length });
    // Once recorded, an achievement stays unlocked even if the data behind it has since shrunk.
    return statuses.map((s) => ({ ...s, unlocked: s.unlocked || Object.hasOwn(unlocked, s.def.id) }));
  }, [games, stats, daily, unlocked]);

  const earned = rows.filter((r) => r.unlocked);
  const locked = rows.filter((r) => !r.unlocked);

  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pb-8 pt-5">
      <ScreenHeader
        title={t('achievements.title')}
        onBack={onBack}
        right={<span className="text-lg font-black tabular-nums text-accent">{earned.length}/{rows.length}</span>}
      />
      <PlayerCard games={games} className="animate-screen-in" />

      {earned.length > 0 && (
        <section aria-label={t('achievements.unlocked')} className="flex flex-col gap-3">
          <h2 className="text-xl font-black">{t('achievements.unlocked')}</h2>
          {earned.map(({ def }, i) => {
            const at = unlocked[def.id];
            const text = achievementText(def.id, t);
            return (
              <div
                key={def.id}
                className="card flex animate-pop-in items-center gap-4 p-4"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-amber-950 shadow-[0_3px_0_0_#B45309]">
                  <AchievementIcon name={def.icon} size={26} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-black leading-tight">{text.title}</span>
                  <span className="block text-sm font-bold leading-snug text-accent">{text.description}</span>
                </span>
                {at !== undefined && (
                  <span className="shrink-0 text-xs font-extrabold tabular-nums text-accent">{formatDate(at, intlLocale)}</span>
                )}
              </div>
            );
          })}
        </section>
      )}

      <section aria-label={t('achievements.locked')} className="flex flex-col gap-3">
        <h2 className="text-xl font-black">{t('achievements.locked')}</h2>
        {locked.length === 0 && <p className="text-base font-bold text-accent">{t('achievements.allDone')}</p>}
        {locked.map(({ def, value }) => {
          const text = achievementText(def.id, t);
          return (
          <div key={def.id} className="card flex items-center gap-4 p-4 opacity-90">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-soft text-accent">
              <Lock size={22} strokeWidth={2.75} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-black leading-tight">{text.title}</span>
              <span className="block text-sm font-bold leading-snug text-accent">{text.description}</span>
              {def.target > 1 && (
                <span className="mt-2 flex items-center gap-2">
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-soft" role="img" aria-label={t('achievements.progressAria', { value, target: def.target })}>
                    <span
                      className="block h-full rounded-full bg-primary-light"
                      style={{ width: value > 0 ? `max(${(value / def.target) * 100}%, 0.5rem)` : 0 }}
                    />
                  </span>
                  <span className="text-xs font-extrabold tabular-nums text-accent">
                    {value}/{def.target}
                  </span>
                </span>
              )}
            </span>
          </div>
          );
        })}
      </section>
    </main>
  );
}
