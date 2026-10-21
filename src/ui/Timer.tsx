import { Clock } from 'lucide-react';

export function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

interface TimerProps {
  elapsedMs: number;
  paused: boolean;
  /** Time-attack countdown: when set, the chip shows the time left instead of the time spent. */
  limitMs?: number | null;
}

/** Under this much time left the countdown turns red. */
const URGENT_MS = 60_000;

export function Timer({ elapsedMs, paused, limitMs = null }: TimerProps): JSX.Element {
  const counting = limitMs !== null;
  const shown = counting ? Math.max(0, limitMs - elapsedMs) : elapsedMs;
  const urgent = counting && shown <= URGENT_MS;
  return (
    <div
      className={`card flex items-center gap-2 !rounded-full px-4 py-2 text-xl font-extrabold tabular-nums ${
        urgent ? 'text-rose-600 dark:text-rose-300' : ''
      }`}
      aria-live="off"
      aria-label={`${counting ? 'Còn lại' : 'Thời gian'} ${formatTime(shown)}${paused ? ', đang tạm dừng' : ''}`}
    >
      <Clock
        size={22}
        strokeWidth={2.75}
        className={`${urgent ? 'text-rose-500' : 'text-primary'} ${paused ? 'opacity-50' : ''}`}
        aria-hidden="true"
      />
      <span className={paused ? 'opacity-60 transition-opacity' : 'transition-opacity'}>{formatTime(shown)}</span>
    </div>
  );
}
