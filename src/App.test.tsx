// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { resetPuzzleBankCache } from './game/puzzleBank';
import { ErrorBoundary } from './ui/ErrorBoundary';

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
  window.localStorage.setItem(key, JSON.stringify(value));
}

function renderApp(): void {
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

describe('App with hostile localStorage', () => {
  it('opens the home screen even when every record has the wrong shape', async () => {
    put('sudoku:v1:meta', 'x');
    put('sudoku:v1:stats', null);
    put('sudoku:v1:settings', [1, 2]);
    put('sudoku:v1:daily', 'streak');
    put('sudoku:v1:last', { puzzleId: '__proto__-001', at: 1 });
    put('sudoku:v1:game:easy-001', { puzzleId: '__proto__-001', status: 'completed' });

    renderApp();

    expect(await screen.findByText('Chọn độ khó')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull(); // the error boundary did not trigger
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'completed')).toBe(false);
  });

  it('opens a puzzle whose saved game is corrupt, and starts it fresh', async () => {
    const bank = JSON.parse(readFileSync(join(PUZZLES_DIR, 'beginner.json'), 'utf8')) as {
      puzzles: { id: string; puzzle: string }[];
    };
    const first = bank.puzzles[0]!;
    put(`sudoku:v1:game:${first.id}`, {
      puzzleId: first.id,
      board: 'x'.repeat(81),
      notes: 'zz',
      elapsedMs: 'a lot',
      mistakes: -4,
      hintsUsed: 0,
      status: 'completed',
      updatedAt: 1,
    });
    put('sudoku:v1:stats', {});
    window.location.hash = `#/play/${first.id}`;

    renderApp();

    expect(await screen.findByText('Màn 1')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    // The board shows the puzzle's own givens, i.e. the broken save was discarded.
    const givens = [...first.puzzle].filter((c) => c !== '.' && c !== '0').length;
    expect(screen.getAllByRole('gridcell').filter((cell) => /cho sẵn/.test(cell.getAttribute('aria-label') ?? ''))).toHaveLength(givens);
  });

  it('shows a retry button instead of loading forever when the manifest cannot be fetched', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('down', { status: 503 })));
    renderApp();
    const retry = await screen.findByText('Thử lại');

    stubBankFetch(); // the network comes back
    await act(async () => {
      retry.click();
    });
    expect(await screen.findByText('Chọn độ khó')).toBeTruthy();
    expect(await screen.findAllByRole('button', { name: /đã xong 0 trên/ })).toHaveLength(5);
    expect(screen.queryByText('Thử lại')).toBeNull();
  });

  it('treats a malformed play link as the home screen', async () => {
    window.location.hash = '#/play/__proto__-001';
    renderApp();
    expect(await screen.findByText('Chọn độ khó')).toBeTruthy();
  });
});
