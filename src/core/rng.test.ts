import { describe, expect, it } from 'vitest';
import { fnv1a, mulberry32, shuffleInPlace } from './rng';

describe('fnv1a', () => {
  it('is deterministic for the same input', () => {
    expect(fnv1a('hard#7#1')).toBe(fnv1a('hard#7#1'));
  });

  it('produces different hashes for different inputs', () => {
    expect(fnv1a('hard#7#1')).not.toBe(fnv1a('hard#8#1'));
  });

  it('returns an unsigned 32-bit integer', () => {
    const h = fnv1a('some seed string');
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
    expect(Number.isInteger(h)).toBe(true);
  });
});

describe('mulberry32', () => {
  it('same seed produces the same sequence', () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('different seeds produce different sequences', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });

  it('produces values in [0, 1)', () => {
    const rand = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('shuffleInPlace', () => {
  it('same seed produces the same shuffled order', () => {
    const a = shuffleInPlace([1, 2, 3, 4, 5, 6, 7, 8, 9], mulberry32(99));
    const b = shuffleInPlace([1, 2, 3, 4, 5, 6, 7, 8, 9], mulberry32(99));
    expect(a).toEqual(b);
  });

  it('preserves all elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleInPlace([...arr], mulberry32(7));
    expect([...shuffled].sort()).toEqual(arr);
  });

  it('mutates and returns the same array reference', () => {
    const arr = [1, 2, 3];
    const result = shuffleInPlace(arr, mulberry32(1));
    expect(result).toBe(arr);
  });
});
