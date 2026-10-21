// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { writeJSON } from '../storage/storage';
import { ErrorBoundary } from './ErrorBoundary';
import { StorageBanner } from './StorageBanner';

function Boom(): JSX.Element {
  throw new Error('render failed');
}

beforeEach(() => {
  window.localStorage.clear();
  // React logs caught render errors; keep the test output readable.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('renders its children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('all good')).toBeTruthy();
  });

  it('replaces a crashing subtree with a recovery screen instead of a blank page', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Tải lại')).toBeTruthy();
    expect(screen.getByText('Xóa dữ liệu và tải lại')).toBeTruthy();
  });

  it('"clear data" wipes saved progress (after confirming) and reloads at home', () => {
    writeJSON('sudoku:v1:stats', null);
    writeJSON('sudoku:v1:game:easy-001', { anything: true });
    writeJSON('unrelated:key', 1);
    const reload = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, reload } as unknown as Location);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByText('Xóa dữ liệu và tải lại'));

    expect(window.localStorage.getItem('sudoku:v1:stats')).toBeNull();
    expect(window.localStorage.getItem('sudoku:v1:game:easy-001')).toBeNull();
    expect(window.localStorage.getItem('unrelated:key')).not.toBeNull();
    expect(reload).toHaveBeenCalled();
  });

  it('"clear data" does nothing if the player declines', () => {
    writeJSON('sudoku:v1:game:easy-001', { anything: true });
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByText('Xóa dữ liệu và tải lại'));
    expect(window.localStorage.getItem('sudoku:v1:game:easy-001')).not.toBeNull();
  });
});

describe('StorageBanner', () => {
  it('stays hidden while saving works', () => {
    const { container } = render(<StorageBanner />);
    expect(container.textContent).toBe('');
  });

  it('appears when a write is rejected and disappears once saving works again', () => {
    render(<StorageBanner />);
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    act(() => {
      writeJSON('sudoku:v1:game:easy-001', 1);
    });
    expect(screen.getByRole('status').textContent).toMatch(/chưa được lưu/);

    spy.mockRestore();
    act(() => {
      writeJSON('sudoku:v1:game:easy-001', 1);
    });
    expect(screen.queryByRole('status')).toBeNull();
  });
});
