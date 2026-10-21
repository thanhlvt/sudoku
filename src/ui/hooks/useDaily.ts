import { loadDaily, saveDaily, type DailyState } from '../../storage/schema';
import { usePersistedState } from './usePersistedState';

export function useDaily(): [DailyState, (updater: (prev: DailyState) => DailyState) => void] {
  return usePersistedState(loadDaily, saveDaily);
}
