import { useMemo } from 'react';
import { PEERS } from '../core/board';
import type { Grid } from '../core/types';
import { Cell, type HighlightState } from './Cell';

export interface BoardHighlightSettings {
  highlightSameDigit: boolean;
  highlightPeers: boolean;
}

interface BoardProps {
  givens: Grid;
  board: Grid;
  notes: Uint16Array;
  /** Bumps on every mutation; `board`/`notes` are mutated in place so their
   *  references never change -- this is what the highlight memo must key on. */
  version: number;
  selected: number | null;
  onSelect: (idx: number) => void;
  settings: BoardHighlightSettings;
  hintCells: readonly number[];
}

export function Board({
  givens,
  board,
  notes,
  version,
  selected,
  onSelect,
  settings,
  hintCells,
}: BoardProps): JSX.Element {
  const highlights = useMemo<HighlightState[]>(() => {
    const result: HighlightState[] = new Array(81).fill('none');
    const selectedValue = selected !== null ? board[selected]! : 0;
    const selectedPeers = selected !== null ? PEERS[selected]! : null;

    for (let idx = 0; idx < 81; idx++) {
      if (hintCells.includes(idx)) {
        result[idx] = 'hint';
        continue;
      }
      if (idx === selected) {
        result[idx] = 'selected';
        continue;
      }
      if (selected !== null && settings.highlightSameDigit && selectedValue !== 0 && board[idx] === selectedValue) {
        result[idx] = 'same-value';
        continue;
      }
      if (selected !== null && settings.highlightPeers && selectedPeers && selectedPeers.includes(idx)) {
        result[idx] = 'peer';
      }
    }
    return result;
  }, [board, version, selected, settings, hintCells]);

  return (
    <div
      role="grid"
      aria-label="Bàn cờ Sudoku"
      className="grid aspect-square w-full grid-cols-9 grid-rows-9 border-2 border-slate-500 bg-white dark:border-slate-400 dark:bg-slate-900"
      style={{ width: 'min(92vw, 60vh, 560px)' }}
    >
      {Array.from({ length: 81 }, (_, idx) => (
        <Cell
          key={idx}
          idx={idx}
          value={board[idx]!}
          notes={notes[idx]!}
          isGiven={givens[idx] !== 0}
          highlight={highlights[idx]!}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
