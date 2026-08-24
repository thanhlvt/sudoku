import { memo } from 'react';

export type HighlightState = 'hint' | 'selected' | 'mistake' | 'same-value' | 'peer' | 'none';

interface CellProps {
  idx: number;
  value: number;
  notes: number;
  isGiven: boolean;
  highlight: HighlightState;
  onSelect: (idx: number) => void;
}

const HIGHLIGHT_BG: Record<HighlightState, string> = {
  hint: 'bg-amber-200 dark:bg-amber-800/60',
  selected: 'bg-blue-200 dark:bg-blue-800/70',
  mistake: 'bg-red-100 dark:bg-red-900/50',
  'same-value': 'bg-blue-100 dark:bg-blue-900/40',
  peer: 'bg-slate-100 dark:bg-slate-800/60',
  none: 'bg-white dark:bg-slate-900',
};

const NOTE_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function CellImpl({ idx, value, notes, isGiven, highlight, onSelect }: CellProps): JSX.Element {
  const row = Math.floor(idx / 9) + 1;
  const col = (idx % 9) + 1;
  const label =
    value === 0
      ? `Hàng ${row}, cột ${col}, trống`
      : `Hàng ${row}, cột ${col}, số ${value}${isGiven ? ', cho sẵn' : ''}`;

  const borderRight =
    col % 3 === 0 && col !== 9
      ? 'border-r-2 border-r-slate-500 dark:border-r-slate-400'
      : 'border-r border-r-slate-300 dark:border-r-slate-700';
  const borderBottom =
    row % 3 === 0 && row !== 9
      ? 'border-b-2 border-b-slate-500 dark:border-b-slate-400'
      : 'border-b border-b-slate-300 dark:border-b-slate-700';

  const textColor =
    highlight === 'mistake'
      ? 'text-red-600 dark:text-red-400'
      : isGiven
        ? 'text-slate-900 dark:text-slate-100 font-semibold'
        : 'text-blue-700 dark:text-blue-300';

  return (
    <button
      type="button"
      role="gridcell"
      aria-label={label}
      aria-selected={highlight === 'selected'}
      onClick={() => onSelect(idx)}
      className={`relative flex aspect-square select-none items-center justify-center text-[clamp(14px,4vw,26px)] tabular-nums focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-blue-500 ${borderRight} ${borderBottom} ${HIGHLIGHT_BG[highlight]} ${textColor}`}
    >
      {value !== 0 ? (
        value
      ) : notes !== 0 ? (
        <span className="grid h-full w-full grid-cols-3 grid-rows-3 p-0.5 text-[28%] leading-none text-slate-500 dark:text-slate-400">
          {NOTE_DIGITS.map((d) => (
            <span key={d} className="flex items-center justify-center">
              {notes & (1 << (d - 1)) ? d : ''}
            </span>
          ))}
        </span>
      ) : null}
    </button>
  );
}

export const Cell = memo(CellImpl);
