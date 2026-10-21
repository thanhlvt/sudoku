import { memo, useEffect, useRef, type CSSProperties } from 'react';

export type HighlightState = 'hint' | 'selected' | 'same-value' | 'peer' | 'none';

interface CellProps {
  idx: number;
  value: number;
  notes: number;
  isGiven: boolean;
  /** Player-entered digit that differs from the solution (only passed when mistakes are shown). */
  isWrong: boolean;
  highlight: HighlightState;
  /** Set while a completed row/column/box ripples; the delay is in "steps" from the cell just filled. */
  waveDelay: number | undefined;
  onSelect: (idx: number) => void;
}

const HIGHLIGHT_BG: Record<HighlightState, string> = {
  hint: 'bg-board-hint animate-hint-glow',
  selected: 'bg-board-sel shadow-[inset_0_0_0_3px_rgb(var(--c-accent)/0.6)]',
  'same-value': 'bg-board-same',
  peer: 'bg-board-peer',
  none: 'bg-board-cell',
};

const NOTE_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const WAVE_STEP_MS = 45;

function CellImpl({ idx, value, notes, isGiven, isWrong, highlight, waveDelay, onSelect }: CellProps): JSX.Element {
  // Cells restored from a saved game mount already filled; only changes after mount should animate.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);
  const animate = mounted.current;

  const row = Math.floor(idx / 9) + 1;
  const col = (idx % 9) + 1;
  const label =
    value === 0
      ? `Hàng ${row}, cột ${col}, trống`
      : `Hàng ${row}, cột ${col}, số ${value}${isGiven ? ', cho sẵn' : isWrong ? ', sai' : ''}`;

  const borderRight =
    col === 9 ? '' : col % 3 === 0 ? 'border-r-[3px] border-r-board-frame' : 'border-r border-r-board-line';
  const borderBottom =
    row === 9 ? '' : row % 3 === 0 ? 'border-b-[3px] border-b-board-frame' : 'border-b border-b-board-line';

  // Wrong digits keep a red fill + ring even when selected, so the state isn't carried by colour alone.
  const bg =
    isWrong && highlight !== 'selected' && highlight !== 'hint'
      ? 'bg-board-wrong shadow-[inset_0_0_0_2px_rgb(var(--b-wrong-ink))]'
      : HIGHLIGHT_BG[highlight];
  const text = isWrong ? 'text-board-wrong-ink' : isGiven ? 'text-ink' : 'text-board-user';
  const weight = highlight === 'same-value' || highlight === 'selected' ? 'font-black' : 'font-extrabold';

  const waving = waveDelay !== undefined;
  const style: CSSProperties | undefined = waving ? { animationDelay: `${waveDelay * WAVE_STEP_MS}ms` } : undefined;

  return (
    <button
      type="button"
      role="gridcell"
      aria-label={label}
      aria-selected={highlight === 'selected'}
      onClick={() => onSelect(idx)}
      style={style}
      className={`relative flex aspect-square select-none items-center justify-center tabular-nums transition-colors duration-150 focus:outline-none focus-visible:z-10 focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-accent ${borderRight} ${borderBottom} ${bg} ${text} ${weight} ${waving ? 'z-10 animate-wave' : ''}`}
    >
      {value !== 0 ? (
        // Re-keyed per value so each new digit replays its entrance: a pop, or a shake when it is wrong.
        <span key={value} className={`cell-digit leading-none ${animate ? (isWrong ? 'animate-shake' : !isGiven ? 'animate-digit-pop' : '') : ''}`}>
          {value}
        </span>
      ) : notes !== 0 ? (
        <span className="cell-note grid h-full w-full grid-cols-3 grid-rows-3 p-[6%] font-bold leading-none text-accent">
          {NOTE_DIGITS.map((d) => (
            <span key={d} className="flex items-center justify-center">
              {notes & (1 << (d - 1)) ? <span className={animate ? 'animate-digit-pop' : ''}>{d}</span> : null}
            </span>
          ))}
        </span>
      ) : null}
    </button>
  );
}

export const Cell = memo(CellImpl);
