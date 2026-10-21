import type { Level } from './types';

export const LEVELS: readonly Level[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];

export function isLevel(s: unknown): s is Level {
  return typeof s === 'string' && (LEVELS as readonly string[]).includes(s);
}

/** Matches ids the generator produces (`<level>-<1-based index>`, zero-padded to 3 digits). */
const PUZZLE_ID_RE = /^(beginner|easy|medium|hard|expert)-\d{3,6}$/;

/**
 * True only for well-formed puzzle ids. Anything that reaches a lookup keyed by level or id (saved games,
 * the URL hash) must pass this first, so values like `__proto__-001` never index into plain objects.
 */
export function isPuzzleId(s: unknown): s is string {
  return typeof s === 'string' && PUZZLE_ID_RE.test(s);
}
