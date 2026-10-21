import { LEVELS, isPuzzleId } from '../core/levels';
import type { Level } from '../core/types';
import { listKeysWithPrefix, readJSON, removeAllWithPrefix, removeKey, writeJSON } from './storage';

export const SCHEMA_VERSION = 1;
export const NAMESPACE = 'sudoku:v1';

export const KEYS = {
  meta: `${NAMESPACE}:meta`,
  settings: `${NAMESPACE}:settings`,
  stats: `${NAMESPACE}:stats`,
  last: `${NAMESPACE}:last`,
  daily: `${NAMESPACE}:daily`,
  achievements: `${NAMESPACE}:achievements`,
  weekly: `${NAMESPACE}:weekly`,
  game: (puzzleId: string): string => `${NAMESPACE}:game:${puzzleId}`,
};

export interface Meta {
  schemaVersion: number;
  generatorVersion: number | null;
  createdAt: number;
  updatedAt: number;
}

/** Rule sets a single attempt can be played under: a countdown, or "the first mistake ends it". */
export const GAME_MODES = ['time', 'perfect'] as const;
export type GameMode = (typeof GAME_MODES)[number];

export interface SavedGame {
  puzzleId: string;
  board: string;
  notes: string;
  elapsedMs: number;
  mistakes: number;
  hintsUsed: number;
  status: 'in-progress' | 'completed';
  completedAt?: number;
  /** Present when the attempt was started in a challenge mode; absent for a normal game. */
  mode?: GameMode;
  updatedAt: number;
}

export interface Settings {
  highlightSameDigit: boolean;
  highlightPeers: boolean;
  showMistakes: boolean;
  autoRemoveNotes: boolean;
  theme: 'system' | 'light' | 'dark';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  /** Board colour scheme; the non-default ones unlock with the player level. */
  boardPalette: PaletteId;
  /** Remind about the daily challenge in the evening (Android only: the web build cannot schedule notifications). */
  reminderEnabled: boolean;
  /** The how-to-play intro has been shown (or the player already has progress and does not need it). */
  seenIntro: boolean;
}

export const PALETTE_IDS = ['violet', 'ocean', 'forest', 'sunset'] as const;
export type PaletteId = (typeof PALETTE_IDS)[number];

export const DEFAULT_SETTINGS: Settings = {
  highlightSameDigit: true,
  highlightPeers: true,
  showMistakes: true,
  autoRemoveNotes: true,
  theme: 'system',
  soundEnabled: true,
  hapticsEnabled: true,
  boardPalette: 'violet',
  reminderEnabled: true,
  seenIntro: false,
};

export interface LevelStats {
  played: number;
  completed: number;
  bestMs: number | null;
  totalMs: number;
  perfectRuns: number;
}

export type Stats = Record<Level, LevelStats>;

function defaultLevelStats(): LevelStats {
  return { played: 0, completed: 0, bestMs: null, totalMs: 0, perfectRuns: 0 };
}

export function defaultStats(): Stats {
  const stats = {} as Stats;
  for (const level of LEVELS) stats[level] = defaultLevelStats();
  return stats;
}

export interface LastPlayed {
  puzzleId: string;
  at: number;
}

/**
 * Validators for everything read back from localStorage. The stored text is untrusted: it can be hand-edited,
 * written by another app on the same origin, truncated, or left by a build with a different shape. Each
 * `parse*` returns a sanitised value, or `null` when the record is unusable (the caller then drops the key).
 */
type Obj = Record<string, unknown>;

const MAX_TIMESTAMP = 8.64e15; // largest valid JS Date
const MAX_DURATION_MS = 365 * 24 * 3_600_000; // one game taking longer than a year is not a ván
const MAX_TOTAL_MS = 1e15;
const MAX_COUNT = 1_000_000;
const MAX_FREEZES_STORED = 9; // the game holds at most 2; the cap only bounds what a hand-edited save can claim
const BOARD_RE = /^[.0-9]{81}$/;
const NOTES_RE = /^[0-9a-fA-F]{243}$/;
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const THEMES: readonly Settings['theme'][] = ['system', 'light', 'dark'];

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNumberIn(v: unknown, min: number, max: number): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
}

function isCountIn(v: unknown, max: number): v is number {
  return isNumberIn(v, 0, max) && Number.isInteger(v);
}

export function parseSavedGame(v: unknown): SavedGame | null {
  if (!isObj(v)) return null;
  const { puzzleId, board, notes, elapsedMs, mistakes, hintsUsed, status, completedAt, updatedAt, mode } = v;
  if (!isPuzzleId(puzzleId)) return null;
  if (typeof board !== 'string' || !BOARD_RE.test(board)) return null;
  if (typeof notes !== 'string' || !NOTES_RE.test(notes)) return null;
  if (!isNumberIn(elapsedMs, 0, MAX_DURATION_MS)) return null;
  if (!isCountIn(mistakes, MAX_COUNT) || !isCountIn(hintsUsed, MAX_COUNT)) return null;
  if (status !== 'in-progress' && status !== 'completed') return null;
  if (!isNumberIn(updatedAt, 0, MAX_TIMESTAMP)) return null;
  if (completedAt !== undefined && !isNumberIn(completedAt, 0, MAX_TIMESTAMP)) return null;
  const game: SavedGame = { puzzleId, board, notes, elapsedMs, mistakes, hintsUsed, status, updatedAt };
  if (completedAt !== undefined) game.completedAt = completedAt;
  // An unknown mode (a newer build, a hand edit) is dropped: the game is then simply a normal one.
  if ((GAME_MODES as readonly unknown[]).includes(mode)) game.mode = mode as GameMode;
  return game;
}

function parseLevelStats(v: unknown): LevelStats | null {
  if (!isObj(v)) return null;
  const { played, completed, bestMs, totalMs, perfectRuns } = v;
  if (!isCountIn(played, MAX_COUNT) || !isCountIn(completed, MAX_COUNT) || !isCountIn(perfectRuns, MAX_COUNT)) return null;
  if (!isNumberIn(totalMs, 0, MAX_TOTAL_MS)) return null;
  if (bestMs !== null && !isNumberIn(bestMs, 0, MAX_DURATION_MS)) return null;
  return { played, completed, bestMs, totalMs, perfectRuns };
}

/** A non-object is rejected outright; a bad or missing level entry only resets that level. */
export function parseStats(v: unknown): Stats | null {
  if (!isObj(v)) return null;
  const stats = defaultStats();
  for (const level of LEVELS) stats[level] = parseLevelStats(v[level]) ?? defaultLevelStats();
  return stats;
}

/** Field by field over the defaults, so one bad field (or a field added later) never discards the rest. */
export function parseSettings(v: unknown): Settings | null {
  if (!isObj(v)) return null;
  const settings: Settings = { ...DEFAULT_SETTINGS };
  for (const key of ['highlightSameDigit', 'highlightPeers', 'showMistakes', 'autoRemoveNotes', 'soundEnabled', 'hapticsEnabled', 'seenIntro', 'reminderEnabled'] as const) {
    if (typeof v[key] === 'boolean') settings[key] = v[key] as boolean;
  }
  if (THEMES.includes(v.theme as Settings['theme'])) settings.theme = v.theme as Settings['theme'];
  if (PALETTE_IDS.includes(v.boardPalette as PaletteId)) settings.boardPalette = v.boardPalette as PaletteId;
  return settings;
}

export function parseDaily(v: unknown): DailyState | null {
  if (!isObj(v)) return null;
  const { streak, longest, lastDate, freezes } = v;
  return {
    streak: isCountIn(streak, MAX_COUNT) ? streak : 0,
    longest: isCountIn(longest, MAX_COUNT) ? longest : 0,
    lastDate: typeof lastDate === 'string' && DATE_KEY_RE.test(lastDate) ? lastDate : null,
    freezes: isCountIn(freezes, MAX_FREEZES_STORED) ? freezes : 0,
  };
}

const ACHIEVEMENT_ID_RE = /^[a-z0-9-]{1,40}$/;
const MAX_ACHIEVEMENTS = 200;

/** `id -> unlock time`. Unknown ids are kept (a later build may define them); malformed entries are dropped. */
export function parseAchievements(v: unknown): Record<string, number> | null {
  if (!isObj(v)) return null;
  const out: Record<string, number> = {};
  let count = 0;
  for (const [id, at] of Object.entries(v)) {
    if (count >= MAX_ACHIEVEMENTS) break;
    if (ACHIEVEMENT_ID_RE.test(id) && isNumberIn(at, 0, MAX_TIMESTAMP)) {
      out[id] = at;
      count++;
    }
  }
  return out;
}

/** Weeks (as the `YYYY-MM-DD` of their Monday) whose five-puzzle challenge was finished. */
export interface WeeklyState {
  done: string[];
}

const MAX_WEEKS_KEPT = 520;

export function parseWeekly(v: unknown): WeeklyState | null {
  if (!isObj(v) || !Array.isArray(v.done)) return null;
  const done = new Set<string>();
  for (const key of v.done) {
    if (done.size >= MAX_WEEKS_KEPT) break;
    if (typeof key === 'string' && DATE_KEY_RE.test(key)) done.add(key);
  }
  return { done: [...done] };
}

export function parseLast(v: unknown): LastPlayed | null {
  if (!isObj(v)) return null;
  const { puzzleId, at } = v;
  if (!isPuzzleId(puzzleId) || !isNumberIn(at, 0, MAX_TIMESTAMP)) return null;
  return { puzzleId, at };
}

export function parseMeta(v: unknown): Meta | null {
  if (!isObj(v)) return null;
  const { schemaVersion, generatorVersion, createdAt, updatedAt } = v;
  if (!isCountIn(schemaVersion, 1000)) return null;
  if (generatorVersion !== null && !isCountIn(generatorVersion, MAX_COUNT)) return null;
  if (!isNumberIn(createdAt, 0, MAX_TIMESTAMP) || !isNumberIn(updatedAt, 0, MAX_TIMESTAMP)) return null;
  return { schemaVersion, generatorVersion, createdAt, updatedAt };
}

export function migrate(): void {
  const meta = readJSON<Meta | null>(KEYS.meta, null, parseMeta);
  if (meta === null) {
    writeJSON(KEYS.meta, {
      schemaVersion: SCHEMA_VERSION,
      generatorVersion: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } satisfies Meta);
    return;
  }
  if (meta.schemaVersion < SCHEMA_VERSION) {
    // Future vN -> vN+1 steps go here, applied in order.
    writeJSON(KEYS.meta, { ...meta, schemaVersion: SCHEMA_VERSION, updatedAt: Date.now() } satisfies Meta);
  }
}

/** Records the bank's generatorVersion into meta; returns true if it differs from what was stored before. */
export function syncGeneratorVersion(manifestVersion: number): boolean {
  const meta = readJSON<Meta | null>(KEYS.meta, null, parseMeta);
  if (meta === null) return false;
  const mismatched = meta.generatorVersion !== null && meta.generatorVersion !== manifestVersion;
  writeJSON(KEYS.meta, { ...meta, generatorVersion: manifestVersion, updatedAt: Date.now() } satisfies Meta);
  return mismatched;
}

export function loadSettings(): Settings {
  // `parseSettings` lays the stored fields over the defaults, so settings saved by an older build pick up newly added fields.
  return readJSON<Settings>(KEYS.settings, { ...DEFAULT_SETTINGS }, parseSettings);
}

export function saveSettings(settings: Settings): boolean {
  return writeJSON(KEYS.settings, settings);
}

export function loadStats(): Stats {
  return readJSON<Stats>(KEYS.stats, defaultStats(), parseStats);
}

export function saveStats(stats: Stats): boolean {
  return writeJSON(KEYS.stats, stats);
}

export function loadGame(puzzleId: string): SavedGame | null {
  // The record must also belong to the key it sits under; a mismatch means it was moved or forged.
  return readJSON<SavedGame | null>(KEYS.game(puzzleId), null, (v) => {
    const game = parseSavedGame(v);
    return game !== null && game.puzzleId === puzzleId ? game : null;
  });
}

export function saveGame(game: SavedGame): boolean {
  return writeJSON(KEYS.game(game.puzzleId), game);
}

export function deleteGame(puzzleId: string): void {
  removeKey(KEYS.game(puzzleId));
}

/** Every saved game (in progress or completed), for aggregate progress views. */
export function listGames(): SavedGame[] {
  const prefix = KEYS.game('');
  const games: SavedGame[] = [];
  for (const key of listKeysWithPrefix(prefix)) {
    const game = loadGame(key.slice(prefix.length));
    if (game) games.push(game);
  }
  return games;
}

/** Daily-challenge streak. Dates are local calendar days as `YYYY-MM-DD`. */
export interface DailyState {
  streak: number;
  longest: number;
  lastDate: string | null;
  /** Streak freezes in hand: each covers one missed day. */
  freezes: number;
}

export const DEFAULT_DAILY: DailyState = { streak: 0, longest: 0, lastDate: null, freezes: 0 };

export function loadDaily(): DailyState {
  return readJSON<DailyState>(KEYS.daily, { ...DEFAULT_DAILY }, parseDaily);
}

export function saveDaily(daily: DailyState): boolean {
  return writeJSON(KEYS.daily, daily);
}

export function loadAchievements(): Record<string, number> {
  return readJSON<Record<string, number>>(KEYS.achievements, {}, parseAchievements);
}

export function saveAchievements(unlocked: Readonly<Record<string, number>>): boolean {
  return writeJSON(KEYS.achievements, unlocked);
}

export const DEFAULT_WEEKLY: WeeklyState = { done: [] };

export function loadWeekly(): WeeklyState {
  return readJSON<WeeklyState>(KEYS.weekly, { done: [] }, parseWeekly);
}

export function saveWeekly(weekly: WeeklyState): boolean {
  return writeJSON(KEYS.weekly, weekly);
}

export function loadLast(): LastPlayed | null {
  return readJSON<LastPlayed | null>(KEYS.last, null, parseLast);
}

export function saveLast(last: LastPlayed): boolean {
  return writeJSON(KEYS.last, last);
}

export function clearAllProgress(): void {
  removeAllWithPrefix('sudoku:');
}
