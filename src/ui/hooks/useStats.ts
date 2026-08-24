import { useCallback, useState } from 'react';
import { loadStats, saveStats, type Stats } from '../../storage/schema';

export function useStats(): [Stats, (updater: (prev: Stats) => Stats) => void] {
  const [stats, setStats] = useState<Stats>(() => loadStats());

  const update = useCallback((updater: (prev: Stats) => Stats) => {
    setStats((prev) => {
      const next = updater(prev);
      saveStats(next);
      return next;
    });
  }, []);

  return [stats, update];
}
