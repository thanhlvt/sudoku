import { describe, expect, it } from 'vitest';
import { parseHash } from './useHashRoute';

describe('parseHash', () => {
  it('routes the three screens', () => {
    expect(parseHash('')).toEqual({ name: 'home' });
    expect(parseHash('#/')).toEqual({ name: 'home' });
    expect(parseHash('#/level/hard')).toEqual({ name: 'level', level: 'hard' });
    expect(parseHash('#/play/expert-012')).toEqual({ name: 'play', puzzleId: 'expert-012' });
  });

  it('routes the secondary screens', () => {
    expect(parseHash('#/achievements')).toEqual({ name: 'achievements' });
    expect(parseHash('#/calendar')).toEqual({ name: 'calendar' });
    expect(parseHash('#/stats')).toEqual({ name: 'stats' });
    expect(parseHash('#/learn')).toEqual({ name: 'learn' });
    expect(parseHash('#/learn/x-wing')).toEqual({ name: 'technique', id: 'x-wing' });
  });

  it('only accepts a technique the game knows', () => {
    for (const hash of ['#/learn/nonsense', '#/learn/__proto__', '#/calendar/2026-10']) {
      const route = parseHash(hash);
      expect(route.name === 'technique' || route.name === 'calendar', hash).toBe(false);
    }
  });

  it('sends anything malformed to home, so a crafted link cannot reach a screen with junk input', () => {
    for (const hash of [
      '#/level/master',
      '#/level/__proto__',
      '#/level',
      '#/play',
      '#/play/',
      '#/play/nonsense',
      '#/play/__proto__-001',
      '#/play/easy-1',
      '#/play/easy-001%20',
      '#/play/<img src=x onerror=alert(1)>',
      '#/unknown/easy-001',
    ]) {
      expect(parseHash(hash), hash).toEqual({ name: 'home' });
    }
  });
});
