interface NumberPadProps {
  noteMode: boolean;
  /** `remaining[d]` = how many more cells still need digit `d` (index 1–9). */
  remaining: readonly number[];
  onDigit: (digit: number) => void;
}

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export function NumberPad({ noteMode, remaining, onDigit }: NumberPadProps): JSX.Element {
  return (
    <div role="group" aria-label="Bàn phím số" className="grid w-full grid-cols-9 gap-1.5">
      {DIGITS.map((d) => {
        const left = remaining[d] ?? 0;
        const done = left <= 0;
        return (
          <button
            key={d}
            type="button"
            onClick={() => onDigit(d)}
            disabled={done}
            aria-label={`Số ${d}${noteMode ? ', chế độ ghi chú' : ''}, còn ${Math.max(0, left)} ô`}
            className={`btn btn-white h-16 min-w-0 flex-col !gap-1 !rounded-xl !px-0 transition-[transform,box-shadow,opacity,filter] ${
              done ? '!scale-90 !opacity-30' : ''
            }`}
          >
            <span className={`text-[1.7rem] font-black leading-none ${noteMode ? 'text-sky-600' : 'text-primary'}`}>{d}</span>
            <span className="text-xs font-extrabold leading-none tabular-nums text-accent">{Math.max(0, left)}</span>
          </button>
        );
      })}
    </div>
  );
}
