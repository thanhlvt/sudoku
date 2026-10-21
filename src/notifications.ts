import { LocalNotifications } from '@capacitor/local-notifications';
import { REMINDER_DAYS, REMINDER_ID_BASE, type PlannedReminder } from './game/reminders';
import { isNative } from './native';

/**
 * Daily-challenge reminders as Android local notifications. The web build cannot schedule a notification for a
 * later time while the page is closed, so there everything here is a no-op ('unsupported') and the settings
 * screen hides the switch.
 */
export type ReminderPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

/** Resource name of the status-bar icon (android/app/src/main/res/drawable/ic_stat_sudoku.xml). */
const SMALL_ICON = 'ic_stat_sudoku';
const ICON_COLOR = '#7C3AED';

export const remindersSupported = isNative;

function normalise(state: string): ReminderPermission {
  return state === 'granted' ? 'granted' : state === 'denied' ? 'denied' : 'prompt';
}

export async function reminderPermission(): Promise<ReminderPermission> {
  if (!isNative) return 'unsupported';
  try {
    return normalise((await LocalNotifications.checkPermissions()).display);
  } catch {
    return 'denied';
  }
}

/** Shows the system permission dialog (Android 13+) when the permission has not been decided yet. */
export async function requestReminderPermission(): Promise<ReminderPermission> {
  if (!isNative) return 'unsupported';
  try {
    const current = await reminderPermission();
    if (current !== 'prompt') return current;
    return normalise((await LocalNotifications.requestPermissions()).display);
  } catch {
    return 'denied';
  }
}

const ALL_IDS = Array.from({ length: REMINDER_DAYS + 1 }, (_, i) => ({ id: REMINDER_ID_BASE + i }));

/** Removes every reminder this app has scheduled (and nothing else). */
export async function cancelReminders(): Promise<void> {
  if (!isNative) return;
  try {
    await LocalNotifications.cancel({ notifications: ALL_IDS });
  } catch {
    // Nothing scheduled, or the plugin is unavailable: either way there is nothing left to cancel.
  }
}

/**
 * Replaces the scheduled reminders with `plan`. `allowPrompt` says whether the system permission dialog may be
 * shown now; without it, a player who has not been asked yet simply gets no reminders (the plugin would
 * otherwise ask on its own the first time something is scheduled, so the check comes first).
 */
export async function applyReminders(plan: readonly PlannedReminder[], allowPrompt: boolean): Promise<ReminderPermission> {
  if (!isNative) return 'unsupported';
  let permission = await reminderPermission();
  if (permission === 'prompt' && allowPrompt) permission = await requestReminderPermission();
  if (permission !== 'granted') return permission;
  try {
    await cancelReminders();
    if (plan.length > 0) {
      await LocalNotifications.schedule({
        notifications: plan.map((r) => ({
          id: r.id,
          title: r.title,
          body: r.body,
          smallIcon: SMALL_ICON,
          iconColor: ICON_COLOR,
          // A reminder a few minutes late is fine, and an exact alarm would need a permission Play restricts.
          isExactNotification: false,
          schedule: { at: r.at, allowWhileIdle: true },
        })),
      });
    }
  } catch {
    // Scheduling is best-effort; the game does not depend on it.
  }
  return permission;
}
