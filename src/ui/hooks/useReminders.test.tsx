// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DailyState } from '../../storage/schema';

const applyReminders = vi.fn();
const cancelReminders = vi.fn();
let supported = true;

vi.mock('../../notifications', () => ({
  applyReminders: (...a: unknown[]) => applyReminders(...a),
  cancelReminders: () => cancelReminders(),
  get remindersSupported() {
    return supported;
  },
}));

import { useReminders } from './useReminders';

const daily = (lastDate: string | null, streak = 0): DailyState => ({ streak, longest: streak, lastDate, freezes: 0 });
const today = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

afterEach(cleanup);

beforeEach(() => {
  applyReminders.mockReset();
  cancelReminders.mockReset();
  supported = true;
});

describe('useReminders', () => {
  it('plans reminders when enabled, without prompting a player who has not solved anything yet', () => {
    renderHook(() => useReminders({ enabled: true, today: today(), daily: daily(null), solvedCount: 0 }));
    expect(applyReminders).toHaveBeenCalledTimes(1);
    const [plan, allowPrompt] = applyReminders.mock.calls[0]!;
    expect(plan.length).toBeGreaterThan(0);
    expect(allowPrompt).toBe(false);
  });

  it('allows the permission prompt once a puzzle has been solved', () => {
    renderHook(() => useReminders({ enabled: true, today: today(), daily: daily(null), solvedCount: 1 }));
    expect(applyReminders.mock.calls[0]![1]).toBe(true);
  });

  it('cancels everything when switched off', () => {
    renderHook(() => useReminders({ enabled: false, today: today(), daily: daily(null), solvedCount: 3 }));
    expect(cancelReminders).toHaveBeenCalledTimes(1);
    expect(applyReminders).not.toHaveBeenCalled();
  });

  it("drops today's reminder once today's challenge is done", () => {
    const { rerender } = renderHook((p: { done: boolean }) =>
      useReminders({ enabled: true, today: today(), daily: daily(p.done ? today() : null), solvedCount: 1 }),
    { initialProps: { done: false } });
    const before = applyReminders.mock.calls.at(-1)![0] as { at: Date }[];
    rerender({ done: true });
    const after = applyReminders.mock.calls.at(-1)![0] as { at: Date }[];
    expect(after.length).toBeLessThanOrEqual(before.length);
    expect(after.every((r) => r.at.getDate() !== new Date().getDate())).toBe(true);
  });

  it('re-plans when the app returns to the foreground', () => {
    renderHook(() => useReminders({ enabled: true, today: today(), daily: daily(null), solvedCount: 1 }));
    applyReminders.mockClear();
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(applyReminders).toHaveBeenCalledTimes(1);
  });

  it('does nothing on the web', () => {
    supported = false;
    renderHook(() => useReminders({ enabled: true, today: today(), daily: daily(null), solvedCount: 1 }));
    renderHook(() => useReminders({ enabled: false, today: today(), daily: daily(null), solvedCount: 1 }));
    expect(applyReminders).not.toHaveBeenCalled();
    expect(cancelReminders).not.toHaveBeenCalled();
  });
});
