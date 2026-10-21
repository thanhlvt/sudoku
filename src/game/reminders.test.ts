import { describe, expect, it } from 'vitest';
import { translator } from '../i18n';
import { REMINDER_DAYS, REMINDER_HOUR, REMINDER_ID_BASE, planReminders } from './reminders';

const t = translator('vi');

const at = (y: number, m: number, d: number, h: number, min = 0): Date => new Date(y, m - 1, d, h, min);

describe('planReminders', () => {
  it('schedules today (if the hour is still ahead) and the following days at the reminder hour', () => {
    const plan = planReminders({ now: at(2026, 10, 21, 9), dailyDone: false, streak: 0 }, t);
    expect(plan).toHaveLength(REMINDER_DAYS);
    expect(plan[0]!.at).toEqual(at(2026, 10, 21, REMINDER_HOUR));
    expect(plan[1]!.at).toEqual(at(2026, 10, 22, REMINDER_HOUR));
    expect(plan.at(-1)!.at).toEqual(at(2026, 10, 27, REMINDER_HOUR));
  });

  it('skips today once the hour has passed', () => {
    const plan = planReminders({ now: at(2026, 10, 21, 21), dailyDone: false, streak: 0 }, t);
    expect(plan[0]!.at).toEqual(at(2026, 10, 22, REMINDER_HOUR));
    expect(plan).toHaveLength(REMINDER_DAYS);
  });

  it('skips today when the daily challenge is already done', () => {
    const plan = planReminders({ now: at(2026, 10, 21, 9), dailyDone: true, streak: 3 }, t);
    expect(plan[0]!.at).toEqual(at(2026, 10, 22, REMINDER_HOUR));
  });

  it('does not schedule a reminder in the past or at this very moment', () => {
    const plan = planReminders({ now: at(2026, 10, 21, REMINDER_HOUR), dailyDone: false, streak: 0 }, t);
    expect(plan[0]!.at.getDate()).toBe(22);
  });

  it('uses distinct ids in the reserved range', () => {
    const plan = planReminders({ now: at(2026, 10, 21, 9), dailyDone: false, streak: 0 }, t);
    const ids = plan.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Math.min(...ids)).toBeGreaterThanOrEqual(REMINDER_ID_BASE);
  });

  it('only the first reminder talks about the streak', () => {
    const plan = planReminders({ now: at(2026, 10, 21, 9), dailyDone: false, streak: 6 }, t);
    expect(plan[0]!.title).toContain('6 ngày');
    expect(plan[0]!.body).toContain('7 ngày');
    for (const p of plan.slice(1)) expect(p.title + p.body).not.toMatch(/Chuỗi|chuỗi/);
  });

  it('has no streak wording for a player without a streak', () => {
    for (const p of planReminders({ now: at(2026, 10, 21, 9), dailyDone: false, streak: 0 }, t)) {
      expect(p.title + p.body).not.toMatch(/chuỗi/i);
    }
  });

  it('stays correct across a month boundary', () => {
    const plan = planReminders({ now: at(2026, 10, 30, 9), dailyDone: false, streak: 0 }, t);
    expect(plan.map((p) => `${p.at.getMonth() + 1}/${p.at.getDate()}`)).toEqual([
      '10/30',
      '10/31',
      '11/1',
      '11/2',
      '11/3',
      '11/4',
      '11/5',
    ]);
  });
});
