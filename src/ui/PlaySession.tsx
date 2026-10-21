import { ChevronLeft, Lightbulb, Pause, Play, Printer, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PuzzleRecord, Step } from '../core/types';
import { recordDailyCompletion } from '../game/daily';
import { starsFor } from '../game/progress';
import { levelFromPuzzleId, puzzleIdOf } from '../game/puzzleBank';
import { completedUnitCells } from '../game/unitComplete';
import { isNative } from '../native';
import type { DailyState, Settings, Stats } from '../storage/schema';
import { Board } from './Board';
import { CompletionScreen } from './CompletionScreen';
import { Hearts } from './Hearts';
import { NumberPad } from './NumberPad';
import { PrintablePuzzle } from './PrintablePuzzle';
import { Timer } from './Timer';
import { Toolbar } from './Toolbar';
import { LEVEL_LABELS, LEVEL_THEME } from './levelLabels';
import { useGameSession } from './hooks/useGameSession';

interface PlaySessionProps {
  puzzle: PuzzleRecord;
  /** How many puzzles the level has, to know whether a "next" one exists. */
  levelCount: number;
  onBack: () => void;
  /** `replace` swaps the current history entry instead of adding one. */
  onNavigate: (hash: string, replace?: boolean) => void;
  settings: Settings;
  stats: Stats;
  updateStats: (updater: (prev: Stats) => Stats) => void;
  /** Id of today's daily challenge, and its streak state. */
  dailyId: string | null;
  today: string;
  daily: DailyState;
  updateDaily: (updater: (prev: DailyState) => DailyState) => void;
}

const EMPTY_CELLS: readonly number[] = [];
/** Delay before the result screen so the final digit's pop and ripple can be seen first. */
const COMPLETION_DELAY_MS = 750;
const WAVE_DURATION_MS = 1100;

export function PlaySession({
  puzzle,
  levelCount,
  onBack,
  onNavigate,
  settings,
  stats,
  updateStats,
  dailyId,
  today,
  daily,
  updateDaily,
}: PlaySessionProps): JSX.Element {
  const level = levelFromPuzzleId(puzzle.id);
  const theme = LEVEL_THEME[level];

  const [selected, setSelected] = useState<number | null>(null);
  const [noteMode, setNoteMode] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hintPreview, setHintPreview] = useState<Step | null>(null);
  const [wave, setWave] = useState<ReadonlyMap<number, number> | null>(null);
  const [recordAtCompletion, setRecordAtCompletion] = useState(false);

  const { session, version, setDigit, eraseCell, toggleNote, undo, hint, reset } = useGameSession({
    puzzle,
    autoRemoveNotes: settings.autoRemoveNotes,
    paused,
  });

  // Reopening a finished puzzle shows its result right away instead of re-awarding it.
  const [showCompletion, setShowCompletion] = useState(session.status === 'completed');
  const statsUpdatedRef = useRef(session.status === 'completed');

  useEffect(() => {
    if (session.status !== 'completed' || statsUpdatedRef.current) return;
    statsUpdatedRef.current = true;
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
    if (puzzle.id === dailyId) updateDaily((d) => recordDailyCompletion(d, today));
    setRecordAtCompletion(isNewRecord);
    // Keyed on the status only: just the transition to "completed" may award anything.
  }, [session.status]);

  useEffect(() => {
    if (session.status !== 'completed') {
      setShowCompletion(false);
      return;
    }
    const timer = window.setTimeout(() => setShowCompletion(true), COMPLETION_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [session.status]);

  const prevHintsUsedRef = useRef(session.hintsUsed);
  useEffect(() => {
    if (session.hintsUsed !== prevHintsUsedRef.current) {
      prevHintsUsedRef.current = session.hintsUsed;
      setHintPreview(null);
    }
  }, [session.hintsUsed]);

  const waveTimerRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (waveTimerRef.current !== null) window.clearTimeout(waveTimerRef.current);
    },
    [],
  );
  const rippleUnitsThrough = useCallback(
    (indices: readonly number[]) => {
      const merged = new Map<number, number>();
      for (const idx of indices) {
        for (const [cell, steps] of completedUnitCells(session.board, session.solution, idx)) {
          const known = merged.get(cell);
          if (known === undefined || steps < known) merged.set(cell, steps);
        }
      }
      if (merged.size === 0) return;
      setWave(merged);
      if (waveTimerRef.current !== null) window.clearTimeout(waveTimerRef.current);
      waveTimerRef.current = window.setTimeout(() => setWave(null), WAVE_DURATION_MS);
    },
    [session],
  );

  const handleDigit = useCallback(
    (digit: number) => {
      if (selected === null || paused || showCompletion) return;
      if (noteMode) {
        toggleNote(selected, digit);
      } else if (session.board[selected] === digit) {
        eraseCell(selected);
      } else {
        setDigit(selected, digit);
        rippleUnitsThrough([selected]);
      }
    },
    [selected, noteMode, paused, showCompletion, session, toggleNote, eraseCell, setDigit, rippleUnitsThrough],
  );

  const handleErase = useCallback(() => {
    if (selected !== null && !paused && !showCompletion) eraseCell(selected);
  }, [selected, paused, showCompletion, eraseCell]);

  const canErase = selected !== null && !paused && !session.isGiven(selected) && session.board[selected] !== 0;

  const handleHint = useCallback(() => {
    if (paused || showCompletion) return;
    const applying = hintPreview !== null;
    const step = hint();
    setHintPreview(step);
    if (applying && step) rippleUnitsThrough(step.placements.map((p) => p.idx));
  }, [paused, showCompletion, hintPreview, hint, rippleUnitsThrough]);

  const handleSelect = useCallback((idx: number) => {
    if (!paused) setSelected(idx);
  }, [paused]);

  const handleReset = useCallback(() => {
    reset();
    statsUpdatedRef.current = false;
    setSelected(null);
    setHintPreview(null);
    setShowCompletion(false);
    setPaused(false);
  }, [reset]);

  const handleResetClick = useCallback(() => {
    if (window.confirm('Đặt lại ván này? Toàn bộ số đã điền, ghi chú và thời gian sẽ bị xóa.')) {
      handleReset();
    }
  }, [handleReset]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      const target = e.target;
      if (target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (showCompletion) return;

      if (e.key === ' ') {
        // A focused button would otherwise also "click" on Space.
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
  }, [selected, paused, showCompletion, handleDigit, handleErase, undo, handleHint]);

  // How many more of each digit the board still needs (shown on the number pad).
  const remaining = useMemo(() => {
    const left = new Array<number>(10).fill(9);
    for (let i = 0; i < 81; i++) {
      const v = session.board[i]!;
      if (v !== 0) left[v]!--;
    }
    return left;
    // `session.board` is mutated in place; `version` is what signals a change.
  }, [session, version]);

  const number = puzzle.index + 1;
  const hasNext = number < levelCount;

  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pb-6 pt-4 [@media(max-height:700px)]:gap-2.5 [@media(max-height:700px)]:pb-4 [@media(max-height:700px)]:pt-3">
      <header className="grid grid-cols-[3rem_1fr_3rem] items-center">
        <button type="button" onClick={onBack} aria-label="Quay lại" className="btn btn-white btn-icon !h-12 !w-12 !rounded-2xl">
          <ChevronLeft size={28} strokeWidth={3.5} aria-hidden="true" className="text-accent" />
        </button>
        <div className="flex flex-col items-center gap-1">
          <span className={`rounded-full px-4 py-1 text-xs font-black uppercase tracking-wide text-white ${theme.bg}`}>
            {LEVEL_LABELS[level]}
          </span>
          <h1 className="text-2xl font-black leading-none">Màn {number}</h1>
        </div>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'Tiếp tục (Space)' : 'Tạm dừng (Space)'}
          className="btn btn-white btn-icon !h-12 !w-12 !rounded-2xl"
        >
          {paused ? (
            <Play size={22} strokeWidth={0} className="fill-accent" aria-hidden="true" />
          ) : (
            <Pause size={22} strokeWidth={0} className="fill-accent" aria-hidden="true" />
          )}
        </button>
      </header>

      <div className="flex items-center justify-between">
        <Hearts mistakes={session.mistakes} />
        <Timer elapsedMs={session.elapsedMs} paused={paused} />
      </div>

      <div className="card relative p-3">
        <Board
          givens={session.givens}
          board={session.board}
          solution={session.solution}
          notes={session.notes}
          version={version}
          selected={selected}
          onSelect={handleSelect}
          settings={settings}
          hintCells={hintPreview?.cells ?? EMPTY_CELLS}
          wave={wave}
        />
        {paused && (
          <div
            role="dialog"
            aria-label="Tạm dừng"
            className="absolute inset-0 z-20 flex animate-fade-in flex-col items-center justify-center gap-3 rounded-[1.5rem] bg-card p-6"
          >
            <span className="flex h-16 w-16 animate-pop-in items-center justify-center rounded-full bg-page">
              <Pause size={32} strokeWidth={0} className="fill-primary" aria-hidden="true" />
            </span>
            <h2 className="mb-2 text-2xl font-black">Tạm dừng</h2>
            <button
              type="button"
              autoFocus
              onClick={() => setPaused(false)}
              className="btn btn-primary cta-ring min-h-14 w-full max-w-xs text-lg"
            >
              <Play size={20} strokeWidth={0} className="fill-white" aria-hidden="true" />
              Tiếp tục
            </button>
            <button type="button" onClick={handleResetClick} className="btn btn-soft min-h-12 w-full max-w-xs">
              <RotateCcw size={18} strokeWidth={3} aria-hidden="true" />
              Đặt lại ván
            </button>
            {!isNative && (
              <button type="button" onClick={() => window.print()} className="btn btn-soft min-h-12 w-full max-w-xs">
                <Printer size={18} strokeWidth={3} aria-hidden="true" />
                In câu đố
              </button>
            )}
          </div>
        )}
      </div>

      {hintPreview && (
        <div
          key={hintPreview.explain}
          role="status"
          className="flex animate-screen-in items-start gap-3 rounded-2xl bg-amber-100 p-4 text-amber-950 shadow-[0_4px_0_0_#FCD34D] dark:bg-amber-900/40 dark:text-amber-50 dark:shadow-[0_4px_0_0_#92400E]"
        >
          <Lightbulb size={24} strokeWidth={2.75} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden="true" />
          <div>
            <p className="text-base font-extrabold leading-snug">{hintPreview.explain}</p>
            <p className="mt-1 text-sm font-bold opacity-80">Bấm “Áp dụng” để điền theo gợi ý.</p>
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-5 pt-2 [@media(max-height:700px)]:gap-3 [@media(max-height:700px)]:pt-0">
        <Toolbar
          noteMode={noteMode}
          onToggleNoteMode={() => setNoteMode((m) => !m)}
          onUndo={undo}
          canUndo={session.canUndo() && !paused}
          onErase={handleErase}
          canErase={canErase}
          onHint={handleHint}
          hintPending={hintPreview !== null}
          hintsUsed={session.hintsUsed}
        />
        <NumberPad noteMode={noteMode} remaining={remaining} onDigit={handleDigit} />
      </div>

      <PrintablePuzzle puzzleId={puzzle.id} level={level} puzzleNumber={number} givens={puzzle.puzzle} />

      {showCompletion && (
        <CompletionScreen
          level={level}
          puzzleNumber={number}
          stars={starsFor(session.mistakes)}
          elapsedMs={session.elapsedMs}
          mistakes={session.mistakes}
          hintsUsed={session.hintsUsed}
          isNewRecord={recordAtCompletion}
          dailyStreak={puzzle.id === dailyId ? daily.streak : null}
          hasNext={hasNext}
          onNext={() => onNavigate(`#/play/${puzzleIdOf(level, puzzle.index + 1)}`, true)}
          onReplay={handleReset}
          onList={() => onNavigate(`#/level/${level}`, true)}
        />
      )}
    </main>
  );
}
