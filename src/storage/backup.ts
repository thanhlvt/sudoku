import { isPuzzleId } from '../core/levels';
import {
  clearAllProgress,
  listGames,
  loadAchievements,
  loadDaily,
  loadLast,
  loadSettings,
  loadStats,
  migrate,
  parseAchievements,
  parseDaily,
  parseLast,
  parseSavedGame,
  parseSettings,
  parseStats,
  saveAchievements,
  saveDaily,
  saveGame,
  saveLast,
  saveSettings,
  saveStats,
  type DailyState,
  type LastPlayed,
  type SavedGame,
  type Settings,
  type Stats,
} from './schema';

/** Marks the file as ours and lets a later build change the layout. */
const APP = 'sudoku';
const FORMAT = 1;
/** A real backup is a few hundred KB; this only stops a pasted multi-gigabyte file from being parsed. */
const MAX_BACKUP_CHARS = 8_000_000;
const MAX_GAMES = 50_000;

export interface Backup {
  app: typeof APP;
  format: typeof FORMAT;
  exportedAt: number;
  data: {
    settings: Settings;
    stats: Stats;
    daily: DailyState;
    last: LastPlayed | null;
    achievements: Record<string, number>;
    games: Record<string, SavedGame>;
  };
}

/** Everything the player has, as JSON text for a file. Never includes puzzle solutions (they are in the bank). */
export function createBackup(now: number): string {
  const games: Record<string, SavedGame> = {};
  for (const game of listGames()) games[game.puzzleId] = game;
  const backup: Backup = {
    app: APP,
    format: FORMAT,
    exportedAt: now,
    data: {
      settings: loadSettings(),
      stats: loadStats(),
      daily: loadDaily(),
      last: loadLast(),
      achievements: loadAchievements(),
      games,
    },
  };
  return JSON.stringify(backup);
}

export interface ParsedBackup {
  exportedAt: number | null;
  settings: Settings | null;
  stats: Stats | null;
  daily: DailyState | null;
  last: LastPlayed | null;
  achievements: Record<string, number> | null;
  games: SavedGame[];
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Reads backup text. The file is untrusted -- hand-edited, from another app, or truncated -- so each part goes
 * through the same validators as data read from localStorage, and anything that fails is dropped rather than
 * trusted. Returns null when the text is not a backup at all or holds nothing usable.
 */
export function parseBackup(text: string): ParsedBackup | null {
  if (typeof text !== 'string' || text.length > MAX_BACKUP_CHARS) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObj(raw) || raw.app !== APP || raw.format !== FORMAT || !isObj(raw.data)) return null;
  const data = raw.data;

  const games: SavedGame[] = [];
  if (isObj(data.games)) {
    let seen = 0;
    for (const [id, value] of Object.entries(data.games)) {
      if (++seen > MAX_GAMES) break;
      if (!isPuzzleId(id)) continue;
      const game = parseSavedGame(value);
      // The record must belong to the key it is filed under.
      if (game && game.puzzleId === id) games.push(game);
    }
  }

  const parsed: ParsedBackup = {
    exportedAt: typeof raw.exportedAt === 'number' && Number.isFinite(raw.exportedAt) ? raw.exportedAt : null,
    settings: parseSettings(data.settings),
    stats: parseStats(data.stats),
    daily: parseDaily(data.daily),
    last: parseLast(data.last),
    achievements: parseAchievements(data.achievements),
    games,
  };
  const hasAnything =
    games.length > 0 || parsed.settings || parsed.stats || parsed.daily || parsed.last || parsed.achievements;
  return hasAnything ? parsed : null;
}

/** Replaces all current progress with the backup's. The caller confirms with the player first. */
export function applyBackup(backup: ParsedBackup): void {
  clearAllProgress();
  migrate();
  if (backup.settings) saveSettings(backup.settings);
  if (backup.stats) saveStats(backup.stats);
  if (backup.daily) saveDaily(backup.daily);
  if (backup.last) saveLast(backup.last);
  if (backup.achievements) saveAchievements(backup.achievements);
  for (const game of backup.games) saveGame(game);
}
