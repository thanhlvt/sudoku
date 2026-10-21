/** Languages the app is translated into. Add a language: a file in `messages/`, an entry in each map below. */
export const LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** What the player picks in Settings: follow the device, or force one language. */
export const LANGUAGE_PREFERENCES = ['auto', ...LOCALES] as const;
export type LanguagePreference = (typeof LANGUAGE_PREFERENCES)[number];

/** Used when the device language is one we have no translation for. */
export const FALLBACK_LOCALE: Locale = 'en';

/** BCP-47 tag handed to `Intl` / `toLocale*String` for each language. */
export const INTL_LOCALE: Record<Locale, string> = { vi: 'vi-VN', en: 'en-US' };

/** Each language written in itself, for the language picker. */
export const LOCALE_NAMES: Record<Locale, string> = { vi: 'Tiếng Việt', en: 'English' };

export function isLanguagePreference(v: unknown): v is LanguagePreference {
  return (LANGUAGE_PREFERENCES as readonly unknown[]).includes(v);
}

/** `vi`, `vi-VN`, `en_GB`... -> the supported locale with that primary language, or null. */
export function matchLocale(tag: string): Locale | null {
  const primary = tag.toLowerCase().split(/[-_]/)[0];
  return LOCALES.find((l) => l === primary) ?? null;
}

/**
 * The first language in the device's preference order that we translate, e.g. `['fr-FR', 'vi']` -> `vi`: a
 * French reader who also lists Vietnamese gets Vietnamese rather than the English fallback.
 */
export function detectLocale(languages: readonly string[]): Locale {
  for (const tag of languages) {
    const match = matchLocale(tag);
    if (match) return match;
  }
  return FALLBACK_LOCALE;
}
