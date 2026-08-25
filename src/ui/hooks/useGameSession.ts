import { useCallback, useEffect, useRef, useState } from 'react';
import { GameSession } from '../../game/gameState';
import { loadGame, saveGame, saveLast } from '../../storage/schema';
import type { PuzzleRecord, Step } from '../../core/types';

interface UseGameSessionOptions {
  puzzle: PuzzleRecord;
  autoRemoveNotes: boolean;
  paused: boolean;
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
  hint: () => Step | null;
  reset: () => void;
}

const DEBOUNCE_MS = 500;

export function useGameSession({ puzzle, autoRemoveNotes, paused }: UseGameSessionOptions): GameSessionApi {
  const sessionRef = useRef<GameSession | null>(null);
  const [version, setVersion] = useState(0);
  const rerender = useCallback(() => setVersion((n) => n + 1), []);

  if (!sessionRef.current || sessionRef.current.puzzleId !== puzzle.id) {
    const opts = { puzzleId: puzzle.id, puzzle: puzzle.puzzle, solution: puzzle.solution, autoRemoveNotes };
    const saved = loadGame(puzzle.id);
    sessionRef.current =
      saved && GameSession.matchesGivens(puzzle.puzzle, saved) ? GameSession.fromSaved(opts, saved) : new GameSession(opts);
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

  useEffect(() => {
    if (session.status === 'completed' || paused) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        session.tick(1000);
        rerender();
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [session, session.status, paused, rerender]);

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

  return { session, version, setDigit, eraseCell, toggleNote, undo, hint, reset };
}
