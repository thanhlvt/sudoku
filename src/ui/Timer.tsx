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
    <div className="tabular-nums text-lg font-medium" aria-live="off">
      {formatTime(elapsedMs)}
      {paused ? ' (tạm dừng)' : ''}
    </div>
  );
}
