import { loadStats, saveStats, type Stats } from '../../storage/schema';
import { usePersistedState } from './usePersistedState';

export function useStats(): [Stats, (updater: (prev: Stats) => Stats) => void] {
  return usePersistedState(loadStats, saveStats);
}
