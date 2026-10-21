import { Check, ChevronRight, GraduationCap } from 'lucide-react';
import { useMemo } from 'react';
import { indexPuzzles, masteredTechniques, practicePuzzles } from '../game/practice';
import { TECHNIQUES, techniqueInfo } from '../game/techniqueInfo';
import { useI18n } from '../i18n/useI18n';
import { ScreenHeader } from './ScreenHeader';
import { useAllBanks } from './hooks/useAllBanks';
import { useSavedProgress } from './hooks/useSavedProgress';

interface LearnScreenProps {
  onNavigate: (hash: string) => void;
  onBack: () => void;
}

export function LearnScreen({ onNavigate, onBack }: LearnScreenProps): JSX.Element {
  const { t } = useI18n();
  const { banks, failed, retry } = useAllBanks();
  const { games } = useSavedProgress();

  const rows = useMemo(() => {
    if (!banks) return null;
    const mastered = masteredTechniques(games, indexPuzzles(banks), TECHNIQUES.map((tech) => tech.id));
    return TECHNIQUES.map(({ id }) => ({
      info: techniqueInfo(id, t)!,
      practice: practicePuzzles(id, banks).length,
      mastered: mastered.has(id),
    }));
  }, [banks, games, t]);

  const masteredCount = rows?.filter((r) => r.mastered).length ?? 0;

  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pb-8 pt-5">
      <ScreenHeader
        title={t('learn.title')}
        onBack={onBack}
        right={rows && <span className="text-lg font-black tabular-nums text-accent">{masteredCount}/{rows.length}</span>}
      />
      <p className="flex items-start gap-3 rounded-2xl bg-soft p-4 text-base font-bold leading-snug">
        <GraduationCap size={24} strokeWidth={2.75} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        {t('learn.intro')}
      </p>

      {failed && (
        <div role="alert" className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-base font-bold text-accent">{t('common.dataLoadFailed')}</p>
          <button type="button" onClick={retry} className="btn btn-primary min-h-12 px-6">
            {t('common.retry')}
          </button>
        </div>
      )}
      {!banks && !failed && <p className="py-6 text-center text-base font-bold text-accent">{t('common.loading')}</p>}

      {rows && (
        <ul className="flex flex-col gap-3">
          {rows.map(({ info, practice, mastered }, i) => (
            <li key={info.id}>
              <button
                type="button"
                onClick={() => onNavigate(`#/learn/${info.id}`)}
                aria-label={t('learn.rowAria', { label: info.label, state: t(mastered ? 'learn.mastered' : 'learn.notMastered'), count: practice })}
                className="btn btn-white animate-screen-in w-full justify-start gap-3 !rounded-2xl p-3 text-left"
                style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-black ${
                    mastered ? 'bg-emerald-500 text-white' : 'bg-soft text-accent'
                  }`}
                  aria-hidden="true"
                >
                  {mastered ? <Check size={22} strokeWidth={4} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-black leading-tight">{info.label}</span>
                  <span className="block truncate text-sm font-bold text-accent">
                    {info.group} · {practice > 0 ? t('learn.practiceCount', { count: practice, shown: practice > 99 ? '99+' : practice }) : t('learn.noPractice')}
                  </span>
                </span>
                <ChevronRight size={22} strokeWidth={3} className="shrink-0 text-accent" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
