import { describe, expect, it } from 'vitest';
import { GameSession, decodeNotes, encodeNotes } from './gameState';

const PUZZLE = [
  '53..7....',
  '6..195...',
  '.98....6.',
  '8...6...3',
  '4..8.3..1',
  '7...2...6',
  '.6....28.',
  '...419..5',
  '....8..79',
].join('');
const SOLUTION = [
  '534678912',
  '672195348',
  '198342567',
  '859761423',
  '426853791',
  '713924856',
  '961537284',
  '287419635',
  '345286179',
].join('');

function makeSession(autoRemoveNotes = true): GameSession {
  return new GameSession({ puzzleId: 'easy-001', puzzle: PUZZLE, solution: SOLUTION, autoRemoveNotes });
}

describe('GameSession basics', () => {
  it('starts in-progress with the givens filled in and nothing else', () => {
    const session = makeSession();
    expect(session.status).toBe('in-progress');
    expect(session.isGiven(0)).toBe(true); // cell 0 is '5' in PUZZLE
    expect(session.isGiven(2)).toBe(false); // cell 2 is '.' in PUZZLE
    expect(session.board[2]).toBe(0);
  });

  it('refuses to modify a given cell', () => {
    const session = makeSession();
    session.setDigit(0, 9);
    expect(session.board[0]).toBe(5);
  });

  it('setDigit places the digit and flags a mistake when wrong', () => {
    const session = makeSession();
    session.setDigit(2, 1); // solution at idx2 is 4
    expect(session.board[2]).toBe(1);
    expect(session.mistakes).toBe(1);
  });

  it('setDigit does not flag a mistake when correct', () => {
    const session = makeSession();
    session.setDigit(2, 4); // matches solution
    expect(session.mistakes).toBe(0);
  });

  it('eraseCell clears a player-entered value but not a given', () => {
    const session = makeSession();
    session.setDigit(2, 4);
    session.eraseCell(2);
    expect(session.board[2]).toBe(0);
    session.eraseCell(0);
    expect(session.board[0]).toBe(5);
  });

  it('toggleNote flips a candidate bit only on empty cells', () => {
    const session = makeSession();
    session.toggleNote(2, 7);
    expect(session.notes[2]! & (1 << 6)).not.toBe(0);
    session.toggleNote(2, 7);
    expect(session.notes[2]! & (1 << 6)).toBe(0);
  });
});

describe('autoRemoveNotes', () => {
  it('clears the placed digit from peer notes when enabled', () => {
    const session = makeSession(true);
    session.toggleNote(3, 4); // idx3 is an empty peer of idx2 (same row)
    session.setDigit(2, 4);
    expect(session.notes[3]! & (1 << 3)).toBe(0);
  });

  it('leaves peer notes alone when disabled', () => {
    const session = makeSession(false);
    session.toggleNote(3, 4);
    session.setDigit(2, 4);
    expect(session.notes[3]! & (1 << 3)).not.toBe(0);
  });
});

describe('undo', () => {
  it('reverts a setDigit move, including the mistake and any auto-removed notes', () => {
    const session = makeSession(true);
    session.toggleNote(3, 1); // idx3 is an empty peer of idx2 (same row)
    session.setDigit(2, 1); // wrong digit (solution is 4), also strips note 1 from idx3
    expect(session.mistakes).toBe(1);
    expect(session.notes[3]! & 1).toBe(0);
    session.undo();
    expect(session.board[2]).toBe(0);
    expect(session.notes[3]! & 1).not.toBe(0); // auto-removed note restored
  });

  it('does nothing when the undo stack is empty', () => {
    const session = makeSession();
    expect(session.canUndo()).toBe(false);
    session.undo();
    expect(session.board[2]).toBe(0);
  });

  it('reopens a completed puzzle if the completing move is undone', () => {
    const session = makeSession();
    for (let i = 0; i < 81; i++) {
      if (!session.isGiven(i)) session.setDigit(i, SOLUTION.charCodeAt(i) - 48);
    }
    expect(session.status).toBe('completed');
    session.undo();
    expect(session.status).toBe('in-progress');
  });
});

describe('completion', () => {
  it('marks the session completed once the board matches the solution', () => {
    const session = makeSession();
    for (let i = 0; i < 81; i++) {
      if (!session.isGiven(i)) session.setDigit(i, SOLUTION.charCodeAt(i) - 48);
    }
    expect(session.status).toBe('completed');
  });

  it('rejects further input once completed', () => {
    const session = makeSession();
    for (let i = 0; i < 81; i++) {
      if (!session.isGiven(i)) session.setDigit(i, SOLUTION.charCodeAt(i) - 48);
    }
    session.eraseCell(2);
    expect(session.board[2]).toBe(SOLUTION.charCodeAt(2) - 48);
  });
});

describe('hint', () => {
  it('previews a step on the first call and applies it on the second', () => {
    const session = makeSession();
    const preview = session.hint();
    expect(preview).not.toBeNull();
    expect(session.hintsUsed).toBe(0);

    const applied = session.hint();
    expect(applied).toEqual(preview);
    expect(session.hintsUsed).toBe(1);
  });
});

describe('notes encode/decode', () => {
  it('round-trips through the hex string format', () => {
    const notes = new Uint16Array(81);
    notes[0] = 0b111111111;
    notes[80] = 5;
    const decoded = decodeNotes(encodeNotes(notes));
    expect(Array.from(decoded)).toEqual(Array.from(notes));
  });
});

describe('save/restore', () => {
  it('fromSaved reproduces the same board, notes, and counters as toSaved', () => {
    const session = makeSession();
    session.setDigit(2, 4);
    session.toggleNote(3, 5);
    const saved = session.toSaved(1000);

    const restored = GameSession.fromSaved(
      { puzzleId: 'easy-001', puzzle: PUZZLE, solution: SOLUTION, autoRemoveNotes: true },
      saved,
    );
    expect(Array.from(restored.board)).toEqual(Array.from(session.board));
    expect(Array.from(restored.notes)).toEqual(Array.from(session.notes));
    expect(restored.elapsedMs).toBe(session.elapsedMs);
  });

  it('matchesGivens detects a stale save whose givens no longer line up', () => {
    const session = makeSession();
    const saved = session.toSaved(1000);
    expect(GameSession.matchesGivens(PUZZLE, saved)).toBe(true);

    const otherPuzzle = '9' + PUZZLE.slice(1); // idx0 given changed from 5 to 9
    expect(GameSession.matchesGivens(otherPuzzle, saved)).toBe(false);
  });
});
