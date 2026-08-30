import { readJSON, removeAllWithPrefix, removeKey, writeJSON } from './storage';
import type { Level } from '../core/types';

export const SCHEMA_VERSION = 1;
export const NAMESPACE = 'sudoku:v1';

export const KEYS = {
  meta: `${NAMESPACE}:meta`,
  settings: `${NAMESPACE}:settings`,
  stats: `${NAMESPACE}:stats`,
  last: `${NAMESPACE}:last`,
  game: (puzzleId: string): string => `${NAMESPACE}:game:${puzzleId}`,
};

export interface Meta {
  schemaVersion: number;
  generatorVersion: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface SavedGame {
  puzzleId: string;
  board: string;
  notes: string;
  elapsedMs: number;
  mistakes: number;
  hintsUsed: number;
  status: 'in-progress' | 'completed';
  completedAt?: number;
  updatedAt: number;
}

export interface Settings {
  highlightSameDigit: boolean;
  highlightPeers: boolean;
  autoRemoveNotes: boolean;
  theme: 'system' | 'light' | 'dark';
  soundEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  highlightSameDigit: true,
  highlightPeers: true,
  autoRemoveNotes: true,
  theme: 'system',
  soundEnabled: false,
};

export interface LevelStats {
  played: number;
  completed: number;
  bestMs: number | null;
  totalMs: number;
  perfectRuns: number;
}

export type Stats = Record<Level, LevelStats>;

const LEVELS: Level[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];

export function defaultStats(): Stats {
  const stats = {} as Stats;
  for (const level of LEVELS) {
    stats[level] = { played: 0, completed: 0, bestMs: null, totalMs: 0, perfectRuns: 0 };
  }
  return stats;
}

export interface LastPlayed {
  puzzleId: string;
  at: number;
}

export function migrate(): void {
  const meta = readJSON<Meta | null>(KEYS.meta, null);
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
  const meta = readJSON<Meta | null>(KEYS.meta, null);
  if (meta === null) return false;
  const mismatched = meta.generatorVersion !== null && meta.generatorVersion !== manifestVersion;
  writeJSON(KEYS.meta, { ...meta, generatorVersion: manifestVersion, updatedAt: Date.now() } satisfies Meta);
  return mismatched;
}

export function loadSettings(): Settings {
  return readJSON(KEYS.settings, DEFAULT_SETTINGS);
}

export function saveSettings(settings: Settings): boolean {
  return writeJSON(KEYS.settings, settings);
}

export function loadStats(): Stats {
  return readJSON(KEYS.stats, defaultStats());
}

export function saveStats(stats: Stats): boolean {
  return writeJSON(KEYS.stats, stats);
}

export function loadGame(puzzleId: string): SavedGame | null {
  return readJSON<SavedGame | null>(KEYS.game(puzzleId), null);
}

export function saveGame(game: SavedGame): boolean {
  return writeJSON(KEYS.game(game.puzzleId), game);
}

export function deleteGame(puzzleId: string): void {
  removeKey(KEYS.game(puzzleId));
}

export function loadLast(): LastPlayed | null {
  return readJSON<LastPlayed | null>(KEYS.last, null);
}

export function saveLast(last: LastPlayed): boolean {
  return writeJSON(KEYS.last, last);
}

export function clearAllProgress(): void {
  removeAllWithPrefix('sudoku:');
}
