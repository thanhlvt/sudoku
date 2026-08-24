// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isAvailable, readJSON, removeAllWithPrefix, removeKey, writeJSON } from './storage';

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
});
