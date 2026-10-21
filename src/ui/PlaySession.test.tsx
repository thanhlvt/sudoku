// @vitest-environment jsdom
import type { ComponentProps } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LevelBank, PuzzleRecord } from '../core/types';
import { DEFAULT_DAILY, DEFAULT_SETTINGS, defaultStats } from '../storage/schema';
import { dateKey } from '../game/daily';
import { weekStartKey } from '../game/weekly';
import { PlaySession } from './PlaySession';

const playCue = vi.fn();
vi.mock('../feedback', () => ({
  playCue: (...args: unknown[]) => playCue(...args),
  preloadSounds: () => {},
  hapticsSupported: false,
}));

const bank = JSON.parse(readFileSync(join(process.cwd(), 'public', 'puzzles', 'beginner.json'), 'utf8')) as LevelBank;
const puzzle: PuzzleRecord = bank.puzzles[0]!;

/** An empty cell, as a 0-based index, with the solution digit and a digit that would be wrong there. */
const EMPTY = puzzle.puzzle.indexOf('.');
const RIGHT = Number(puzzle.solution[EMPTY]);
const WRONG = RIGHT === 9 ? 8 : RIGHT + 1;

function cellLabel(idx: number, state = 'trống'): string {
  return `Hàng ${Math.floor(idx / 9) + 1}, cột ${(idx % 9) + 1}, ${state}`;
}

function cell(idx: number): HTMLElement {
  const row = Math.floor(idx / 9) + 1;
  const col = (idx % 9) + 1;
  return screen.getByRole('gridcell', { name: new RegExp(`^Hàng ${row}, cột ${col},`) });
}

function press(key: string, init: KeyboardEventInit = {}): void {
  fireEvent.keyDown(window, { key, ...init });
}

/** jsdom has no PointerEvent, so React's pointer handlers are driven with mouse events of the same name. */
function pointer(target: HTMLElement, type: 'pointerdown' | 'pointerup'): void {
  fireEvent(target, new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 }));
}

function renderPlay(props: Partial<ComponentProps<typeof PlaySession>> = {}): void {
  render(
    <PlaySession
      puzzle={puzzle}
      levelCount={bank.count}
      onBack={() => {}}
      onNavigate={() => {}}
      settings={DEFAULT_SETTINGS}
      stats={defaultStats()}
      updateStats={() => {}}
      dailyId={null}
      today="2026-10-21"
      daily={DEFAULT_DAILY}
      updateDaily={() => {}}
      weekly={null}
      {...props}
    />,
  );
  fireEvent.click(cell(EMPTY));
}

beforeEach(() => {
  window.localStorage.clear();
  playCue.mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('PlaySession input', () => {
  it('places a correct digit with the place cue', () => {
    renderPlay();
    press(String(RIGHT));
    expect(cell(EMPTY).getAttribute('aria-label')).toBe(cellLabel(EMPTY, `số ${RIGHT}`));
    expect(['place', 'unit']).toContain(playCue.mock.calls.at(-1)![0]);
  });

  it('plays the error cue for a wrong digit', () => {
    renderPlay();
    press(String(WRONG));
    expect(playCue.mock.calls.at(-1)![0]).toBe('error');
  });

  it('writes a note instead of a digit while Shift is held', () => {
    renderPlay();
    press('!', { code: 'Digit1', shiftKey: true });
    const target = cell(EMPTY);
    expect(target.getAttribute('aria-label')).toBe(cellLabel(EMPTY)); // still empty
    expect(target.textContent).toBe('1'); // ...but carries the note
    expect(playCue.mock.calls.at(-1)![0]).toBe('note');
  });

  it('does nothing, silently, on a given cell', () => {
    renderPlay();
    const given = puzzle.puzzle.search(/\d/);
    fireEvent.click(cell(given));
    playCue.mockClear();
    press('5');
    expect(playCue).not.toHaveBeenCalled();
  });
});

describe('PlaySession undo / redo', () => {
  it('redoes what was undone, from the keyboard', () => {
    renderPlay();
    press(String(RIGHT));
    press('u');
    expect(cell(EMPTY).getAttribute('aria-label')).toBe(cellLabel(EMPTY));
    press('r');
    expect(cell(EMPTY).getAttribute('aria-label')).toBe(cellLabel(EMPTY, `số ${RIGHT}`));
  });

  it('supports Ctrl+Z and Ctrl+Y', () => {
    renderPlay();
    press(String(RIGHT));
    press('z', { ctrlKey: true });
    expect(cell(EMPTY).getAttribute('aria-label')).toBe(cellLabel(EMPTY));
    press('y', { ctrlKey: true });
    expect(cell(EMPTY).getAttribute('aria-label')).toBe(cellLabel(EMPTY, `số ${RIGHT}`));
  });

  it('keeps the redo button disabled until something is undone', () => {
    renderPlay();
    const redo = screen.getByRole('button', { name: /Làm lại/ });
    expect((redo as HTMLButtonElement).disabled).toBe(true);
    press(String(RIGHT));
    press('u');
    expect((redo as HTMLButtonElement).disabled).toBe(false);
  });
});

describe('PlaySession fill notes', () => {
  it('fills every empty cell with its candidates, and undoes in one step', () => {
    renderPlay();
    const emptyCount = puzzle.puzzle.split('').filter((c) => c === '.').length;
    const notedCells = (): number =>
      screen.getAllByRole('gridcell').filter((c) => /trống/.test(c.getAttribute('aria-label')!) && c.textContent !== '').length;
    expect(notedCells()).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: /Điền tất cả ghi chú/ }));
    expect(notedCells()).toBe(emptyCount);
    press('u');
    expect(notedCells()).toBe(0);
  });
});

describe('PlaySession held digit', () => {
  it('enters a note after a long press and ignores the click that follows', () => {
    vi.useFakeTimers();
    renderPlay();
    const pad = screen.getByRole('button', { name: new RegExp(`^Số ${RIGHT},`) });
    pointer(pad, 'pointerdown');
    act(() => {
      vi.advanceTimersByTime(500);
    });
    pointer(pad, 'pointerup');
    fireEvent.click(pad);
    const target = cell(EMPTY);
    expect(target.getAttribute('aria-label')).toBe(cellLabel(EMPTY)); // not placed
    expect(target.textContent).toBe(String(RIGHT)); // noted
  });

  it('places the digit on a normal tap', () => {
    vi.useFakeTimers();
    renderPlay();
    const pad = screen.getByRole('button', { name: new RegExp(`^Số ${RIGHT},`) });
    pointer(pad, 'pointerdown');
    pointer(pad, 'pointerup');
    fireEvent.click(pad);
    expect(cell(EMPTY).getAttribute('aria-label')).toBe(cellLabel(EMPTY, `số ${RIGHT}`));
  });
});

describe('PlaySession completion', () => {
  function solveEverything(): void {
    for (let i = 0; i < 81; i++) {
      if (puzzle.puzzle[i] !== '.') continue;
      fireEvent.click(cell(i));
      press(puzzle.solution[i]!);
    }
  }

  it('shows the xp earned and the achievements unlocked by the solve', () => {
    vi.useFakeTimers();
    renderPlay();
    solveEverything();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('Tuyệt vời!')).toBeTruthy();
    expect(screen.getByText('+10 XP')).toBeTruthy();
    expect(screen.getByText('Bước đầu tiên')).toBeTruthy();
    expect(screen.getByText('Không tì vết')).toBeTruthy();
    // Recorded, so it is not announced a second time.
    expect(Object.keys(JSON.parse(window.localStorage.getItem('sudoku:v1:achievements')!))).toEqual(
      expect.arrayContaining(['solved-1', 'flawless-1']),
    );
  });

  it('copies the result when there is no share sheet', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderPlay();
    solveEverything();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.click(screen.getByRole('button', { name: /Chia sẻ/ }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0]![0]).toMatch(/^Sudoku\nMới bắt đầu · Màn 1 ⭐⭐⭐\n⏱ 00:0\d · ❌ 0 lỗi · 💡 0 gợi ý/);
    expect(screen.getByText('Đã sao chép kết quả')).toBeTruthy();
  });

  it('shares a picture of the finished board when the browser can share files', async () => {
    vi.useFakeTimers();
    const canvasContext = new Proxy(
      {},
      {
        get: (_, key) => (key === 'createLinearGradient' ? () => ({ addColorStop: () => {} }) : () => {}),
        set: () => true,
      },
    );
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext as unknown as CanvasRenderingContext2D);
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) =>
      callback(new Blob(['png'], { type: 'image/png' })),
    );
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderPlay();
    solveEverything();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.click(screen.getByRole('button', { name: /Chia sẻ/ }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(share).toHaveBeenCalledTimes(1);
    const files = share.mock.calls[0]![0].files as File[];
    expect(files).toHaveLength(1);
    expect(files[0]!.name).toBe(`sudoku-${puzzle.id}.png`);
    expect(files[0]!.type).toBe('image/png');
    expect(writeText).not.toHaveBeenCalled();
    getContext.mockRestore();
    toBlob.mockRestore();
    Reflect.deleteProperty(navigator, 'canShare');
    Reflect.deleteProperty(navigator, 'share');
  });

  it('does not reward a puzzle that is merely reopened', () => {
    vi.useFakeTimers();
    renderPlay();
    solveEverything();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    cleanup();
    renderPlay();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByText('+10 XP')).toBeNull();
  });
});

describe('PlaySession share puzzle', () => {
  it('shares a picture of the puzzle from the pause screen', async () => {
    const canvasContext = new Proxy(
      {},
      {
        get: (_, key) => (key === 'createLinearGradient' ? () => ({ addColorStop: () => {} }) : () => {}),
        set: () => true,
      },
    );
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext as unknown as CanvasRenderingContext2D);
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) =>
      callback(new Blob(['png'], { type: 'image/png' })),
    );
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    renderPlay();
    fireEvent.click(screen.getByRole('button', { name: /Tạm dừng/ }));
    fireEvent.click(screen.getByRole('button', { name: /Chia sẻ màn này/ }));
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const files = share.mock.calls[0]![0].files as File[];
    expect(files[0]!.name).toBe(`sudoku-${puzzle.id}-puzzle.png`);
    getContext.mockRestore();
    toBlob.mockRestore();
    Reflect.deleteProperty(navigator, 'canShare');
    Reflect.deleteProperty(navigator, 'share');
  });
});

describe('PlaySession challenge modes', () => {
  const wrongDigit = (idx: number): string => String(Number(puzzle.solution[idx]) === 9 ? 8 : Number(puzzle.solution[idx]) + 1);

  it('ends a no-mistakes attempt on the first wrong digit and locks the board', () => {
    renderPlay({ mode: 'perfect' });
    expect(screen.getByText(/Không sai/)).toBeTruthy();
    press(wrongDigit(EMPTY));
    expect(screen.getByRole('dialog', { name: 'Đã điền sai' })).toBeTruthy();
    // Locked: a right digit in another cell does nothing.
    const other = puzzle.puzzle.indexOf('.', EMPTY + 1);
    fireEvent.click(cell(other));
    press(String(puzzle.solution[other]));
    expect(cell(other).getAttribute('aria-label')).toBe(cellLabel(other));
  });

  it('retries the attempt with the mode kept', () => {
    renderPlay({ mode: 'perfect' });
    press(wrongDigit(EMPTY));
    fireEvent.click(screen.getByRole('button', { name: /Thử lại/ }));
    expect(screen.queryByRole('dialog', { name: 'Đã điền sai' })).toBeNull();
    expect(screen.getByText(/Không sai/)).toBeTruthy();
    fireEvent.click(cell(EMPTY));
    press(String(puzzle.solution[EMPTY]));
    expect(cell(EMPTY).getAttribute('aria-label')).toBe(cellLabel(EMPTY, `số ${puzzle.solution[EMPTY]}`));
  });

  it('lets the player carry on as a normal game after failing', () => {
    renderPlay({ mode: 'perfect' });
    press(wrongDigit(EMPTY));
    fireEvent.click(screen.getByRole('button', { name: /Chơi tiếp như bình thường/ }));
    expect(screen.queryByRole('dialog', { name: 'Đã điền sai' })).toBeNull();
    expect(screen.queryByText(/Không sai/)).toBeNull();
    const other = puzzle.puzzle.indexOf('.', EMPTY + 1);
    fireEvent.click(cell(other));
    press(String(puzzle.solution[other]));
    expect(cell(other).getAttribute('aria-label')).toBe(cellLabel(other, `số ${puzzle.solution[other]}`));
  });

  it('counts down in time attack and ends the attempt when the time is up', () => {
    vi.useFakeTimers();
    renderPlay({ mode: 'time' });
    // Beginner: 3 minutes.
    expect(screen.getByLabelText(/Còn lại 03:00/)).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByLabelText(/Còn lại 02:50/)).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(3 * 60_000);
    });
    expect(screen.getByRole('dialog', { name: 'Hết giờ' })).toBeTruthy();
    expect(screen.getByLabelText(/Còn lại 00:00/)).toBeTruthy();
  });

  it('a wrong digit does not end a time-attack attempt', () => {
    renderPlay({ mode: 'time' });
    press(wrongDigit(EMPTY));
    expect(screen.queryByRole('dialog', { name: 'Đã điền sai' })).toBeNull();
    expect(screen.queryByRole('dialog', { name: 'Hết giờ' })).toBeNull();
  });

  it('restores a failed attempt as failed when the puzzle is reopened', () => {
    renderPlay({ mode: 'perfect' });
    press(wrongDigit(EMPTY));
    cleanup();
    renderPlay(); // no mode requested: the saved game keeps its own
    expect(screen.getByRole('dialog', { name: 'Đã điền sai' })).toBeTruthy();
  });

  it('pays the mode bonus and records the win under that mode', () => {
    vi.useFakeTimers();
    renderPlay({ mode: 'perfect' });
    for (let i = 0; i < 81; i++) {
      if (puzzle.puzzle[i] !== '.') continue;
      fireEvent.click(cell(i));
      press(puzzle.solution[i]!);
    }
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('+15 XP')).toBeTruthy(); // 10 * 1.5
    expect(screen.getByText(/thưởng thêm 50% XP/)).toBeTruthy();
    const saved = JSON.parse(window.localStorage.getItem(`sudoku:v1:game:${puzzle.id}`)!);
    expect(saved.mode).toBe('perfect');
    expect(screen.getByText('Bất bại')).toBeTruthy();
  });
});

describe('PlaySession weekly challenge', () => {
  const week = weekStartKey(dateKey(new Date()));
  const other = 'easy-001';

  function solveAll(): void {
    for (let i = 0; i < 81; i++) {
      if (puzzle.puzzle[i] !== '.') continue;
      fireEvent.click(cell(i));
      press(puzzle.solution[i]!);
    }
  }

  it('credits a solved puzzle towards the week and pays out when the fifth is done', () => {
    vi.useFakeTimers();
    window.localStorage.setItem(
      `sudoku:v1:game:${other}`,
      JSON.stringify({
        puzzleId: other,
        board: '.'.repeat(81),
        notes: '0'.repeat(243),
        elapsedMs: 1,
        mistakes: 0,
        hintsUsed: 0,
        status: 'completed',
        completedAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
    renderPlay({ weekly: { key: week, ids: [puzzle.id, other] } });
    solveAll();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/Chuỗi tuần 2\/2/)).toBeTruthy();
    expect(screen.getByText(/Hoàn thành! \+300 XP/)).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem('sudoku:v1:weekly')!).done).toEqual([week]);
  });

  it('does not pay twice for the same week', () => {
    vi.useFakeTimers();
    window.localStorage.setItem('sudoku:v1:weekly', JSON.stringify({ done: [week] }));
    window.localStorage.setItem(
      `sudoku:v1:game:${other}`,
      JSON.stringify({
        puzzleId: other,
        board: '.'.repeat(81),
        notes: '0'.repeat(243),
        elapsedMs: 1,
        mistakes: 0,
        hintsUsed: 0,
        status: 'completed',
        completedAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
    renderPlay({ weekly: { key: week, ids: [puzzle.id, other] } });
    solveAll();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByText(/Hoàn thành! \+300 XP/)).toBeNull();
    expect(JSON.parse(window.localStorage.getItem('sudoku:v1:weekly')!).done).toEqual([week]);
  });

  it('shows the partial progress and offers the next weekly puzzle', () => {
    vi.useFakeTimers();
    renderPlay({ weekly: { key: week, ids: [puzzle.id, 'easy-002'] } });
    solveAll();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/Chuỗi tuần 1\/2/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Màn tuần tiếp theo/ })).toBeTruthy();
  });
});
