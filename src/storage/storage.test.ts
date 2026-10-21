// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getStorageHealth,
  isAvailable,
  readJSON,
  removeAllWithPrefix,
  removeKey,
  subscribeStorageHealth,
  writeJSON,
} from './storage';

beforeEach(() => {
  window.localStorage.clear();
});

describe('readJSON / writeJSON round-trip', () => {
  it('writes and reads back a value', () => {
    expect(writeJSON('sudoku:v1:test', { a: 1, b: 'x' })).toBe(true);
    expect(readJSON('sudoku:v1:test', null)).toEqual({ a: 1, b: 'x' });
  });

  it('returns the fallback when the key is missing', () => {
    expect(readJSON('sudoku:v1:missing', 'fallback')).toBe('fallback');
  });

  it('returns the fallback and deletes the key when JSON is corrupt', () => {
    window.localStorage.setItem('sudoku:v1:broken', '{not json');
    expect(readJSON('sudoku:v1:broken', 'fallback')).toBe('fallback');
    expect(window.localStorage.getItem('sudoku:v1:broken')).toBeNull();
  });
});

describe('readJSON with a validator', () => {
  const isNumber = (v: unknown): number | null => (typeof v === 'number' ? v : null);

  it('returns the validated value', () => {
    writeJSON('sudoku:v1:n', 5);
    expect(readJSON('sudoku:v1:n', 0, isNumber)).toBe(5);
  });

  it('returns the fallback and deletes the key when the shape is wrong', () => {
    writeJSON('sudoku:v1:n', 'five');
    expect(readJSON('sudoku:v1:n', 0, isNumber)).toBe(0);
    expect(window.localStorage.getItem('sudoku:v1:n')).toBeNull();
  });

  it('treats a validator that throws as invalid rather than propagating', () => {
    writeJSON('sudoku:v1:n', 1);
    const boom = (): number => {
      throw new Error('boom');
    };
    expect(readJSON('sudoku:v1:n', 9, boom)).toBe(9);
    expect(window.localStorage.getItem('sudoku:v1:n')).toBeNull();
  });
});

describe('removeKey', () => {
  it('deletes a key', () => {
    writeJSON('sudoku:v1:gone', 1);
    removeKey('sudoku:v1:gone');
    expect(readJSON('sudoku:v1:gone', null)).toBeNull();
  });
});

describe('removeAllWithPrefix', () => {
  it('deletes every key sharing the prefix and nothing else', () => {
    writeJSON('sudoku:v1:a', 1);
    writeJSON('sudoku:v1:b', 2);
    writeJSON('other:key', 3);
    removeAllWithPrefix('sudoku:');
    expect(readJSON('sudoku:v1:a', null)).toBeNull();
    expect(readJSON('sudoku:v1:b', null)).toBeNull();
    expect(readJSON('other:key', null)).toBe(3);
  });
});

describe('isAvailable', () => {
  it('is true in a normal browser-like environment', () => {
    expect(isAvailable()).toBe(true);
  });
});

describe('quota exceeded handling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('evicts the oldest completed game and retries once', () => {
    window.localStorage.setItem(
      'sudoku:v1:game:old',
      JSON.stringify({ status: 'completed', completedAt: 100 }),
    );
    window.localStorage.setItem(
      'sudoku:v1:game:newer',
      JSON.stringify({ status: 'completed', completedAt: 200 }),
    );

    let calls = 0;
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      calls++;
      if (calls === 1) {
        throw new DOMException('quota', 'QuotaExceededError');
      }
      original.call(this, key, value);
    });

    const ok = writeJSON('sudoku:v1:game:new-puzzle', { status: 'in-progress' });
    expect(ok).toBe(true);
    expect(window.localStorage.getItem('sudoku:v1:game:old')).toBeNull();
    expect(window.localStorage.getItem('sudoku:v1:game:newer')).not.toBeNull();
  });

  it('reports a failed write through the storage health, and clears it once a write succeeds', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeStorageHealth(listener);
    expect(getStorageHealth()).toBe('ok');

    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    expect(writeJSON('sudoku:v1:game:x', 1)).toBe(false); // nothing completed to evict
    expect(getStorageHealth()).toBe('write-failed');
    expect(listener).toHaveBeenCalledTimes(1);

    spy.mockRestore();
    expect(writeJSON('sudoku:v1:game:x', 1)).toBe(true);
    expect(getStorageHealth()).toBe('ok');
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    writeJSON('sudoku:v1:game:x', 1);
    expect(listener).toHaveBeenCalledTimes(2); // unsubscribed: no further calls
  });
});
