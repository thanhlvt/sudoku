import { useMemo } from 'react';
import { PEERS } from '../core/board';
import type { Grid } from '../core/types';
import { useI18n } from '../i18n/useI18n';
import { Cell, type HighlightState } from './Cell';

export interface BoardHighlightSettings {
  highlightSameDigit: boolean;
  highlightPeers: boolean;
  showMistakes: boolean;
}

interface BoardProps {
  givens: Grid;
  board: Grid;
  solution: Grid;
  notes: Uint16Array;
  /** Bumps on every mutation; `board`/`notes` are mutated in place so their
   *  references never change -- this is what the highlight memo must key on. */
  version: number;
  selected: number | null;
  onSelect: (idx: number) => void;
  settings: BoardHighlightSettings;
  hintCells: readonly number[];
  /** Cells of a just-completed row/column/box -> ripple delay steps. */
  wave: ReadonlyMap<number, number> | null;
}

export function Board({
  givens,
  board,
  solution,
  notes,
  version,
  selected,
  onSelect,
  settings,
  hintCells,
  wave,
}: BoardProps): JSX.Element {
  const { t } = useI18n();
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
    // `board` is mutated in place; `version` is what actually signals a change.
  }, [board, version, selected, settings, hintCells]);

  return (
    <div
      role="grid"
      aria-label={t('board.aria')}
      className="board mx-auto grid aspect-square grid-cols-9 grid-rows-9 overflow-hidden rounded-2xl border-[3px] border-board-frame bg-board-cell"
      style={{ width: 'min(100%, max(280px, calc(100dvh - 400px)))' }}
    >
      {Array.from({ length: 81 }, (_, idx) => {
        const value = board[idx]!;
        return (
          <Cell
            key={idx}
            idx={idx}
            value={value}
            notes={notes[idx]!}
            isGiven={givens[idx] !== 0}
            isWrong={settings.showMistakes && value !== 0 && givens[idx] === 0 && value !== solution[idx]}
            highlight={highlights[idx]!}
            waveDelay={wave?.get(idx)}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}
