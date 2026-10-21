// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { resetPuzzleBankCache } from '../game/puzzleBank';
import { ACHIEVEMENTS } from '../game/achievements';
import { CompletionScreen } from '../ui/CompletionScreen';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { getLocale, setLanguage } from './index';

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

function setDeviceLanguages(languages: string[]): void {
  Object.defineProperty(navigator, 'languages', { value: languages, configurable: true });
  Object.defineProperty(navigator, 'language', { value: languages[0], configurable: true });
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
  setDeviceLanguages(['vi-VN', 'vi']); // back to the suite's default device
  setLanguage('auto');
});

const VIETNAMESE = /[ăâđêôơưàáạảãèéẹẻẽìíịỉĩòóọỏõùúụủũỳýỵỷỹ]/i;

/** Every piece of text a reader or a screen reader would get from what is on screen right now. */
function visibleText(): string[] {
  const out: string[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) out.push(node.textContent ?? '');
  for (const el of document.body.querySelectorAll('*')) {
    for (const attr of ['aria-label', 'title', 'placeholder', 'alt']) {
      const value = el.getAttribute(attr);
      if (value) out.push(value);
    }
  }
  return out.map((s) => s.trim()).filter(Boolean);
}

describe('no leftover Vietnamese in the English UI', () => {
  const ROUTES = [
    '#/',
    '#/achievements',
    '#/calendar',
    '#/stats',
    '#/modes',
    '#/learn',
    '#/learn/x-wing',
    '#/learn/naked-single',
    '#/level/easy',
    '#/play/beginner-001',
    '#/play/medium-001/time',
    '#/play/hard-001/perfect',
  ];

  it.each(ROUTES)('%s', async (route) => {
    window.localStorage.setItem('sudoku:v1:settings', JSON.stringify({ language: 'en', seenIntro: true }));
    // Some progress, so the lists show their "done" and "unlocked" states too.
    window.localStorage.setItem(
      'sudoku:v1:game:beginner-002',
      JSON.stringify({
        puzzleId: 'beginner-002',
        board: '.'.repeat(81),
        notes: '0'.repeat(243),
        elapsedMs: 90_000,
        mistakes: 1,
        hintsUsed: 0,
        status: 'completed',
        completedAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
    window.localStorage.setItem('sudoku:v1:stats', JSON.stringify({ beginner: { played: 1, completed: 1, bestMs: 90_000, totalMs: 90_000, perfectRuns: 0 } }));
    window.location.hash = route;
    renderApp();
    await screen.findAllByRole('button');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 150)); // let the banks load
    });
    expect(visibleText().length).toBeGreaterThan(10); // the scan sees the page, so an empty result means "clean"
    expect(visibleText().filter((s) => VIETNAMESE.test(s))).toEqual([]);
  });

  it('the scan does catch Vietnamese (same page, device language)', async () => {
    window.location.hash = '#/stats';
    renderApp();
    await screen.findAllByRole('button');
    expect(visibleText().some((s) => VIETNAMESE.test(s))).toBe(true);
  });

  it('on the result screen with every kind of reward', () => {
    setLanguage('en');
    render(
      <CompletionScreen
        level="expert"
        puzzleNumber={7}
        stars={2}
        elapsedMs={754_000}
        mistakes={1}
        hintsUsed={2}
        isNewRecord
        dailyStreak={7}
        reward={{
          xp: 225,
          levelUp: 5,
          paletteUnlocked: 'palette.ocean',
          achievements: ACHIEVEMENTS.slice(0, 3),
          streakMilestone: 7,
          freezeUsed: true,
          freezeEarned: true,
          mode: 'time',
          weekly: { done: 5, total: 5, bonusXp: 300 },
        }}
        technique={{ label: 'X-Wing', onLearn: () => {} }}
        shareNote={null}
        onShare={() => {}}
        hasNext
        onNext={() => {}}
        onReplay={() => {}}
        onList={() => {}}
      />,
    );
    expect(screen.getByText('Great job!')).toBeTruthy();
    expect(screen.getByText('Level 5 reached!')).toBeTruthy();
    expect(visibleText().filter((s) => VIETNAMESE.test(s))).toEqual([]);
  });

  it('on the play screen: hint, pause, settings and the how-to sheets', async () => {
    window.localStorage.setItem('sudoku:v1:settings', JSON.stringify({ language: 'en', seenIntro: true }));
    window.location.hash = '#/play/beginner-001';
    renderApp();
    await screen.findByText('Puzzle 1');

    fireEvent.click(screen.getByRole('button', { name: 'Hint (H)' }));
    await screen.findByText(/Tap “Apply” to fill in the hint\./);
    expect(visibleText().filter((s) => VIETNAMESE.test(s))).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: 'Pause (Space)' }));
    await screen.findByRole('dialog', { name: 'Paused' });
    expect(visibleText().filter((s) => VIETNAMESE.test(s))).toEqual([]);
  });

  it('on the home screen: settings sheet and the how-to-play pages', async () => {
    window.localStorage.setItem('sudoku:v1:settings', JSON.stringify({ language: 'en' })); // intro not yet seen
    renderApp();
    await screen.findByRole('dialog', { name: 'How to play' });
    for (let page = 0; page < 4; page++) {
      expect(visibleText().filter((s) => VIETNAMESE.test(s))).toEqual([]);
      const next = screen.queryByRole('button', { name: 'Next' });
      if (next) fireEvent.click(next);
    }
    fireEvent.click(screen.getByRole('button', { name: 'Start playing' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Settings' }));
    await screen.findByRole('dialog', { name: 'Settings' });
    expect(visibleText().filter((s) => VIETNAMESE.test(s))).toEqual([]);
  });
});

describe('display language', () => {
  it('follows the device language by default', async () => {
    setDeviceLanguages(['en-US', 'en']);
    setLanguage('auto');
    renderApp();
    expect(await screen.findByText('Choose difficulty')).toBeTruthy();
    expect(document.documentElement.lang).toBe('en');
  });

  it('shows Vietnamese on a Vietnamese device', async () => {
    renderApp();
    expect(await screen.findByText('Chọn độ khó')).toBeTruthy();
    expect(document.documentElement.lang).toBe('vi');
  });

  it('falls back to English on a device language the app is not translated into', async () => {
    setDeviceLanguages(['fr-FR']);
    setLanguage('auto');
    renderApp();
    expect(await screen.findByText('Choose difficulty')).toBeTruthy();
  });

  it('uses a language chosen in Settings even when the device is different', async () => {
    window.localStorage.setItem('sudoku:v1:settings', JSON.stringify({ language: 'en' }));
    renderApp(); // the (Vietnamese) device would otherwise show Vietnamese
    expect(await screen.findByText('Choose difficulty')).toBeTruthy();
  });

  it('switches every visible text at once from the Settings sheet, and remembers the choice', async () => {
    renderApp();
    fireEvent.click(await screen.findByRole('button', { name: 'Cài đặt' }));
    expect(await screen.findByRole('dialog', { name: 'Cài đặt' })).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: 'English' }));

    // The sheet itself, and the home screen behind it, switch without a reload.
    expect(await screen.findByRole('dialog', { name: 'Settings' })).toBeTruthy();
    expect(screen.getByText('Choose difficulty')).toBeTruthy();
    expect(getLocale()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(JSON.parse(window.localStorage.getItem('sudoku:v1:settings')!)).toMatchObject({ language: 'en' });

    // Back to following the device (Vietnamese here).
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Language' })).getByRole('radio', { name: 'Device' }));
    expect(await screen.findByRole('dialog', { name: 'Cài đặt' })).toBeTruthy();
    expect(getLocale()).toBe('vi');
  });

  it('follows a change of the device language while the app is open, but only when set to follow the device', async () => {
    renderApp();
    expect(await screen.findByText('Chọn độ khó')).toBeTruthy();

    await act(async () => {
      setDeviceLanguages(['en-US']);
      window.dispatchEvent(new Event('languagechange'));
    });
    expect(await screen.findByText('Choose difficulty')).toBeTruthy();

    // A language fixed in Settings is not moved by the device.
    await act(async () => {
      setLanguage('vi');
      setDeviceLanguages(['en-GB']);
      window.dispatchEvent(new Event('languagechange'));
    });
    expect(getLocale()).toBe('vi');
  });

  it('translates a puzzle screen and its hint in English', async () => {
    window.localStorage.setItem('sudoku:v1:settings', JSON.stringify({ language: 'en', seenIntro: true }));
    window.location.hash = '#/play/beginner-001';
    renderApp();
    expect(await screen.findByText('Puzzle 1')).toBeTruthy();
    expect(screen.getByRole('toolbar', { name: 'Tools' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hint (H)' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Number pad' })).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Hint (H)' }));
    });
    const hint = await screen.findByText(/Tap “Apply” to fill in the hint\./);
    expect(hint).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Apply hint (H)' })).toBeTruthy();
  });
});
