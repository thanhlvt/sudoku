import type { Level } from '../core/types';
import type { MessageKey, Translate } from '../i18n';

const LEVEL_LABEL_KEYS: Record<Level, MessageKey> = {
  beginner: 'level.beginner',
  easy: 'level.easy',
  medium: 'level.medium',
  hard: 'level.hard',
  expert: 'level.expert',
};

/** A difficulty's name in the language `t` translates to. */
export function levelLabel(level: Level, t: Translate): string {
  return t(LEVEL_LABEL_KEYS[level]);
}

export interface LevelTheme {
  /** 1–5, shown in the level badge. */
  n: number;
  /** Tailwind classes (literal strings so the compiler sees them). */
  bg: string;
  edge: string;
  ghost: string;
  /** Same colours as space-separated RGB, for the `--btn-*` custom properties. */
  rgb: string;
  edgeRgb: string;
}

export const LEVEL_THEME: Record<Level, LevelTheme> = {
  beginner: { n: 1, bg: 'bg-lv1', edge: 'bg-lv1-edge', ghost: 'text-lv1-ghost', rgb: '21 128 61', edgeRgb: '20 83 45' },
  easy: { n: 2, bg: 'bg-lv2', edge: 'bg-lv2-edge', ghost: 'text-lv2-ghost', rgb: '3 105 161', edgeRgb: '12 74 110' },
  medium: { n: 3, bg: 'bg-lv3', edge: 'bg-lv3-edge', ghost: 'text-lv3-ghost', rgb: '109 40 217', edgeRgb: '76 29 149' },
  hard: { n: 4, bg: 'bg-lv4', edge: 'bg-lv4-edge', ghost: 'text-lv4-ghost', rgb: '194 65 12', edgeRgb: '124 45 18' },
  expert: { n: 5, bg: 'bg-lv5', edge: 'bg-lv5-edge', ghost: 'text-lv5-ghost', rgb: '190 18 60', edgeRgb: '136 19 55' },
};
