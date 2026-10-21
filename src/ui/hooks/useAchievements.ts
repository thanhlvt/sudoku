import { useCallback, useState } from 'react';
import { unlockNew, type AchievementDef, type UnlockedMap } from '../../game/achievements';
import { listGames, loadAchievements, loadDaily, loadStats, saveAchievements } from '../../storage/schema';

/**
 * The achievements the player has unlocked (id -> when), and `check()` to find out whether anything new was
 * just earned. `check` reads games, stats and the daily streak straight from storage, so it sees the result
 * of a puzzle that was saved a moment ago even though this hook's caller still holds older props.
 */
export function useAchievements(): { unlocked: UnlockedMap; check: () => AchievementDef[] } {
  const [unlocked, setUnlocked] = useState<UnlockedMap>(loadAchievements);

  const check = useCallback((): AchievementDef[] => {
    const stored = loadAchievements();
    const result = unlockNew(stored, { games: listGames(), stats: loadStats(), daily: loadDaily() }, Date.now());
    if (result.unlocked !== stored) saveAchievements(result.unlocked);
    setUnlocked(result.unlocked);
    return result.added;
  }, []);

  return { unlocked, check };
}
