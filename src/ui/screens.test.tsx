// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './../App';
import { resetPuzzleBankCache } from '../game/puzzleBank';
import { ErrorBoundary } from './ErrorBoundary';

const PUZZLES_DIR = join(process.cwd(), 'public', 'puzzles');

function stubBankFetch(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const file = url.slice(url.lastIndexOf('/') + 1);
      try {
        return new Response(readFileSync(join(PUZZLES_DIR, file), 'utf8'), { status: 200 });
      } catch {
        return new Response('not found', { status: 404 });
      }
    }),
  );
}

function put(key: string, value: unknown): void {
  window.localStorage.setItem(`sudoku:v1:${key}`, JSON.stringify(value));
}

function savedGame(id: string, extra: Record<string, unknown> = {}): void {
  put(`game:${id}`, {
    puzzleId: id,
    board: '.'.repeat(81),
    notes: '0'.repeat(243),
    elapsedMs: 120_000,
    mistakes: 0,
    hintsUsed: 0,
    status: 'completed',
    completedAt: 5,
    updatedAt: 5,
    ...extra,
  });
}

function renderAt(hash: string): void {
  window.location.hash = hash;
  render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  window.location.hash = '';
  resetPuzzleBankCache();
  stubBankFetch();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('first-run intro', () => {
  it('greets a brand-new player once and remembers it was dismissed', async () => {
    renderAt('');
    const dialog = await screen.findByRole('dialog', { name: 'Cách chơi' });
    expect(dialog).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ qua' }));
    expect(screen.queryByRole('dialog', { name: 'Cách chơi' })).toBeNull();
    expect(JSON.parse(window.localStorage.getItem('sudoku:v1:settings')!).seenIntro).toBe(true);
  });

  it('pages through to the end', async () => {
    renderAt('');
    await screen.findByRole('dialog', { name: 'Cách chơi' });
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole('button', { name: 'Tiếp' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu chơi' }));
    expect(screen.queryByRole('dialog', { name: 'Cách chơi' })).toBeNull();
  });

  it('does not interrupt a player who already has progress', async () => {
    savedGame('easy-001');
    renderAt('');
    await screen.findByText('Rèn trí não mỗi ngày');
    expect(screen.queryByRole('dialog', { name: 'Cách chơi' })).toBeNull();
  });

  it('can be reopened from the settings', async () => {
    put('settings', { seenIntro: true });
    renderAt('');
    fireEvent.click(await screen.findByRole('button', { name: 'Cài đặt' }));
    fireEvent.click(screen.getByRole('button', { name: /Hướng dẫn chơi/ }));
    expect(await screen.findByRole('dialog', { name: 'Cách chơi' })).toBeTruthy();
  });
});

describe('home shortcuts', () => {
  it('links to the secondary screens and shows the player level', async () => {
    put('settings', { seenIntro: true });
    renderAt('');
    const nav = await screen.findByRole('navigation', { name: 'Khám phá' });
    expect(nav.querySelectorAll('button')).toHaveLength(4);
    fireEvent.click(screen.getByRole('button', { name: /Lịch/ }));
    expect(window.location.hash).toBe('#/calendar');
  });
});

describe('achievements screen', () => {
  it('lists what a solved puzzle earned and what is still locked', async () => {
    put('settings', { seenIntro: true });
    savedGame('easy-001');
    renderAt('#/achievements');
    const unlocked = await screen.findByRole('region', { name: 'Đã mở khoá' });
    expect(unlocked.textContent).toContain('Bước đầu tiên');
    expect(unlocked.textContent).toContain('Không tì vết');
    const locked = screen.getByRole('region', { name: 'Chưa mở khoá' });
    expect(locked.textContent).toContain('Khởi động');
    // Earned achievements are recorded, so they stay unlocked later.
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem('sudoku:v1:achievements') ?? '{}')).toHaveProperty('solved-1');
    });
  });
});

describe('calendar screen', () => {
  it('shows the current month and opens the day that is tapped', async () => {
    put('settings', { seenIntro: true });
    renderAt('#/calendar');
    await screen.findByRole('heading', { name: 'Lịch thử thách' });
    const today = await screen.findByRole('gridcell', { name: /hôm nay/ });
    fireEvent.click(today);
    expect(window.location.hash).toMatch(/^#\/play\/(easy|medium|hard|expert)-\d{3}$/);
  });

  it('marks a day whose puzzle has been solved', async () => {
    put('settings', { seenIntro: true });
    renderAt('#/calendar');
    const today = await screen.findByRole('gridcell', { name: /hôm nay/ });
    const id = /#\/play\/(.+)$/.exec(
      (() => {
        fireEvent.click(today);
        return window.location.hash;
      })(),
    )![1]!;
    cleanup();
    savedGame(id);
    renderAt('#/calendar');
    const done = await screen.findByRole('gridcell', { name: /hôm nay.*|đã xong/ });
    expect(done.getAttribute('aria-label')).toContain('đã xong');
  });

  it('does not let the player browse past the current month', async () => {
    put('settings', { seenIntro: true });
    renderAt('#/calendar');
    await screen.findByRole('gridcell', { name: /hôm nay/ });
    expect((screen.getByRole('button', { name: 'Tháng sau' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Tháng trước' }));
    expect((screen.getByRole('button', { name: 'Tháng sau' }) as HTMLButtonElement).disabled).toBe(false);
  });
});

describe('technique lessons', () => {
  it('lists every technique', async () => {
    put('settings', { seenIntro: true });
    renderAt('#/learn');
    await screen.findByRole('heading', { name: 'Học kỹ thuật' });
    await waitFor(() => expect(screen.getAllByRole('listitem').length).toBe(21));
  });

  it('shows a lesson with a worked example and practice puzzles', async () => {
    put('settings', { seenIntro: true });
    renderAt('#/learn/x-wing');
    await screen.findByRole('heading', { name: 'X-Wing' });
    expect(await screen.findByRole('img', { name: /Bàn ví dụ/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Luyện tập ngay/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Luyện tập ngay/ }));
    expect(window.location.hash).toMatch(/^#\/play\/hard-\d{3}$/);
  });

  it('says so when the bank has no puzzle for a technique', async () => {
    put('settings', { seenIntro: true });
    renderAt('#/learn/jellyfish');
    await screen.findByRole('heading', { name: /Jellyfish/ });
    expect(await screen.findByText(/Chưa có ví dụ/)).toBeTruthy();
  });

  it('marks a technique mastered after a hint-free solve of a puzzle that needs it', async () => {
    put('settings', { seenIntro: true });
    savedGame('beginner-001');
    renderAt('#/learn/naked-single');
    expect(await screen.findByText('Đã thành thạo')).toBeTruthy();
  });
});

describe('stats screen', () => {
  it('summarises the player', async () => {
    put('settings', { seenIntro: true });
    savedGame('easy-001', { mistakes: 1 });
    renderAt('#/stats');
    await screen.findByRole('heading', { name: 'Thống kê' });
    expect(screen.getByText('Màn đã giải').previousSibling?.textContent).toBe('1');
    await act(async () => {});
  });
});

describe('modes screen', () => {
  it('lists the weekly challenge and both modes', async () => {
    put('settings', { seenIntro: true });
    renderAt('#/modes');
    await screen.findByRole('heading', { name: 'Chế độ thử thách' });
    expect(await screen.findByRole('region', { name: 'Chuỗi thử thách tuần' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Đua thời gian' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Không sai' })).toBeTruthy();
    await waitFor(() => expect(screen.getByRole('button', { name: /Bắt đầu chuỗi tuần/ })).toBeTruthy());
  });

  it('starts a mode on a puzzle the player has not touched yet', async () => {
    put('settings', { seenIntro: true });
    savedGame('beginner-001');
    savedGame('beginner-002', { status: 'in-progress', completedAt: undefined });
    renderAt('#/modes');
    const group = await screen.findByRole('group', { name: 'Chọn cấp cho Không sai' });
    await waitFor(() => expect((group.querySelector('button') as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(group.querySelector('button')!);
    expect(window.location.hash).toBe('#/play/beginner-003/perfect');
  });

  it('shows the time limit of each level in time attack', async () => {
    put('settings', { seenIntro: true });
    renderAt('#/modes');
    const group = await screen.findByRole('group', { name: 'Chọn cấp cho Đua thời gian' });
    expect(group.textContent).toContain('03:00');
    expect(group.textContent).toContain('20:00');
  });

  it('is reachable from the home screen', async () => {
    put('settings', { seenIntro: true });
    renderAt('');
    fireEvent.click(await screen.findByRole('button', { name: /Chế độ thử thách/ }));
    expect(window.location.hash).toBe('#/modes');
  });
});
