import { useCallback } from 'react';
import { playCue, type Cue } from '../../feedback';
import type { Settings } from '../../storage/schema';

/** A stable `cue(event)` that plays sound/vibration according to the player's settings. */
export function useFeedback(settings: Pick<Settings, 'soundEnabled' | 'hapticsEnabled'>): (cue: Cue) => void {
  const { soundEnabled, hapticsEnabled } = settings;

  return useCallback(
    (cue: Cue) => playCue(cue, { sound: soundEnabled, haptics: hapticsEnabled }),
    [soundEnabled, hapticsEnabled],
  );
}
