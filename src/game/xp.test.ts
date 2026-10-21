import { describe, expect, it } from 'vitest';
import type { SavedGame } from '../storage/schema';
import { isPaletteUnlocked } from './palettes';
import { playerLevel, totalXp, xpForSolve, xpToReach } from './xp';

function game(id: string, mistakes = 0, status: SavedGame['status'] = 'completed'): SavedGame {
  return {
    puzzleId: id,
    board: '.'.repeat(81),
    notes: '0'.repeat(243),
    elapsedMs: 0,
    mistakes,
    hintsUsed: 0,
    status,
    updatedAt: 1,
  };
}

describe('xp', () => {
  it('pays more for harder levels and fewer stars', () => {
    expect(xpForSolve('beginner', 0)).toBe(10);
    expect(xpForSolve('expert', 0)).toBe(150);
    expect(xpForSolve('expert', 1)).toBe(120);
    expect(xpForSolve('expert', 2)).toBe(90);
    expect(xpForSolve('expert', 9)).toBe(90);
  });

  it('sums one share per completed puzzle and ignores the rest', () => {
    const games = [game('easy-001'), game('hard-001', 1), game('easy-002', 0, 'in-progress'), game('bogus-001')];
    expect(totalXp(games)).toBe(20 + 64);
  });
});

describe('player level', () => {
  it('starts at level 1 with 100 xp to reach level 2', () => {
    expect(xpToReach(1)).toBe(0);
    expect(xpToReach(2)).toBe(100);
    expect(xpToReach(3)).toBe(300);
    expect(playerLevel(0)).toMatchObject({ level: 1, into: 0, span: 100 });
  });

  it('moves up exactly at the threshold', () => {
    expect(playerLevel(99).level).toBe(1);
    expect(playerLevel(100).level).toBe(2);
    expect(playerLevel(100)).toMatchObject({ into: 0, span: 200 });
    expect(playerLevel(299).level).toBe(2);
  });

  it('gives a title that changes with the level', () => {
    expect(playerLevel(0).title).toBe('Tân binh');
    expect(playerLevel(xpToReach(5)).title).toBe('Người luyện trí');
    expect(playerLevel(xpToReach(25)).title).toBe('Huyền thoại');
  });
});

describe('palettes', () => {
  it('unlocks by player level', () => {
    expect(isPaletteUnlocked('violet', 1)).toBe(true);
    expect(isPaletteUnlocked('ocean', 2)).toBe(false);
    expect(isPaletteUnlocked('ocean', 3)).toBe(true);
    expect(isPaletteUnlocked('sunset', 9)).toBe(false);
  });
});
