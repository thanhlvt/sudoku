import { useCallback, useState } from 'react';
import { loadDaily, saveDaily, type DailyState } from '../../storage/schema';

export function useDaily(): [DailyState, (updater: (prev: DailyState) => DailyState) => void] {
  const [daily, setDaily] = useState<DailyState>(() => loadDaily());

  const update = useCallback((updater: (prev: DailyState) => DailyState) => {
    setDaily((prev) => {
      const next = updater(prev);
      if (next !== prev) saveDaily(next);
      return next;
    });
  }, []);

  return [daily, update];
}
