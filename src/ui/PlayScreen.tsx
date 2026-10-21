import { ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PuzzleRecord } from '../core/types';
import { levelFromPuzzleId, loadLevel } from '../game/puzzleBank';
import type { WeeklyWeek } from '../game/weekly';
import type { DailyState, GameMode, Settings, Stats } from '../storage/schema';
import { PlaySession } from './PlaySession';

interface PlayScreenProps {
  puzzleId: string;
  onNavigate: (hash: string, replace?: boolean) => void;
  settings: Settings;
  stats: Stats;
  updateStats: (updater: (prev: Stats) => Stats) => void;
  dailyId: string | null;
  today: string;
  daily: DailyState;
  updateDaily: (updater: (prev: DailyState) => DailyState) => void;
  /** Challenge rules requested by the link, applied only to a puzzle with no saved game. */
  mode?: GameMode;
  /** This week's challenge puzzles, to credit a solve towards it. */
  weekly: WeeklyWeek | null;
}

interface Loaded {
  puzzle: PuzzleRecord;
  levelCount: number;
}

export function PlayScreen({ puzzleId, onNavigate, ...rest }: PlayScreenProps): JSX.Element {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoaded(null);
    setError(null);
    loadLevel(levelFromPuzzleId(puzzleId))
      .then((bank) => {
        if (cancelled) return;
        const puzzle = bank.puzzles.find((p) => p.id === puzzleId);
        if (puzzle) setLoaded({ puzzle, levelCount: bank.puzzles.length });
        else setError(`Puzzle not found: ${puzzleId}`);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [puzzleId, attempt]);

  // Back goes up one level: the puzzle's level list (the home screen is one more step up).
  const goBack = (): void => onNavigate(`#/level/${levelFromPuzzleId(puzzleId)}`, true);

  if (error) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-5">
        <button type="button" onClick={() => onNavigate('#/', true)} aria-label="Quay lại" className="btn btn-white btn-icon !h-12 !w-12 !rounded-2xl">
          <ChevronLeft size={28} strokeWidth={3.5} aria-hidden="true" className="text-accent" />
        </button>
        <p className="text-lg font-bold">Không tải được màn chơi: {error}</p>
        <button type="button" onClick={() => setAttempt((n) => n + 1)} className="btn btn-primary min-h-12 self-start px-6">
          Thử lại
        </button>
      </main>
    );
  }

  if (!loaded) {
    return <div className="flex flex-1 items-center justify-center p-5 text-lg font-bold text-accent">Đang tải...</div>;
  }

  return (
    <PlaySession
      key={loaded.puzzle.id}
      puzzle={loaded.puzzle}
      levelCount={loaded.levelCount}
      onBack={goBack}
      onNavigate={onNavigate}
      {...rest}
    />
  );
}
