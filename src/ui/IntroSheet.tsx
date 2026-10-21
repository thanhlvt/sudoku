import { CalendarDays, Grid3x3, Lightbulb, PencilLine, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { MessageKey } from '../i18n';
import { useI18n } from '../i18n/useI18n';
import { Sheet } from './Sheet';

interface Page {
  icon: LucideIcon;
  title: MessageKey;
  body: MessageKey;
  detail: MessageKey;
}

const PAGES: readonly Page[] = [
  { icon: Grid3x3, title: 'intro.rules.title', body: 'intro.rules.body', detail: 'intro.rules.detail' },
  { icon: PencilLine, title: 'intro.notes.title', body: 'intro.notes.body', detail: 'intro.notes.detail' },
  { icon: Lightbulb, title: 'intro.logic.title', body: 'intro.logic.body', detail: 'intro.logic.detail' },
  { icon: CalendarDays, title: 'intro.daily.title', body: 'intro.daily.body', detail: 'intro.daily.detail' },
];

interface IntroSheetProps {
  onClose: () => void;
}

/** A four-page "how to play" shown on the first visit and from Settings. */
export function IntroSheet({ onClose }: IntroSheetProps): JSX.Element {
  const { t } = useI18n();
  const [page, setPage] = useState(0);
  const { icon: Icon, title, body, detail } = PAGES[page]!;
  const last = page === PAGES.length - 1;

  return (
    <Sheet title={t('intro.title')} onClose={onClose}>
      <div key={page} className="flex animate-screen-in flex-col items-center gap-4 px-1 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-white shadow-[0_5px_0_0_#5B21B6]">
          <Icon size={40} strokeWidth={2.5} aria-hidden="true" />
        </span>
        <h3 className="text-2xl font-black">{t(title)}</h3>
        <p className="text-lg font-bold leading-snug">{t(body)}</p>
        <p className="rounded-2xl bg-soft px-4 py-3 text-base font-bold leading-snug text-accent">{t(detail)}</p>
      </div>

      <div className="mt-5 flex justify-center gap-2" role="tablist" aria-label={t('intro.pagesAria')}>
        {PAGES.map((_, i) => (
          <span
            key={i}
            role="tab"
            aria-selected={i === page}
            aria-label={t('intro.page', { n: i + 1 })}
            className={`h-2.5 rounded-full transition-all ${i === page ? 'w-6 bg-primary' : 'w-2.5 bg-soft'}`}
          />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => (page === 0 ? onClose() : setPage(page - 1))}
          className="btn btn-soft min-h-14 text-base"
        >
          {page === 0 ? t('intro.skip') : t('intro.back')}
        </button>
        <button
          type="button"
          autoFocus
          onClick={() => (last ? onClose() : setPage(page + 1))}
          className="btn btn-primary min-h-14 text-base"
        >
          {last ? t('intro.start') : t('intro.next')}
        </button>
      </div>
    </Sheet>
  );
}
