import { ChevronLeft, Hourglass, Lightbulb, Share2, Pause, Play, Printer, RotateCcw, Target } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PuzzleRecord, Step } from '../core/types';
import { completeDaily } from '../game/daily';
import { MODE_INFO } from '../game/modes';
import { explainText } from '../game/explain';
import { PALETTES } from '../game/palettes';
import { pickFreshIndex, starsFor } from '../game/progress';
import { levelFromPuzzleId, puzzleIdOf } from '../game/puzzleBank';
import { buildResultText } from '../game/shareText';
import { isTechniqueId, techniqueLabel } from '../game/techniqueInfo';
import { completedUnitCells } from '../game/unitComplete';
import { WEEKLY_BONUS_XP, weeklyProgress, type WeeklyWeek } from '../game/weekly';
import { playerLevel, totalXp, xpForSolve } from '../game/xp';
import { formatDayMonth } from '../i18n/format';
import { useI18n } from '../i18n/useI18n';
import { isNative } from '../native';
import { puzzleUrl, shareContent, shareFile } from '../share';
import { renderPuzzleImage, renderResultImage } from '../shareImage';
import { listGames, loadWeekly, saveWeekly, type DailyState, type GameMode, type Settings, type Stats } from '../storage/schema';
import { Board } from './Board';
import { CompletionScreen, type CompletionReward } from './CompletionScreen';
import { Hearts } from './Hearts';
import { NumberPad } from './NumberPad';
import { PrintablePuzzle } from './PrintablePuzzle';
import { Timer } from './Timer';
import { Toolbar } from './Toolbar';
import { LEVEL_THEME, levelLabel } from './levelLabels';
import { useAchievements } from './hooks/useAchievements';
import { useFeedback } from './hooks/useFeedback';
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
  /** Challenge rules to start this puzzle under (from the link). Ignored when a saved game exists. */
  mode?: GameMode;
  /** This week's challenge puzzles, so finishing one counts towards it. */
  weekly: WeeklyWeek | null;
}

const EMPTY_CELLS: readonly number[] = [];
/** Delay before the result screen so the final digit's pop and ripple can be seen first. */
const COMPLETION_DELAY_MS = 750;
const WAVE_DURATION_MS = 1100;
const REPEATABLE_KEY = /^(Arrow(Up|Down|Left|Right)|Backspace|Delete|u|U|r|R)$/;
/** Shift+digit reports the shifted symbol in `key`, so the digit is read from the physical key instead. */
const SHIFT_DIGIT_CODE = /^(?:Digit|Numpad)([1-9])$/;

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
  mode,
  weekly,
}: PlaySessionProps): JSX.Element {
  const { t, intlLocale } = useI18n();
  const level = levelFromPuzzleId(puzzle.id);
  const theme = LEVEL_THEME[level];

  const [selected, setSelected] = useState<number | null>(null);
  const [noteMode, setNoteMode] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hintPreview, setHintPreview] = useState<Step | null>(null);
  const [wave, setWave] = useState<ReadonlyMap<number, number> | null>(null);
  const [recordAtCompletion, setRecordAtCompletion] = useState(false);
  const [reward, setReward] = useState<CompletionReward | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const { check: checkAchievements } = useAchievements();

  const { session, version, setDigit, eraseCell, toggleNote, undo, redo, fillNotes, hint, reset, clearMode } = useGameSession({
    puzzle,
    autoRemoveNotes: settings.autoRemoveNotes,
    paused,
    mode,
  });

  // A lost challenge attempt (time up, or a mistake under "no mistakes") locks the board until the player chooses.
  const failure = session.failure();
  const failureRef = useRef(failure);

  const cue = useFeedback(settings);
  const cueRef = useRef(cue);
  cueRef.current = cue;

  // The preview only counts while the session still holds that step: any edit to the board discards it.
  const shownHint = session.hasPendingHint() ? hintPreview : null;
  const hintText = shownHint ? explainText(shownHint.explain, t) : '';

  // Reopening a finished puzzle shows its result right away instead of re-awarding it.
  const [showCompletion, setShowCompletion] = useState(session.status === 'completed');
  const statsUpdatedRef = useRef(session.status === 'completed');
  /** Reopening a finished puzzle skips the victory jingle; finishing it (again) plays it. */
  const openedCompletedRef = useRef(session.status === 'completed');

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
    const dailyResult = puzzle.id === dailyId ? completeDaily(daily, today) : null;
    if (dailyResult) updateDaily((d) => completeDaily(d, today).next);
    setRecordAtCompletion(isNewRecord);

    // Everything below reads storage, which the writes above and the session's own save have already updated.
    const xp = xpForSolve(level, session.mistakes, session.mode);

    // This week's challenge: credit the puzzle, and pay out once when the fifth is solved.
    let weeklyReward: CompletionReward['weekly'] = null;
    if (weekly && weekly.ids.includes(puzzle.id)) {
      const done = weeklyProgress(weekly.key, weekly.ids.map((id) => ({ id })), listGames()).filter(Boolean).length;
      const record = loadWeekly();
      const finishedNow = done === weekly.ids.length && !record.done.includes(weekly.key);
      if (finishedNow) saveWeekly({ done: [...record.done, weekly.key] });
      weeklyReward = { done, total: weekly.ids.length, bonusXp: finishedNow ? WEEKLY_BONUS_XP : null };
    }

    const xpAfter = totalXp(listGames(), loadWeekly().done.length);
    const before = playerLevel(Math.max(0, xpAfter - xp - (weeklyReward?.bonusXp ?? 0))).level;
    const after = playerLevel(xpAfter).level;
    const palette = after > before ? PALETTES.find((p) => p.unlockLevel > before && p.unlockLevel <= after) : undefined;
    setReward({
      xp,
      levelUp: after > before ? after : null,
      paletteUnlocked: palette?.labelKey ?? null,
      achievements: checkAchievements(),
      streakMilestone: dailyResult?.milestone ?? null,
      freezeUsed: dailyResult?.freezeUsed ?? false,
      freezeEarned: dailyResult?.freezeEarned ?? false,
      mode: session.mode ?? null,
      weekly: weeklyReward,
    });
    // Keyed on the status only: just the transition to "completed" may award anything.
  }, [session.status]);

  useEffect(() => {
    if (session.status !== 'completed') {
      setShowCompletion(false);
      openedCompletedRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      setShowCompletion(true);
      if (!openedCompletedRef.current) cueRef.current('win');
    }, COMPLETION_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [session.status]);

  useEffect(() => {
    if (failure === 'time-up' && failureRef.current !== 'time-up') cueRef.current('error');
    failureRef.current = failure;
  }, [failure]);

  const waveTimerRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (waveTimerRef.current !== null) window.clearTimeout(waveTimerRef.current);
    },
    [],
  );
  const rippleUnitsThrough = useCallback(
    (indices: readonly number[]): boolean => {
      const merged = new Map<number, number>();
      for (const idx of indices) {
        for (const [cell, steps] of completedUnitCells(session.board, session.solution, idx)) {
          const known = merged.get(cell);
          if (known === undefined || steps < known) merged.set(cell, steps);
        }
      }
      if (merged.size === 0) return false;
      setWave(merged);
      if (waveTimerRef.current !== null) window.clearTimeout(waveTimerRef.current);
      waveTimerRef.current = window.setTimeout(() => setWave(null), WAVE_DURATION_MS);
      return true;
    },
    [session],
  );

  // `quick` (a held digit key / Shift) flips the note mode for this one entry.
  const handleDigit = useCallback(
    (digit: number, quick = false) => {
      if (selected === null || paused || showCompletion || failure || session.isGiven(selected)) return;
      if (noteMode !== quick) {
        if (session.board[selected] !== 0) return;
        toggleNote(selected, digit);
        cue('note');
      } else if (session.board[selected] === digit) {
        eraseCell(selected);
        cue('erase');
      } else {
        const mistakesBefore = session.mistakes;
        setDigit(selected, digit);
        const completedUnit = rippleUnitsThrough([selected]);
        cue(session.mistakes > mistakesBefore ? 'error' : completedUnit ? 'unit' : 'place');
      }
    },
    [selected, noteMode, paused, showCompletion, failure, session, toggleNote, eraseCell, setDigit, rippleUnitsThrough, cue],
  );

  const handleErase = useCallback(() => {
    if (selected === null || paused || showCompletion || failure) return;
    if (session.isGiven(selected) || session.board[selected] === 0) return;
    eraseCell(selected);
    cue('erase');
  }, [selected, paused, showCompletion, failure, session, eraseCell, cue]);

  const handleUndo = useCallback(() => {
    if (paused || showCompletion || failure || !session.canUndo()) return;
    undo();
    cue('undo');
  }, [paused, showCompletion, failure, session, undo, cue]);

  const handleRedo = useCallback(() => {
    if (paused || showCompletion || failure || !session.canRedo()) return;
    redo();
    cue('undo');
  }, [paused, showCompletion, failure, session, redo, cue]);

  const handleFillNotes = useCallback(() => {
    if (paused || showCompletion || failure) return;
    if (fillNotes()) cue('hint');
  }, [paused, showCompletion, failure, fillNotes, cue]);

  const canErase = selected !== null && !paused && !failure && !session.isGiven(selected) && session.board[selected] !== 0;

  const handleHint = useCallback(() => {
    if (paused || showCompletion || failure) return;
    const applying = session.hasPendingHint();
    const step = hint();
    setHintPreview(step);
    if (!step) return;
    if (applying) cue(rippleUnitsThrough(step.placements.map((p) => p.idx)) ? 'unit' : 'place');
    else cue('hint');
  }, [paused, showCompletion, failure, session, hint, rippleUnitsThrough, cue]);

  const handleSelect = useCallback((idx: number) => {
    if (!paused && !failure) setSelected(idx);
  }, [paused, failure]);

  const handleReset = useCallback(() => {
    reset();
    statsUpdatedRef.current = false;
    setReward(null);
    setShareNote(null);
    setSelected(null);
    setHintPreview(null);
    setShowCompletion(false);
    setPaused(false);
  }, [reset]);

  const handleResetClick = useCallback(() => {
    if (window.confirm(t('play.resetConfirm'))) {
      handleReset();
    }
  }, [handleReset, t]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      const target = e.target;
      if (target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (showCompletion || failure) return;

      // A held key auto-repeats; for toggling actions that would flip a cell back and forth dozens of times
      // a second. Moving, erasing and undoing are fine to repeat.
      if (e.repeat && !REPEATABLE_KEY.test(e.key)) {
        if (e.key === ' ') e.preventDefault();
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if (k === 'y' || (k === 'z' && e.shiftKey)) {
          e.preventDefault();
          handleRedo();
        }
        return;
      }
      if (e.altKey) return;

      if (e.key === ' ') {
        // A focused button would otherwise also "click" on Space.
        e.preventDefault();
        setPaused((p) => !p);
        return;
      }
      if (paused) return;

      if (e.key >= '1' && e.key <= '9') {
        handleDigit(Number(e.key), e.shiftKey);
        return;
      }
      if (e.shiftKey) {
        const shifted = SHIFT_DIGIT_CODE.exec(e.code);
        if (shifted) {
          handleDigit(Number(shifted[1]), true);
          return;
        }
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
        handleUndo();
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        handleRedo();
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        handleFillNotes();
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
  }, [selected, paused, showCompletion, failure, handleDigit, handleErase, handleUndo, handleRedo, handleFillNotes, handleHint]);

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

  const handleShareResult = useCallback(async () => {
    const result = {
      levelLabel: levelLabel(level, t),
      puzzleNumber: number,
      stars: starsFor(session.mistakes),
      elapsedMs: session.elapsedMs,
      mistakes: session.mistakes,
      hintsUsed: session.hintsUsed,
      daily: puzzle.id === dailyId ? { date: today, streak: daily.streak } : undefined,
    };
    const formatDay = (key: string): string => formatDayMonth(key, intlLocale);
    const url = puzzleUrl(puzzle.id);
    let image: Blob;
    try {
      image = await renderResultImage({ ...result, givens: puzzle.puzzle, solution: puzzle.solution }, t, formatDay);
    } catch {
      // No canvas (very old WebView): share the result as text rather than not at all.
      const text = buildResultText({ ...result, url }, t, formatDay);
      const outcome = await shareContent({ title: t('play.shareTitle'), text });
      setShareNote(outcome === 'copied' ? t('play.copiedResult') : outcome === 'failed' ? t('play.shareFailed') : null);
      return;
    }
    const outcome = await shareFile({
      title: t('play.shareTitle'),
      filename: `sudoku-${puzzle.id}.png`,
      blob: image,
      text: url ?? undefined,
    });
    setShareNote(outcome === 'downloaded' ? t('play.savedImage') : outcome === 'failed' ? t('play.shareFailed') : null);
  }, [level, number, session, puzzle.id, puzzle.puzzle, puzzle.solution, dailyId, today, daily.streak, t, intlLocale]);

  const handleSharePuzzle = useCallback(async () => {
    const url = puzzleUrl(puzzle.id);
    const invite = t('play.shareInvite', { level: levelLabel(level, t), n: number });
    let image: Blob;
    try {
      image = await renderPuzzleImage({ levelLabel: levelLabel(level, t), puzzleNumber: number, givens: puzzle.puzzle }, t);
    } catch {
      // No canvas (very old WebView): fall back to the link.
      const outcome = await shareContent({ title: t('play.shareTitle'), text: invite, url });
      setShareNote(outcome === 'copied' ? t('play.copiedLink') : outcome === 'failed' ? t('play.shareFailed') : null);
      return;
    }
    const outcome = await shareFile({
      title: t('play.shareTitle'),
      filename: `sudoku-${puzzle.id}-puzzle.png`,
      blob: image,
      text: url ? `${invite}
${url}` : invite,
    });
    setShareNote(outcome === 'downloaded' ? t('play.savedImage') : outcome === 'failed' ? t('play.shareFailed') : null);
  }, [level, number, puzzle.id, puzzle.puzzle, t]);

  const hardest = (puzzle.rating as { hardest?: unknown } | undefined)?.hardest;
  const technique =
    isTechniqueId(hardest)
      ? { label: techniqueLabel(hardest, t), onLearn: () => onNavigate(`#/learn/${hardest}`) }
      : null;

  const goBack = (): void => (session.mode ? onNavigate('#/modes', true) : onBack());

  // Where "next" leads: the week's next unfinished puzzle, another fresh puzzle in the same challenge mode, or the
  // level's following puzzle.
  const next = ((): { label?: string; hasNext: boolean; go: () => void } => {
    if (!showCompletion) return { hasNext, go: () => {} }; // reads storage: only needed once the result is up
    if (weekly && weekly.ids.includes(puzzle.id)) {
      const games = listGames();
      const done = weeklyProgress(weekly.key, weekly.ids.map((id) => ({ id })), games);
      const nextId = weekly.ids.find((_, i) => !done[i]);
      if (nextId) return { label: t('play.nextWeekly'), hasNext: true, go: () => onNavigate(`#/play/${nextId}`, true) };
    }
    if (session.mode) {
      const mode = session.mode;
      const fresh = pickFreshIndex(level, levelCount, new Map(listGames().map((g) => [g.puzzleId, g])));
      return {
        hasNext: fresh !== null,
        go: () => onNavigate(fresh === null ? '#/modes' : `#/play/${puzzleIdOf(level, fresh)}/${mode}`, true),
      };
    }
    return { hasNext, go: () => onNavigate(`#/play/${puzzleIdOf(level, puzzle.index + 1)}`, true) };
  })();

  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pb-6 pt-4 [@media(max-height:700px)]:gap-2.5 [@media(max-height:700px)]:pb-4 [@media(max-height:700px)]:pt-3">
      <header className="grid grid-cols-[3rem_1fr_3rem] items-center">
        <button type="button" onClick={goBack} aria-label={t('common.back')} className="btn btn-white btn-icon !h-12 !w-12 !rounded-2xl">
          <ChevronLeft size={28} strokeWidth={3.5} aria-hidden="true" className="text-accent" />
        </button>
        <div className="flex flex-col items-center gap-1">
          <span className={`rounded-full px-4 py-1 text-xs font-black uppercase tracking-wide text-white ${theme.bg}`}>
            {levelLabel(level, t)}
          </span>
          <h1 className="text-2xl font-black leading-none">{t('common.puzzleNumber', { n: number })}</h1>
        </div>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={t(paused ? 'play.resumeAria' : 'play.pauseAria')}
          className="btn btn-white btn-icon !h-12 !w-12 !rounded-2xl"
        >
          {paused ? (
            <Play size={22} strokeWidth={0} className="fill-accent" aria-hidden="true" />
          ) : (
            <Pause size={22} strokeWidth={0} className="fill-accent" aria-hidden="true" />
          )}
        </button>
      </header>

      {session.mode && (
        <p className="-mb-1 flex items-center justify-center gap-2 text-sm font-extrabold text-primary-dark dark:text-violet-300">
          {session.mode === 'time' ? (
            <Hourglass size={16} strokeWidth={3} aria-hidden="true" />
          ) : (
            <Target size={16} strokeWidth={3} aria-hidden="true" />
          )}
          {t(MODE_INFO[session.mode].labelKey)}
        </p>
      )}

      <div className="flex items-center justify-between">
        <Hearts mistakes={session.mistakes} />
        <Timer elapsedMs={session.elapsedMs} paused={paused} limitMs={session.timeLimitMs} />
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
          hintCells={shownHint?.cells ?? EMPTY_CELLS}
          wave={wave}
        />
        {failure && !paused && !showCompletion && (
          <div
            role="dialog"
            aria-label={t(failure === 'time-up' ? 'play.timeUp.aria' : 'play.wrong.aria')}
            className="absolute inset-0 z-20 flex animate-fade-in flex-col items-center justify-center gap-2 rounded-[1.5rem] bg-card p-4 text-center"
          >
            <span className="flex h-12 w-12 animate-pop-in items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300">
              {failure === 'time-up' ? (
                <Hourglass size={26} strokeWidth={2.75} aria-hidden="true" />
              ) : (
                <Target size={26} strokeWidth={2.75} aria-hidden="true" />
              )}
            </span>
            <h2 className="text-2xl font-black leading-tight">{t(failure === 'time-up' ? 'play.timeUp.title' : 'play.wrong.title')}</h2>
            <p className="mb-1 text-sm font-bold leading-snug text-accent">
              {t(failure === 'time-up' ? 'play.timeUp.body' : 'play.wrong.body')}
            </p>
            <button
              type="button"
              autoFocus
              onClick={handleReset}
              className="btn btn-primary cta-ring min-h-12 w-full max-w-xs text-lg"
            >
              <RotateCcw size={20} strokeWidth={3} aria-hidden="true" />
              {t('common.retry')}
            </button>
            <button type="button" onClick={clearMode} className="btn btn-soft min-h-11 w-full max-w-xs text-sm">
              {t('play.continueNormal')}
            </button>
            <button type="button" onClick={goBack} className="btn btn-soft min-h-11 w-full max-w-xs text-sm">
              {t('play.chooseMode')}
            </button>
          </div>
        )}
        {paused && (
          <div
            role="dialog"
            aria-label={t('play.paused')}
            className="absolute inset-0 z-20 flex animate-fade-in flex-col items-center justify-center gap-3 rounded-[1.5rem] bg-card p-6"
          >
            <span className="flex h-16 w-16 animate-pop-in items-center justify-center rounded-full bg-page">
              <Pause size={32} strokeWidth={0} className="fill-primary" aria-hidden="true" />
            </span>
            <h2 className="mb-2 text-2xl font-black">{t('play.paused')}</h2>
            <button
              type="button"
              autoFocus
              onClick={() => setPaused(false)}
              className="btn btn-primary cta-ring min-h-14 w-full max-w-xs text-lg"
            >
              <Play size={20} strokeWidth={0} className="fill-white" aria-hidden="true" />
              {t('play.resume')}
            </button>
            <button type="button" onClick={handleResetClick} className="btn btn-soft min-h-12 w-full max-w-xs">
              <RotateCcw size={18} strokeWidth={3} aria-hidden="true" />
              {t('play.reset')}
            </button>
            <button type="button" onClick={() => void handleSharePuzzle()} className="btn btn-soft min-h-12 w-full max-w-xs">
              <Share2 size={18} strokeWidth={3} aria-hidden="true" />
              {t('play.sharePuzzle')}
            </button>
            {!isNative && (
              <button type="button" onClick={() => window.print()} className="btn btn-soft min-h-12 w-full max-w-xs">
                <Printer size={18} strokeWidth={3} aria-hidden="true" />
                {t('play.print')}
              </button>
            )}
            {shareNote && (
              <p role="status" className="text-sm font-extrabold text-accent">
                {shareNote}
              </p>
            )}
          </div>
        )}
      </div>

      {shownHint && (
        <div
          key={hintText}
          role="status"
          className="flex animate-screen-in items-start gap-3 rounded-2xl bg-amber-100 p-4 text-amber-950 shadow-[0_4px_0_0_#FCD34D] dark:bg-amber-900/40 dark:text-amber-50 dark:shadow-[0_4px_0_0_#92400E]"
        >
          <Lightbulb size={24} strokeWidth={2.75} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden="true" />
          <div>
            <p className="mb-0.5 text-xs font-black uppercase tracking-wide opacity-70">{techniqueLabel(shownHint.technique, t)}</p>
            <p className="text-base font-extrabold leading-snug">{hintText}</p>
            <p className="mt-1 text-sm font-bold opacity-80">{t('play.hintApply')}</p>
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-5 pt-2 [@media(max-height:700px)]:gap-3 [@media(max-height:700px)]:pt-0">
        <Toolbar
          noteMode={noteMode}
          onToggleNoteMode={() => setNoteMode((m) => !m)}
          onUndo={handleUndo}
          canUndo={session.canUndo() && !paused}
          onRedo={handleRedo}
          canRedo={session.canRedo() && !paused}
          onErase={handleErase}
          canErase={canErase}
          onFillNotes={handleFillNotes}
          onHint={handleHint}
          hintPending={shownHint !== null}
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
          reward={reward}
          technique={technique}
          shareNote={shareNote}
          onShare={() => void handleShareResult()}
          hasNext={next.hasNext}
          nextLabel={next.label}
          onNext={next.go}
          onReplay={handleReset}
          onList={() => onNavigate(`#/level/${level}`, true)}
        />
      )}
    </main>
  );
}
