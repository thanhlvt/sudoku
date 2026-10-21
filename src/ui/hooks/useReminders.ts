import { useEffect, useState } from 'react';
import { currentStreak, isDailyDone } from '../../game/daily';
import { planReminders } from '../../game/reminders';
import { applyReminders, cancelReminders, remindersSupported } from '../../notifications';
import type { DailyState } from '../../storage/schema';
import { useI18n } from '../../i18n/useI18n';

interface UseRemindersOptions {
  enabled: boolean;
  today: string;
  daily: DailyState;
  /** How many puzzles the player has finished. The first one is when the permission dialog may appear. */
  solvedCount: number;
}

/**
 * Keeps the scheduled daily-challenge reminders in step with the player: switched off, they are cancelled; on,
 * they are re-planned whenever the streak, today's challenge or the date changes, and when the app returns to
 * the foreground. Today's reminder disappears as soon as today's challenge is done.
 */
export function useReminders({ enabled, today, daily, solvedCount }: UseRemindersOptions): void {
  const { t } = useI18n();
  // Bumped when the app comes back to the foreground, so a long-lived page re-plans against the real clock.
  const [foreground, setForeground] = useState(0);

  useEffect(() => {
    if (!remindersSupported) return;
    const onVisible = (): void => {
      if (document.visibilityState === 'visible') setForeground((n) => n + 1);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const dailyDone = isDailyDone(daily, today);
  const streak = currentStreak(daily, today);
  const asked = solvedCount > 0;

  useEffect(() => {
    if (!remindersSupported) return;
    if (!enabled) {
      void cancelReminders();
      return;
    }
    // The notification text is fixed when it is scheduled, so a language switch re-plans it (`t` changes with it).
    void applyReminders(planReminders({ now: new Date(), dailyDone, streak }, t), asked);
  }, [enabled, today, dailyDone, streak, asked, foreground, t]);
}
