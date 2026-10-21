import { PEERS, cloneGrid, computeCandidates, gridToString, isComplete, parseGrid } from '../core/board';
import { solveLogically } from '../core/logicalSolver';
import type { Grid, Step } from '../core/types';
import type { SavedGame } from '../storage/schema';

export interface Move {
  type: 'set' | 'erase' | 'note' | 'fill-notes';
  /** The cell the move acts on; `-1` for `fill-notes`, which only has `autoNoteChanges`. */
  idx: number;
  before: { value: number; notes: number };
  after: { value: number; notes: number };
  autoNoteChanges?: { idx: number; before: number; after: number }[];
}

export interface GameOptions {
  puzzleId: string;
  puzzle: string;
  solution: string;
  autoRemoveNotes: boolean;
}

export function encodeNotes(notes: Uint16Array): string {
  let out = '';
  for (let i = 0; i < 81; i++) {
    out += notes[i]!.toString(16).padStart(3, '0');
  }
  return out;
}

export function decodeNotes(encoded: string): Uint16Array {
  const notes = new Uint16Array(81);
  for (let i = 0; i < 81; i++) {
    // Only the low 9 bits (digits 1-9) mean anything; stray high bits from a bad save are dropped.
    notes[i] = (parseInt(encoded.slice(i * 3, i * 3 + 3), 16) || 0) & 0x1ff;
  }
  return notes;
}

/** Older moves are forgotten past this, so holding a key (or a very long ván) cannot grow memory without bound. */
const MAX_UNDO_MOVES = 500;

export class GameSession {
  readonly puzzleId: string;
  readonly givens: Grid;
  readonly solution: Grid;
  board: Grid;
  notes: Uint16Array;
  elapsedMs: number;
  mistakes: number;
  hintsUsed: number;
  status: 'in-progress' | 'completed';
  autoRemoveNotes: boolean;

  private undoStack: Move[] = [];
  private redoStack: Move[] = [];
  private pendingHintStep: Step | null = null;

  constructor(opts: GameOptions) {
    this.puzzleId = opts.puzzleId;
    this.givens = parseGrid(opts.puzzle);
    this.solution = parseGrid(opts.solution);
    this.board = cloneGrid(this.givens);
    this.notes = new Uint16Array(81);
    this.elapsedMs = 0;
    this.mistakes = 0;
    this.hintsUsed = 0;
    this.status = 'in-progress';
    this.autoRemoveNotes = opts.autoRemoveNotes;
  }

  static fromSaved(opts: GameOptions, saved: SavedGame): GameSession {
    const session = new GameSession(opts);
    session.board = parseGrid(saved.board);
    session.notes = decodeNotes(saved.notes);
    session.elapsedMs = saved.elapsedMs;
    session.mistakes = saved.mistakes;
    session.hintsUsed = saved.hintsUsed;
    // A save claiming "completed" is only believed if the board really is solved.
    session.status = saved.status === 'completed' && session.checkCompletion() ? 'completed' : 'in-progress';
    return session;
  }

  /** True when the saved board's givens no longer match this puzzle's givens (stale save). */
  static matchesGivens(puzzle: string, saved: SavedGame): boolean {
    const givens = parseGrid(puzzle);
    const board = parseGrid(saved.board);
    for (let i = 0; i < 81; i++) {
      if (givens[i] !== 0 && givens[i] !== board[i]) return false;
    }
    return true;
  }

  isGiven(idx: number): boolean {
    return this.givens[idx] !== 0;
  }

  tick(deltaMs: number): void {
    if (this.status !== 'completed') this.elapsedMs += deltaMs;
  }

  setDigit(idx: number, digit: number): void {
    if (digit < 1 || digit > 9) return;
    if (this.status === 'completed' || this.isGiven(idx)) return;

    this.pendingHintStep = null;
    const before = { value: this.board[idx]!, notes: this.notes[idx]! };
    this.board[idx] = digit;
    const after = { value: digit, notes: this.notes[idx]! };

    const autoNoteChanges: { idx: number; before: number; after: number }[] = [];
    if (this.autoRemoveNotes) {
      const bit = 1 << (digit - 1);
      for (const peer of PEERS[idx]!) {
        if ((this.notes[peer]! & bit) !== 0) {
          autoNoteChanges.push({ idx: peer, before: this.notes[peer]!, after: this.notes[peer]! & ~bit });
          this.notes[peer]! &= ~bit;
        }
      }
    }

    if (digit !== this.solution[idx]) {
      this.mistakes++;
    }

    this.pushMove({
      type: 'set',
      idx,
      before,
      after,
      autoNoteChanges: autoNoteChanges.length > 0 ? autoNoteChanges : undefined,
    });

    if (this.checkCompletion()) {
      this.status = 'completed';
    }
  }

  eraseCell(idx: number): void {
    if (this.status === 'completed' || this.isGiven(idx) || this.board[idx] === 0) return;
    this.pendingHintStep = null;
    const before = { value: this.board[idx]!, notes: this.notes[idx]! };
    this.board[idx] = 0;
    const after = { value: 0, notes: this.notes[idx]! };
    this.pushMove({ type: 'erase', idx, before, after });
  }

  toggleNote(idx: number, digit: number): void {
    if (digit < 1 || digit > 9) return;
    if (this.status === 'completed' || this.isGiven(idx) || this.board[idx] !== 0) return;
    this.pendingHintStep = null;
    const before = { value: this.board[idx]!, notes: this.notes[idx]! };
    this.notes[idx]! ^= 1 << (digit - 1);
    const after = { value: this.board[idx]!, notes: this.notes[idx]! };
    this.pushMove({ type: 'note', idx, before, after });
  }

  /**
   * Writes every empty cell's candidates (what the digits already on the board still allow) into its notes,
   * replacing whatever notes were there. One undo step. Returns false when nothing would change.
   */
  fillNotes(): boolean {
    if (this.status === 'completed') return false;
    const candidates = computeCandidates(this.board);
    const changes: { idx: number; before: number; after: number }[] = [];
    for (let i = 0; i < 81; i++) {
      if (this.board[i] !== 0 || this.isGiven(i)) continue;
      if (this.notes[i] !== candidates[i]) changes.push({ idx: i, before: this.notes[i]!, after: candidates[i]! });
    }
    if (changes.length === 0) return false;
    this.pendingHintStep = null;
    for (const change of changes) this.notes[change.idx] = change.after;
    this.pushMove({
      type: 'fill-notes',
      idx: -1,
      before: { value: 0, notes: 0 },
      after: { value: 0, notes: 0 },
      autoNoteChanges: changes,
    });
    return true;
  }

  private pushMove(move: Move): void {
    // A new edit makes the undone moves unreachable.
    this.redoStack = [];
    this.undoStack.push(move);
    if (this.undoStack.length > MAX_UNDO_MOVES) this.undoStack.shift();
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** Clears all player input and counters, returning the session to a fresh in-progress state. */
  reset(): void {
    this.board = cloneGrid(this.givens);
    this.notes = new Uint16Array(81);
    this.elapsedMs = 0;
    this.mistakes = 0;
    this.hintsUsed = 0;
    this.status = 'in-progress';
    this.undoStack = [];
    this.redoStack = [];
    this.pendingHintStep = null;
  }

  undo(): void {
    const move = this.undoStack.pop();
    if (!move) return;

    this.pendingHintStep = null;
    if (move.idx >= 0) {
      this.board[move.idx] = move.before.value;
      this.notes[move.idx] = move.before.notes;
    }
    if (move.autoNoteChanges) {
      for (const change of move.autoNoteChanges) {
        this.notes[change.idx] = change.before;
      }
    }
    if (this.status === 'completed') this.status = 'in-progress';
    this.redoStack.push(move);
  }

  /**
   * Re-applies the move most recently undone. Counters are not touched in either direction: a wrong digit
   * costs a heart once, when it is first entered, however often it is undone and redone.
   */
  redo(): void {
    const move = this.redoStack.pop();
    if (!move) return;

    this.pendingHintStep = null;
    if (move.idx >= 0) {
      this.board[move.idx] = move.after.value;
      this.notes[move.idx] = move.after.notes;
    }
    if (move.autoNoteChanges) {
      for (const change of move.autoNoteChanges) {
        this.notes[change.idx] = change.after;
      }
    }
    this.undoStack.push(move);
    if (this.checkCompletion()) this.status = 'completed';
  }

  /**
   * First call previews the next logical step without applying it (for the hint UI).
   * Second call (with the same pending step still queued) applies it and counts as a hint used.
   */
  hint(): Step | null {
    if (this.status === 'completed') return null;
    if (!this.pendingHintStep) {
      const result = solveLogically(this.boardWithoutMistakes());
      this.pendingHintStep = result.steps[0] ?? null;
      return this.pendingHintStep;
    }
    const step = this.pendingHintStep;
    this.pendingHintStep = null;
    this.hintsUsed++;
    this.applyStep(step);
    return step;
  }

  /** True while a previewed hint is waiting to be applied. Any edit to the board or notes discards it. */
  hasPendingHint(): boolean {
    return this.pendingHintStep !== null;
  }

  clearPendingHint(): void {
    this.pendingHintStep = null;
  }

  /**
   * The board with the player's wrong digits taken out. The logical solver assumes every filled cell is right;
   * feeding it a mistake can yield a step that places a wrong digit (and costs the player a heart).
   */
  private boardWithoutMistakes(): Grid {
    const clean = cloneGrid(this.board);
    for (let i = 0; i < 81; i++) {
      if (this.givens[i] === 0 && clean[i] !== 0 && clean[i] !== this.solution[i]) clean[i] = 0;
    }
    return clean;
  }

  private applyStep(step: Step): void {
    for (const { idx, digit } of step.placements) {
      this.setDigit(idx, digit);
    }
    for (const { idx, digit } of step.eliminations) {
      const bit = 1 << (digit - 1);
      if ((this.notes[idx]! & bit) !== 0) {
        this.toggleNote(idx, digit);
      }
    }
  }

  private checkCompletion(): boolean {
    if (!isComplete(this.board)) return false;
    for (let i = 0; i < 81; i++) {
      if (this.board[i] !== this.solution[i]) return false;
    }
    return true;
  }

  toSaved(now: number): SavedGame {
    return {
      puzzleId: this.puzzleId,
      board: gridToString(this.board, '.'),
      notes: encodeNotes(this.notes),
      elapsedMs: this.elapsedMs,
      mistakes: this.mistakes,
      hintsUsed: this.hintsUsed,
      status: this.status,
      completedAt: this.status === 'completed' ? now : undefined,
      updatedAt: now,
    };
  }
}
