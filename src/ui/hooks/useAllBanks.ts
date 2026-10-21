import { useEffect, useState } from 'react';
import { LEVELS } from '../../core/levels';
import type { LevelBank } from '../../core/types';
import { loadLevel } from '../../game/puzzleBank';

export interface AllBanks {
  /** All five level banks once loaded (each is cached by `loadLevel`), otherwise null. */
  banks: LevelBank[] | null;
  failed: boolean;
  retry: () => void;
}

/** Loads every level bank, for screens that look across levels (the technique lessons). */
export function useAllBanks(): AllBanks {
  const [banks, setBanks] = useState<LevelBank[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    Promise.all(LEVELS.map((level) => loadLevel(level)))
      .then((loaded) => {
        if (!cancelled) setBanks(loaded);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return { banks, failed, retry: () => setAttempt((n) => n + 1) };
}
