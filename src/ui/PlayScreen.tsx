import { useEffect, useState } from 'react';
import type { PuzzleRecord } from '../core/types';
import { getPuzzle } from '../game/puzzleBank';
import type { Settings, Stats } from '../storage/schema';
import { PlaySession } from './PlaySession';

interface PlayScreenProps {
  puzzleId: string;
  onBack: () => void;
  onNavigate: (hash: string) => void;
  settings: Settings;
  stats: Stats;
  updateStats: (updater: (prev: Stats) => Stats) => void;
}

export function PlayScreen({ puzzleId, onBack, onNavigate, settings, stats, updateStats }: PlayScreenProps): JSX.Element {
  const [puzzle, setPuzzle] = useState<PuzzleRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPuzzle(null);
    setError(null);
    getPuzzle(puzzleId)
      .then((p) => {
        if (!cancelled) setPuzzle(p);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [puzzleId]);

  if (error) {
    return (
      <div className="p-4">
        <button type="button" onClick={onBack} className="mb-4 text-sm text-blue-600 dark:text-blue-400">
          &larr; Quay lại
        </button>
        <p>Không tải được màn chơi: {error}</p>
      </div>
    );
  }

  if (!puzzle) {
    return <div className="p-4 text-sm text-slate-500">Đang tải...</div>;
  }

  return (
    <PlaySession
      key={puzzle.id}
      puzzle={puzzle}
      onBack={onBack}
      onNavigate={onNavigate}
      settings={settings}
      stats={stats}
      updateStats={updateStats}
    />
  );
}
