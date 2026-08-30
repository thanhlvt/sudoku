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
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-slate-300 text-lg font-medium tabular-nums hover:bg-slate-100 active:bg-slate-200 dark:border-slate-600 dark:hover:bg-slate-800"
        >
          {d}
        </button>
      ))}
    </div>
  );
}
