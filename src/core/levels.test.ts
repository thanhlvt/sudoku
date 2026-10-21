import { describe, expect, it } from 'vitest';
import { LEVELS, isLevel, isPuzzleId } from './levels';

describe('isLevel', () => {
  it('accepts exactly the five levels', () => {
    for (const level of LEVELS) expect(isLevel(level)).toBe(true);
    expect(LEVELS).toHaveLength(5);
  });

  it('rejects other strings, prototype keys and non-strings', () => {
    for (const bad of ['', 'Easy', 'master', '__proto__', 'constructor', 'toString', 1, null, undefined, {}]) {
      expect(isLevel(bad)).toBe(false);
    }
  });
});

describe('isPuzzleId', () => {
  it('accepts generator-style ids', () => {
    expect(isPuzzleId('beginner-001')).toBe(true);
    expect(isPuzzleId('expert-100')).toBe(true);
    expect(isPuzzleId('hard-1000')).toBe(true);
  });

  it('rejects malformed ids and prototype-pollution keys', () => {
    for (const bad of [
      '',
      'easy',
      'easy-1',
      'easy-',
      'easy-00a',
      'easy-001 ',
      'easy-001/../x',
      'EASY-001',
      'master-001',
      '__proto__-001',
      'constructor-001',
      'easy-0000000',
      5,
      null,
      undefined,
    ]) {
      expect(isPuzzleId(bad)).toBe(false);
    }
  });
});
