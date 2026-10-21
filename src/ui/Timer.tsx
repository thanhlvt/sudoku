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
}

export function Timer({ elapsedMs, paused }: TimerProps): JSX.Element {
  return (
    <div
      className="card flex items-center gap-2 !rounded-full px-4 py-2 text-xl font-extrabold tabular-nums"
      aria-live="off"
      aria-label={`Thời gian ${formatTime(elapsedMs)}${paused ? ', đang tạm dừng' : ''}`}
    >
      <Clock size={22} strokeWidth={2.75} className={`text-primary ${paused ? 'opacity-50' : ''}`} aria-hidden="true" />
      <span className={paused ? 'opacity-60 transition-opacity' : 'transition-opacity'}>{formatTime(elapsedMs)}</span>
    </div>
  );
}
