import { useCallback, useEffect, useRef } from 'react';
import { useI18n } from '../i18n/useI18n';

interface NumberPadProps {
  noteMode: boolean;
  /** `remaining[d]` = how many more cells still need digit `d` (index 1–9). */
  remaining: readonly number[];
  /** `quick` is true when the digit was held down: the opposite of the current note mode, for one entry. */
  onDigit: (digit: number, quick?: boolean) => void;
}

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const LONG_PRESS_MS = 380;

interface DigitButtonProps {
  digit: number;
  left: number;
  noteMode: boolean;
  onDigit: (digit: number, quick?: boolean) => void;
}

function DigitButton({ digit, left, noteMode, onDigit }: DigitButtonProps): JSX.Element {
  const { t } = useI18n();
  const done = left <= 0;
  const timerRef = useRef<number | null>(null);
  /** Set when a hold already entered the digit, so the click that follows the release is ignored. */
  const heldRef = useRef(false);

  const cancelHold = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  useEffect(() => cancelHold, [cancelHold]);

  return (
    <button
      type="button"
      onPointerDown={(e) => {
        if (e.button !== 0 || done) return;
        heldRef.current = false;
        cancelHold();
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null;
          heldRef.current = true;
          onDigit(digit, true);
        }, LONG_PRESS_MS);
      }}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      // A long press on touch screens would otherwise open the browser's context menu.
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        if (heldRef.current) {
          heldRef.current = false;
          return;
        }
        onDigit(digit);
      }}
      disabled={done}
      aria-label={t(noteMode ? 'pad.digitNote' : 'pad.digit', { digit, left: Math.max(0, left) })}
      className={`btn btn-white h-16 min-w-0 select-none flex-col !gap-1 !rounded-xl !px-0 transition-[transform,box-shadow,opacity,filter] ${
        done ? '!scale-90 !opacity-30' : ''
      }`}
    >
      <span className={`text-[1.7rem] font-black leading-none ${noteMode ? 'text-sky-600' : 'text-primary'}`}>{digit}</span>
      <span className="text-xs font-extrabold leading-none tabular-nums text-accent">{Math.max(0, left)}</span>
    </button>
  );
}

export function NumberPad({ noteMode, remaining, onDigit }: NumberPadProps): JSX.Element {
  const { t } = useI18n();
  return (
    <div role="group" aria-label={t('pad.aria')} className="grid w-full grid-cols-9 gap-1.5">
      {DIGITS.map((d) => (
        <DigitButton key={d} digit={d} left={remaining[d] ?? 0} noteMode={noteMode} onDigit={onDigit} />
      ))}
    </div>
  );
}
