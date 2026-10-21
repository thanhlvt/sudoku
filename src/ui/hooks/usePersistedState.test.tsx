// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultStats, loadStats, saveStats, type Stats } from '../../storage/schema';
import { useStats } from './useStats';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function bump(stats: Stats): Stats {
  return { ...stats, easy: { ...stats.easy, completed: stats.easy.completed + 1 } };
}

describe('usePersistedState (via useStats)', () => {
  it('persists an update and exposes it', () => {
    const { result } = renderHook(() => useStats());
    act(() => result.current[1](bump));
    expect(result.current[0].easy.completed).toBe(1);
    expect(loadStats().easy.completed).toBe(1);
  });

  it('applies an increment once even under StrictMode double-invocation', () => {
    const { result } = renderHook(() => useStats(), { wrapper: StrictMode });
    act(() => result.current[1](bump));
    expect(loadStats().easy.completed).toBe(1);
    expect(result.current[0].easy.completed).toBe(1);
  });

  it("builds on another tab's write instead of overwriting it", () => {
    const { result } = renderHook(() => useStats());
    // A second tab records two completions after this tab loaded its (empty) stats.
    saveStats({ ...defaultStats(), easy: { ...defaultStats().easy, completed: 2 } });
    act(() => result.current[1](bump));
    expect(loadStats().easy.completed).toBe(3);
  });

  it('starts from clean defaults when the stored stats are garbage', () => {
    window.localStorage.setItem('sudoku:v1:stats', 'null');
    const { result } = renderHook(() => useStats());
    expect(result.current[0]).toEqual(defaultStats());
  });

  it('keeps consecutive updates when storage rejects writes', () => {
    const { result } = renderHook(() => useStats());
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    act(() => result.current[1](bump));
    act(() => result.current[1](bump));
    expect(result.current[0].easy.completed).toBe(2);
  });
});
