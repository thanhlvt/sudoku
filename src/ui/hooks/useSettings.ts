import { useCallback } from 'react';
import { loadSettings, saveSettings, type Settings } from '../../storage/schema';
import { usePersistedState } from './usePersistedState';

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const [settings, updateSettings] = usePersistedState(loadSettings, saveSettings);
  const patchSettings = useCallback(
    (patch: Partial<Settings>) => updateSettings((prev) => ({ ...prev, ...patch })),
    [updateSettings],
  );
  return [settings, patchSettings];
}
