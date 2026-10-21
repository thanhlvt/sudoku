import { describe, expect, it } from 'vitest';
import { LOCALES, detectLocale, isLanguagePreference, matchLocale, translate, translator } from './index';
import { formatDate, formatDayMonth, formatMonthName, formatMonthShort } from './format';
import { en } from './messages/en';
import { vi } from './messages/vi';

type Catalog = Record<string, string | { one: string; other: string }>;

const forms = (m: string | { one: string; other: string }): string[] => (typeof m === 'string' ? [m] : [m.one, m.other]);
const placeholders = (m: string | { one: string; other: string }): string[] =>
  [...new Set(forms(m).flatMap((s) => [...s.matchAll(/\{(\w+)\}/g)].map((x) => x[1]!)))].sort();

/** The UI passes all of these for every language; a language writes the month the way it needs to, so it may use only some. */
const MONTH_FORMS = new Set(['month', 'monthShort', 'monthName']);
const withoutMonthForms = (names: string[]): string[] => names.filter((n) => !MONTH_FORMS.has(n));

describe('catalogs', () => {
  const viCatalog = vi as Catalog;
  const enCatalog = en as Catalog;

  it('define exactly the same keys in every language', () => {
    expect(Object.keys(enCatalog).sort()).toEqual(Object.keys(viCatalog).sort());
  });

  it('use the same placeholders in every language, so no value is dropped or left unfilled', () => {
    for (const key of Object.keys(viCatalog)) {
      // English may spell out a plural, which can legitimately drop `{count}` from one form, so compare the union.
      expect(withoutMonthForms(placeholders(enCatalog[key]!)), key).toEqual(withoutMonthForms(placeholders(viCatalog[key]!)));
    }
  });

  it('have no empty messages', () => {
    for (const catalog of [viCatalog, enCatalog]) {
      for (const [key, message] of Object.entries(catalog)) {
        for (const form of forms(message)) expect(form.trim().length, key).toBeGreaterThan(0);
      }
    }
  });

  it('keep Vietnamese out of the English catalog', () => {
    for (const [key, message] of Object.entries(enCatalog)) {
      for (const form of forms(message)) expect(form, key).not.toMatch(/[ăâđêôơưàáạảãèéẹẻẽìíịỉĩòóọỏõùúụủũỳýỵỷỹ]/i);
    }
  });
});

describe('detectLocale', () => {
  it('picks the first language of the device list that the app is translated into', () => {
    expect(detectLocale(['vi-VN', 'en-US'])).toBe('vi');
    expect(detectLocale(['en-GB'])).toBe('en');
    expect(detectLocale(['fr-FR', 'vi'])).toBe('vi');
    expect(detectLocale(['vi_VN'])).toBe('vi');
    expect(detectLocale(['VI'])).toBe('vi');
  });

  it('falls back to English for unsupported or missing languages', () => {
    expect(detectLocale(['fr-FR', 'de'])).toBe('en');
    expect(detectLocale([])).toBe('en');
    expect(detectLocale([''])).toBe('en');
  });

  it('matches by primary language only', () => {
    expect(matchLocale('vi-Latn-VN')).toBe('vi');
    expect(matchLocale('vie')).toBeNull();
    expect(matchLocale('english')).toBeNull();
  });

  it('accepts only known language preferences', () => {
    for (const value of ['auto', ...LOCALES]) expect(isLanguagePreference(value)).toBe(true);
    for (const value of ['fr', '', null, undefined, 3, 'EN']) expect(isLanguagePreference(value)).toBe(false);
  });
});

describe('translate', () => {
  it('fills placeholders and keeps unknown ones visible', () => {
    expect(translate('en', 'common.levelPuzzle', { level: 'Hard', n: 12 })).toBe('Hard · Puzzle 12');
    expect(translate('vi', 'common.levelPuzzle', { level: 'Khó', n: 12 })).toBe('Khó · Màn 12');
    expect(translate('en', 'common.levelPuzzle', { level: 'Hard' })).toBe('Hard · Puzzle {n}');
  });

  it('does not treat `$` sequences in values as replacement patterns', () => {
    expect(translate('en', 'common.puzzleNumber', { n: '$&$1' })).toBe('Puzzle $&$1');
  });

  it('chooses the plural form from `count`', () => {
    expect(translate('en', 'share.mistakes', { count: 1 })).toBe('1 mistake');
    expect(translate('en', 'share.mistakes', { count: 0 })).toBe('0 mistakes');
    expect(translate('en', 'share.mistakes', { count: 2 })).toBe('2 mistakes');
    expect(translate('vi', 'share.mistakes', { count: 1 })).toBe('1 lỗi');
    expect(translate('vi', 'share.mistakes', { count: 5 })).toBe('5 lỗi');
  });

  it('has a translator bound to one language', () => {
    expect(translator('en')('common.back')).toBe('Back');
    expect(translator('vi')('common.back')).toBe('Quay lại');
  });
});

describe('format', () => {
  it('writes day and month in the language order', () => {
    expect(formatDayMonth('2026-10-05', 'vi-VN')).toBe('5/10');
    expect(formatDayMonth('2026-10-05', 'en-US')).toBe('10/5');
  });

  it('names months', () => {
    expect(formatMonthName(10, 'en-US')).toBe('October');
    expect(formatMonthShort(10, 'en-US')).toBe('OCT');
    expect(formatMonthName(1, 'vi-VN')).toMatch(/1/);
  });

  it('writes a full date', () => {
    expect(formatDate(Date.UTC(2026, 9, 21, 12), 'en-US')).toBe('10/21/2026');
    expect(formatDate(Date.UTC(2026, 9, 21, 12), 'vi-VN')).toBe('21/10/2026');
  });
});
