import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlannedReminder } from './game/reminders';

const plugin = {
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  cancel: vi.fn(),
  schedule: vi.fn(),
};

const plan: PlannedReminder[] = [
  { id: 7100, at: new Date(2026, 9, 21, 20), title: 'Giữ chuỗi 3 ngày!', body: 'Làm thử thách hôm nay.' },
  { id: 7101, at: new Date(2026, 9, 22, 20), title: 'Một màn Sudoku nhé?', body: 'Thử thách hôm nay đã sẵn sàng.' },
];

async function loadAdapter(native: boolean): Promise<typeof import('./notifications')> {
  vi.resetModules();
  vi.doMock('./native', () => ({ isNative: native }));
  vi.doMock('@capacitor/local-notifications', () => ({ LocalNotifications: plugin }));
  return import('./notifications');
}

beforeEach(() => {
  for (const fn of Object.values(plugin)) fn.mockReset();
  plugin.cancel.mockResolvedValue(undefined);
  plugin.schedule.mockResolvedValue({ notifications: [] });
});

describe('reminders on the web', () => {
  it('does nothing and reports that they are unsupported', async () => {
    const adapter = await loadAdapter(false);
    expect(adapter.remindersSupported).toBe(false);
    expect(await adapter.applyReminders(plan, true)).toBe('unsupported');
    expect(await adapter.reminderPermission()).toBe('unsupported');
    await adapter.cancelReminders();
    expect(plugin.schedule).not.toHaveBeenCalled();
    expect(plugin.cancel).not.toHaveBeenCalled();
  });
});

describe('reminders on Android', () => {
  it('schedules the plan when the permission is already granted', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'granted' });
    const adapter = await loadAdapter(true);
    expect(await adapter.applyReminders(plan, false)).toBe('granted');
    // Old reminders are replaced, not added to.
    expect(plugin.cancel).toHaveBeenCalledTimes(1);
    const cancelled = plugin.cancel.mock.calls[0]![0].notifications.map((n: { id: number }) => n.id);
    expect(cancelled).toContain(7100);
    expect(cancelled).toContain(7107);
    const scheduled = plugin.schedule.mock.calls[0]![0].notifications;
    expect(scheduled).toHaveLength(2);
    expect(scheduled[0]).toMatchObject({
      id: 7100,
      title: 'Giữ chuỗi 3 ngày!',
      smallIcon: 'ic_stat_sudoku',
      isExactNotification: false,
      schedule: { at: plan[0]!.at, allowWhileIdle: true },
    });
  });

  it('does not ask for the permission, nor schedule, until prompting is allowed', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'prompt' });
    const adapter = await loadAdapter(true);
    expect(await adapter.applyReminders(plan, false)).toBe('prompt');
    expect(plugin.requestPermissions).not.toHaveBeenCalled();
    expect(plugin.schedule).not.toHaveBeenCalled();
  });

  it('asks once when prompting is allowed, and schedules if the player agrees', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'prompt' });
    plugin.requestPermissions.mockResolvedValue({ display: 'granted' });
    const adapter = await loadAdapter(true);
    expect(await adapter.applyReminders(plan, true)).toBe('granted');
    expect(plugin.requestPermissions).toHaveBeenCalledTimes(1);
    expect(plugin.schedule).toHaveBeenCalledTimes(1);
  });

  it('schedules nothing when the player refuses', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'prompt' });
    plugin.requestPermissions.mockResolvedValue({ display: 'denied' });
    const adapter = await loadAdapter(true);
    expect(await adapter.applyReminders(plan, true)).toBe('denied');
    expect(plugin.schedule).not.toHaveBeenCalled();
  });

  it('never re-prompts a player who already said no', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'denied' });
    const adapter = await loadAdapter(true);
    expect(await adapter.applyReminders(plan, true)).toBe('denied');
    expect(await adapter.requestReminderPermission()).toBe('denied');
    expect(plugin.requestPermissions).not.toHaveBeenCalled();
  });

  it('only cancels when there is nothing left to remind about', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'granted' });
    const adapter = await loadAdapter(true);
    await adapter.applyReminders([], false);
    expect(plugin.cancel).toHaveBeenCalledTimes(1);
    expect(plugin.schedule).not.toHaveBeenCalled();
  });

  it('survives a plugin that throws', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'granted' });
    plugin.schedule.mockRejectedValue(new Error('boom'));
    const adapter = await loadAdapter(true);
    await expect(adapter.applyReminders(plan, false)).resolves.toBe('granted');
    plugin.checkPermissions.mockRejectedValue(new Error('boom'));
    await expect(adapter.reminderPermission()).resolves.toBe('denied');
    plugin.cancel.mockRejectedValue(new Error('boom'));
    await expect(adapter.cancelReminders()).resolves.toBeUndefined();
  });
});
