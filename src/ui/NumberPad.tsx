interface NumberPadProps {
  remaining: readonly number[]; // remaining[d-1] = how many of digit d are left to place
  noteMode: boolean;
  onDigit: (digit: number) => void;
}

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export function NumberPad({ remaining, noteMode, onDigit }: NumberPadProps): JSX.Element {
  return (
    <div role="group" aria-label="Bàn phím số" className="grid w-full grid-cols-9 gap-1" style={{ maxWidth: 560 }}>
      {DIGITS.map((d) => {
        const left = remaining[d - 1] ?? 0;
        const disabled = left <= 0;
        return (
          <button
            key={d}
            type="button"
            disabled={disabled}
            onClick={() => onDigit(d)}
            aria-label={`Số ${d}, còn lại ${left} ô${noteMode ? ', chế độ ghi chú' : ''}`}
            className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-md border text-lg font-medium tabular-nums ${
              disabled
                ? 'cursor-not-allowed border-slate-200 opacity-30 dark:border-slate-700'
                : 'border-slate-300 hover:bg-slate-100 active:bg-slate-200 dark:border-slate-600 dark:hover:bg-slate-800'
            }`}
          >
            <span>{d}</span>
            <span className="text-[10px] text-slate-400">{left}</span>
          </button>
        );
      })}
    </div>
  );
}
