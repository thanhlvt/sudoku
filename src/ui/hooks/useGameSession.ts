import { useCallback, useEffect, useRef, useState } from 'react';
import { GameSession, type GameOptions } from '../../game/gameState';
import { deleteGame, loadGame, saveGame, saveLast } from '../../storage/schema';
import type { PuzzleRecord, Step } from '../../core/types';
import type { GameMode } from '../../storage/schema';

interface UseGameSessionOptions {
  puzzle: PuzzleRecord;
  autoRemoveNotes: boolean;
  paused: boolean;
  /** Challenge rules to start a *new* game under; a saved game keeps its own. */
  mode?: GameMode;
}

export interface GameSessionApi {
  session: GameSession;
  /** Bumps on every mutation. `session.board`/`.notes` are mutated in place, so
   *  this is the value to put in dependency arrays instead of those references. */
  version: number;
  setDigit: (idx: number, digit: number) => void;
  eraseCell: (idx: number) => void;
  toggleNote: (idx: number, digit: number) => void;
  undo: () => void;
  redo: () => void;
  /** Fills every empty cell's notes with its candidates. Returns false when nothing changed. */
  fillNotes: () => boolean;
  hint: () => Step | null;
  reset: () => void;
  /** Drops the challenge rules and carries on with the same board as a normal game. */
  clearMode: () => void;
}

const DEBOUNCE_MS = 500;

/**
 * Resume the saved game when there is a usable one; otherwise start fresh. This runs during render, so it must
 * never throw -- a bad save would blank the whole app on every visit to this puzzle. A save that cannot be
 * restored is deleted so it cannot trip the next visit either.
 */
function createSession(opts: GameOptions): GameSession {
  const saved = loadGame(opts.puzzleId);
  if (saved) {
    try {
      if (GameSession.matchesGivens(opts.puzzle, saved)) return GameSession.fromSaved(opts, saved);
    } catch {
      deleteGame(opts.puzzleId);
    }
  }
  return new GameSession(opts);
}

export function useGameSession({ puzzle, autoRemoveNotes, paused, mode }: UseGameSessionOptions): GameSessionApi {
  const sessionRef = useRef<GameSession | null>(null);
  const [version, setVersion] = useState(0);
  const rerender = useCallback(() => setVersion((n) => n + 1), []);

  if (!sessionRef.current || sessionRef.current.puzzleId !== puzzle.id) {
    sessionRef.current = createSession({
      puzzleId: puzzle.id,
      puzzle: puzzle.puzzle,
      solution: puzzle.solution,
      autoRemoveNotes,
      mode,
    });
  }
  const session = sessionRef.current;
  session.autoRemoveNotes = autoRemoveNotes;

  const debounceRef = useRef<number | null>(null);
  const persist = useCallback(
    (immediate: boolean) => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      const doSave = (): void => {
        const now = Date.now();
        saveGame(session.toSaved(now));
        saveLast({ puzzleId: session.puzzleId, at: now });
      };
      if (immediate) doSave();
      else debounceRef.current = window.setTimeout(doSave, DEBOUNCE_MS);
    },
    [session],
  );

  useEffect(() => {
    const onVisibility = (): void => {
      if (document.visibilityState === 'hidden') persist(true);
    };
    const onPageHide = (): void => persist(true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      persist(true);
    };
  }, [persist]);

  // A lost challenge attempt (time up, or a mistake under "no mistakes") stops the clock.
  const failed = session.failure() !== null;
  useEffect(() => {
    if (session.status === 'completed' || paused || failed) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        session.tick(1000);
        rerender();
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [session, session.status, paused, failed, rerender]);

  const setDigit = useCallback(
    (idx: number, digit: number) => {
      session.setDigit(idx, digit);
      rerender();
      persist(session.status === 'completed');
    },
    [session, persist, rerender],
  );

  const eraseCell = useCallback(
    (idx: number) => {
      session.eraseCell(idx);
      rerender();
      persist(false);
    },
    [session, persist, rerender],
  );

  const toggleNote = useCallback(
    (idx: number, digit: number) => {
      session.toggleNote(idx, digit);
      rerender();
      persist(false);
    },
    [session, persist, rerender],
  );

  const undo = useCallback(() => {
    session.undo();
    rerender();
    persist(false);
  }, [session, persist, rerender]);

  const redo = useCallback(() => {
    session.redo();
    rerender();
    persist(session.status === 'completed');
  }, [session, persist, rerender]);

  const fillNotes = useCallback(() => {
    const changed = session.fillNotes();
    if (changed) {
      rerender();
      persist(false);
    }
    return changed;
  }, [session, persist, rerender]);

  const hint = useCallback(() => {
    const step = session.hint();
    rerender();
    persist(false);
    return step;
  }, [session, persist, rerender]);

  const reset = useCallback(() => {
    session.reset();
    rerender();
    persist(true);
  }, [session, persist, rerender]);

  const clearMode = useCallback(() => {
    session.clearMode();
    rerender();
    persist(true);
  }, [session, persist, rerender]);

  return { session, version, setDigit, eraseCell, toggleNote, undo, redo, fillNotes, hint, reset, clearMode };
}
