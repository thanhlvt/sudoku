/** When and what to remind the player of. Pure: the clock, the player's state and the translator are passed in. */
import type { MessageKey, Translate } from '../i18n';

/** Local hour of the evening reminder. */
export const REMINDER_HOUR = 20;
/** How many days ahead reminders are scheduled. They are re-planned every time the app opens, so a player who
 *  stays away is reminded for a week and then left alone. */
export const REMINDER_DAYS = 7;
/** Notification ids are `REMINDER_ID_BASE + dayOffset`, a range reserved for these reminders. */
export const REMINDER_ID_BASE = 7100;

export interface PlannedReminder {
  id: number;
  at: Date;
  title: string;
  body: string;
}

export interface ReminderState {
  now: Date;
  /** Today's daily challenge is already finished. */
  dailyDone: boolean;
  /** The streak as shown today (0 when it has lapsed). */
  streak: number;
}

const GENERIC: readonly { title: MessageKey; body: MessageKey }[] = [
  { title: 'reminder.generic.1.title', body: 'reminder.generic.1.body' },
  { title: 'reminder.generic.2.title', body: 'reminder.generic.2.body' },
  { title: 'reminder.generic.3.title', body: 'reminder.generic.3.body' },
];

function message(
  offset: number,
  firstOffset: number,
  streak: number,
  dailyDone: boolean,
  t: Translate,
): { title: string; body: string } {
  // Only the first reminder can promise a streak: later ones would be after a missed day.
  if (offset === firstOffset && streak > 0) {
    const params = { streak, next: streak + 1 };
    return dailyDone || offset > 0
      ? { title: t('reminder.waiting.title', params), body: t('reminder.waiting.body', params) }
      : { title: t('reminder.keep.title', params), body: t('reminder.keep.body', params) };
  }
  const generic = GENERIC[offset % GENERIC.length]!;
  return { title: t(generic.title), body: t(generic.body) };
}

/**
 * Reminders for the next `REMINDER_DAYS` days at `REMINDER_HOUR`. Today's is left out when the challenge is done
 * or the hour has passed, since a reminder for something already finished is just noise.
 */
export function planReminders({ now, dailyDone, streak }: ReminderState, t: Translate): PlannedReminder[] {
  const plan: PlannedReminder[] = [];
  let firstOffset = -1;
  for (let offset = 0; offset < REMINDER_DAYS + 1 && plan.length < REMINDER_DAYS; offset++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, REMINDER_HOUR, 0, 0, 0);
    if (at.getTime() <= now.getTime()) continue;
    if (offset === 0 && dailyDone) continue;
    if (firstOffset < 0) firstOffset = offset;
    plan.push({ id: REMINDER_ID_BASE + offset, at, ...message(offset, firstOffset, streak, dailyDone, t) });
  }
  return plan;
}
