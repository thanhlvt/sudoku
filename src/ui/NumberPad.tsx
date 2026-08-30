interface NumberPadProps {
  noteMode: boolean;
  onDigit: (digit: number) => void;
}

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export function NumberPad({ noteMode, onDigit }: NumberPadProps): JSX.Element {
  return (
    <div role="group" aria-label="Bàn phím số" className="grid w-full grid-cols-9 gap-1" style={{ maxWidth: 560 }}>
      {DIGITS.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onDigit(d)}
          aria-label={`Số ${d}${noteMode ? ', chế độ ghi chú' : ''}`}
          className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border text-lg font-medium tabular-nums ${
            noteMode
              ? 'border-blue-400 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 dark:border-blue-500 dark:bg-blue-900/30 dark:hover:bg-blue-900/50'
              : 'border-slate-300 hover:bg-slate-100 active:bg-slate-200 dark:border-slate-600 dark:hover:bg-slate-800'
          }`}
        >
          {d}
        </button>
      ))}
    </div>
  );
}
