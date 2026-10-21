import type { Level } from '../core/types';
import type { MessageKey } from '../i18n';
import { GAME_MODES, type GameMode } from '../storage/schema';

export { GAME_MODES };
export type { GameMode };

export function isGameMode(v: unknown): v is GameMode {
  return (GAME_MODES as readonly unknown[]).includes(v);
}

/** Why a challenge attempt ended before the puzzle was solved. */
export type ModeFailure = 'time-up' | 'mistake';

const MINUTE_MS = 60_000;

/**
 * Time attack: the countdown for each level. Generous enough that a player who knows the techniques of the
 * level can finish, tight enough that dawdling fails. Beginner and easy are close to the speed achievements.
 */
export const TIME_LIMIT_MS: Record<Level, number> = {
  beginner: 3 * MINUTE_MS,
  easy: 5 * MINUTE_MS,
  medium: 8 * MINUTE_MS,
  hard: 12 * MINUTE_MS,
  expert: 20 * MINUTE_MS,
};

export interface ModeInfo {
  id: GameMode;
  /** Catalog keys for the mode's name and its one-line rule on the modes screen. */
  labelKey: MessageKey;
  ruleKey: MessageKey;
}

export const MODE_INFO: Record<GameMode, ModeInfo> = {
  time: { id: 'time', labelKey: 'mode.time.label', ruleKey: 'mode.time.rule' },
  perfect: { id: 'perfect', labelKey: 'mode.perfect.label', ruleKey: 'mode.perfect.rule' },
};

/** Extra experience for finishing a puzzle under a challenge mode. */
export const MODE_XP_MULTIPLIER = 1.5;

/**
 * Whether an attempt under `mode` has already failed. Derived from the game's own numbers, so a saved game that
 * was left mid-failure shows the same result when it is reopened, and nothing extra needs storing.
 */
export function modeFailure(
  mode: GameMode | undefined,
  state: { completed: boolean; elapsedMs: number; mistakes: number; level: Level },
): ModeFailure | null {
  if (mode === 'perfect' && state.mistakes > 0) return 'mistake';
  if (mode === 'time' && !state.completed && state.elapsedMs >= TIME_LIMIT_MS[state.level]) return 'time-up';
  return null;
}
