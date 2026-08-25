import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PuzzleRecord, Step } from '../core/types';
import { levelFromPuzzleId } from '../game/puzzleBank';
import type { Settings, Stats } from '../storage/schema';
import { Board } from './Board';
import { CompletionModal } from './CompletionModal';
import { NumberPad } from './NumberPad';
import { PrintablePuzzle } from './PrintablePuzzle';
import { Timer } from './Timer';
import { Toolbar } from './Toolbar';
import { useGameSession } from './hooks/useGameSession';

interface PlaySessionProps {
  puzzle: PuzzleRecord;
  onBack: () => void;
  onNavigate: (hash: string) => void;
  settings: Settings;
  stats: Stats;
  updateStats: (updater: (prev: Stats) => Stats) => void;
}

const EMPTY_CELLS: readonly number[] = [];

function nextPuzzleHash(puzzle: PuzzleRecord): string {
  const level = levelFromPuzzleId(puzzle.id);
  const nextId = `${level}-${String(puzzle.index + 2).padStart(3, '0')}`;
  return `#/play/${nextId}`;
}

export function PlaySession({ puzzle, onBack, onNavigate, settings, stats, updateStats }: PlaySessionProps): JSX.Element {
  const [selected, setSelected] = useState<number | null>(null);
  const [noteMode, setNoteMode] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hintPreview, setHintPreview] = useState<Step | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [recordAtCompletion, setRecordAtCompletion] = useState(false);

  const { session, version, setDigit, eraseCell, toggleNote, undo, hint, reset } = useGameSession({
    puzzle,
    autoRemoveNotes: settings.autoRemoveNotes,
    paused,
  });

  const statsUpdatedRef = useRef(false);
  useEffect(() => {
    if (session.status === 'completed' && !statsUpdatedRef.current) {
      statsUpdatedRef.current = true;
      const level = levelFromPuzzleId(puzzle.id);
      const prevBest = stats[level].bestMs;
      const isNewRecord = prevBest === null || session.elapsedMs < prevBest;
      updateStats((prev) => {
        const s = prev[level];
        return {
          ...prev,
          [level]: {
            played: s.played + 1,
            completed: s.completed + 1,
            bestMs: isNewRecord ? session.elapsedMs : s.bestMs,
            totalMs: s.totalMs + session.elapsedMs,
            perfectRuns: s.perfectRuns + (session.mistakes === 0 && session.hintsUsed === 0 ? 1 : 0),
          },
        };
      });
      setRecordAtCompletion(isNewRecord);
      setShowCompletion(true);
    }
  }, [session.status]);

  const prevHintsUsedRef = useRef(session.hintsUsed);
  useEffect(() => {
    if (session.hintsUsed !== prevHintsUsedRef.current) {
      prevHintsUsedRef.current = session.hintsUsed;
      setHintPreview(null);
    }
  }, [session.hintsUsed]);

  const remaining = useMemo(() => {
    const counts = new Array(9).fill(9) as number[];
    for (let i = 0; i < 81; i++) {
      const v = session.board[i]!;
      if (v !== 0) counts[v - 1]!--;
    }
    return counts;
    // `session.board` is mutated in place, so `version` (not the array reference) is what
    // actually changes when a digit is placed -- see useGameSession's doc comment.
  }, [session.board, version]);

  const handleDigit = useCallback(
    (digit: number) => {
      if (selected === null || paused) return;
      if (noteMode) {
        toggleNote(selected, digit);
      } else if (session.board[selected] === digit) {
        eraseCell(selected);
      } else {
        setDigit(selected, digit);
      }
    },
    [selected, noteMode, paused, session.board, toggleNote, eraseCell, setDigit],
  );

  const handleErase = useCallback(() => {
    if (selected !== null && !paused) eraseCell(selected);
  }, [selected, paused, eraseCell]);

  const handleHint = useCallback(() => {
    if (paused) return;
    const step = hint();
    setHintPreview(step);
  }, [paused, hint]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleReset = useCallback(() => {
    reset();
    statsUpdatedRef.current = false;
    setSelected(null);
    setHintPreview(null);
    setShowCompletion(false);
  }, [reset]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      const target = e.target;
      if (target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === ' ') {
        e.preventDefault();
        setPaused((p) => !p);
        return;
      }
      if (paused) return;

      if (e.key >= '1' && e.key <= '9') {
        handleDigit(Number(e.key));
        return;
      }
      if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete') {
        handleErase();
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        setNoteMode((m) => !m);
        return;
      }
      if (e.key === 'u' || e.key === 'U') {
        undo();
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        handleHint();
        return;
      }
      if (selected !== null && e.key.startsWith('Arrow')) {
        e.preventDefault();
        const row = Math.floor(selected / 9);
        const col = selected % 9;
        let next = selected;
        if (e.key === 'ArrowUp') next = ((row + 8) % 9) * 9 + col;
        if (e.key === 'ArrowDown') next = ((row + 1) % 9) * 9 + col;
        if (e.key === 'ArrowLeft') next = row * 9 + ((col + 8) % 9);
        if (e.key === 'ArrowRight') next = row * 9 + ((col + 1) % 9);
        setSelected(next);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected, paused, handleDigit, handleErase, undo, handleHint]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 p-4">
      <div className="flex w-full items-center justify-between" style={{ maxWidth: 560 }}>
        <button type="button" onClick={onBack} className="text-sm text-blue-600 dark:text-blue-400">
          &larr; Quay lại
        </button>
        <Timer elapsedMs={session.elapsedMs} paused={paused} />
      </div>

      <Board
        givens={session.givens}
        board={session.board}
        notes={session.notes}
        solution={session.solution}
        version={version}
        selected={selected}
        onSelect={(idx) => !paused && setSelected(idx)}
        settings={settings}
        hintCells={hintPreview?.cells ?? EMPTY_CELLS}
      />

      {hintPreview && (
        <div
          role="status"
          className="w-full rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-700 dark:bg-amber-900/30"
          style={{ maxWidth: 560 }}
        >
          {hintPreview.explain}
        </div>
      )}

      <NumberPad remaining={remaining} noteMode={noteMode} onDigit={handleDigit} />

      <Toolbar
        noteMode={noteMode}
        onToggleNoteMode={() => setNoteMode((m) => !m)}
        onUndo={undo}
        canUndo={session.canUndo()}
        onHint={handleHint}
        paused={paused}
        onTogglePause={() => setPaused((p) => !p)}
        onPrint={handlePrint}
      />

      <PrintablePuzzle
        puzzleId={puzzle.id}
        level={levelFromPuzzleId(puzzle.id)}
        puzzleNumber={puzzle.index + 1}
        givens={puzzle.puzzle}
      />

      {showCompletion && (
        <CompletionModal
          elapsedMs={session.elapsedMs}
          mistakes={session.mistakes}
          hintsUsed={session.hintsUsed}
          isNewRecord={recordAtCompletion}
          onClose={() => setShowCompletion(false)}
          onReset={handleReset}
          onNext={() => {
            setShowCompletion(false);
            onNavigate(nextPuzzleHash(puzzle));
          }}
        />
      )}
    </div>
  );
}
