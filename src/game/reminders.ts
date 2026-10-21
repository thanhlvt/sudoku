/** When and what to remind the player of. Pure: the clock and the player's state are passed in. */

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

const GENERIC: readonly { title: string; body: string }[] = [
  { title: 'Thử thách hôm nay đang chờ bạn', body: 'Một màn Sudoku mới, giải bằng suy luận, chỉ vài phút thôi.' },
  { title: 'Đến giờ luyện trí não', body: 'Hoàn thành thử thách hằng ngày để mở thành tựu mới.' },
  { title: 'Một màn Sudoku nhé?', body: 'Thử thách hôm nay đã sẵn sàng.' },
];

function message(offset: number, firstOffset: number, streak: number, dailyDone: boolean): { title: string; body: string } {
  // Only the first reminder can promise a streak: later ones would be after a missed day.
  if (offset === firstOffset && streak > 0) {
    return dailyDone || offset > 0
      ? { title: `Chuỗi ${streak} ngày đang chờ bạn`, body: `Làm thử thách hôm nay để kéo dài thành ${streak + 1} ngày.` }
      : { title: `Giữ chuỗi ${streak} ngày!`, body: `Làm thử thách hôm nay để chuỗi thành ${streak + 1} ngày.` };
  }
  return GENERIC[offset % GENERIC.length]!;
}

/**
 * Reminders for the next `REMINDER_DAYS` days at `REMINDER_HOUR`. Today's is left out when the challenge is done
 * or the hour has passed, since a reminder for something already finished is just noise.
 */
export function planReminders({ now, dailyDone, streak }: ReminderState): PlannedReminder[] {
  const plan: PlannedReminder[] = [];
  let firstOffset = -1;
  for (let offset = 0; offset < REMINDER_DAYS + 1 && plan.length < REMINDER_DAYS; offset++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, REMINDER_HOUR, 0, 0, 0);
    if (at.getTime() <= now.getTime()) continue;
    if (offset === 0 && dailyDone) continue;
    if (firstOffset < 0) firstOffset = offset;
    plan.push({ id: REMINDER_ID_BASE + offset, at, ...message(offset, firstOffset, streak, dailyDone) });
  }
  return plan;
}
