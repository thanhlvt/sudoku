import { FALLBACK_LOCALE, INTL_LOCALE, detectLocale, type LanguagePreference, type Locale } from './locales';
import type { Message } from './message';
import { en } from './messages/en';
import { vi, type MessageKey } from './messages/vi';

export * from './locales';
export * from './format';
export type { MessageKey } from './messages/vi';
export type { Message } from './message';

export type MessageParams = Readonly<Record<string, string | number>>;
export type Translate = (key: MessageKey, params?: MessageParams) => string;

const CATALOGS: Record<Locale, Readonly<Record<MessageKey, Message>>> = { vi, en };

const pluralRules = new Map<Locale, Intl.PluralRules>();
function pluralCategory(locale: Locale, count: number): 'one' | 'other' {
  let rules = pluralRules.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(INTL_LOCALE[locale]);
    pluralRules.set(locale, rules);
  }
  return rules.select(count) === 'one' ? 'one' : 'other';
}

function fill(template: string, params: MessageParams | undefined): string {
  if (!params) return template;
  // An unknown placeholder stays visible (`{name}`) rather than silently vanishing.
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (Object.hasOwn(params, name) ? String(params[name]) : whole));
}

/** A `t` fixed to one language, for code that already knows the locale (and for tests). */
export function translator(locale: Locale): Translate {
  return (key, params) => translate(locale, key, params);
}

/** Pure lookup, for code that already knows the locale (tests, notifications scheduled for a given language). */
export function translate(locale: Locale, key: MessageKey, params?: MessageParams): string {
  const message = CATALOGS[locale][key] ?? CATALOGS[FALLBACK_LOCALE][key] ?? key;
  if (typeof message === 'string') return fill(message, params);
  const count = typeof params?.count === 'number' ? params.count : Number(params?.count);
  return fill(message[pluralCategory(locale, Number.isFinite(count) ? count : 0)], params);
}

/* ---- The language currently shown ---- */

/** The device's language list. Android's WebView reports the system language(s) here. */
export function systemLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') return [];
  if (navigator.languages && navigator.languages.length > 0) return navigator.languages;
  return navigator.language ? [navigator.language] : [];
}

export function resolveLocale(preference: LanguagePreference): Locale {
  return preference === 'auto' ? detectLocale(systemLanguages()) : preference;
}

let preference: LanguagePreference = 'auto';
let current: Locale = resolveLocale('auto');
const listeners = new Set<() => void>();

function syncDocument(): void {
  if (typeof document !== 'undefined') document.documentElement.lang = current;
}
syncDocument();

export function getLocale(): Locale {
  return current;
}

/** Switches the language shown by `t()` and re-renders every component that called `useI18n()`. */
export function setLanguage(chosen: LanguagePreference): void {
  preference = chosen;
  const next = resolveLocale(chosen);
  if (next === current) return;
  current = next;
  syncDocument();
  for (const listener of [...listeners]) listener();
}

// The system language can change while the app is open (Android keeps the activity alive across it); when the
// player follows the device, follow it too.
if (typeof window !== 'undefined') {
  window.addEventListener('languagechange', () => {
    if (preference === 'auto') setLanguage('auto');
  });
}

export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Translate into the current language. Components should prefer `useI18n().t` so they re-render on a switch. */
export const t: Translate = (key, params) => translate(current, key, params);

/** Locale tag for `Intl` / `toLocaleDateString` in the current language. */
export function intlLocale(): string {
  return INTL_LOCALE[current];
}
