import { useMemo, useSyncExternalStore } from 'react';
import { INTL_LOCALE, getLocale, subscribeLocale, translator, type Locale, type Translate } from './index';

/**
 * Subscribes the component to language changes. `t` has a new identity per language, so it is safe in
 * `useMemo` / `useEffect` dependency lists: whatever was computed from it is recomputed on a switch.
 */
export function useI18n(): { t: Translate; locale: Locale; intlLocale: string } {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, getLocale);
  return useMemo(
    () => ({ t: translator(locale), locale, intlLocale: INTL_LOCALE[locale] }),
    [locale],
  );
}
