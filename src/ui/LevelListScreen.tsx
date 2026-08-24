import type { Level, LevelBank } from '../core/types';
import { loadGame } from '../storage/schema';
import { formatTime } from './Timer';
import { LEVEL_LABELS } from './levelLabels';

interface LevelListScreenProps {
  level: Level;
  bank: LevelBank | null;
  onNavigate: (hash: string) => void;
  onBack: () => void;
}

export function LevelListScreen({ level, bank, onNavigate, onBack }: LevelListScreenProps): JSX.Element {
  return (
    <div className="mx-auto max-w-2xl p-4">
      <button type="button" onClick={onBack} className="mb-4 text-sm text-blue-600 dark:text-blue-400">
        &larr; Quay lại
      </button>
      <h1 className="mb-4 text-xl font-bold">{LEVEL_LABELS[level]}</h1>
      {!bank && <p className="text-sm text-slate-500">Đang tải danh sách màn...</p>}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {(bank?.puzzles ?? []).map((p) => {
          const saved = loadGame(p.id);
          const status = saved?.status ?? 'new';
          const statusClass =
            status === 'completed'
              ? 'border-green-400 bg-green-50 dark:bg-green-900/30'
              : status === 'in-progress'
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                : 'border-slate-300 dark:border-slate-600';
          const statusLabel = status === 'completed' ? 'đã xong' : status === 'in-progress' ? 'đang chơi' : 'chưa chơi';
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onNavigate(`#/play/${p.id}`)}
              aria-label={`Màn ${p.index + 1}, ${statusLabel}`}
              className={`flex min-h-[44px] flex-col items-center rounded-md border p-2 text-sm ${statusClass}`}
            >
              <span className="font-semibold">{p.index + 1}</span>
              {status === 'completed' && saved && (
                <span className="text-[10px] tabular-nums text-slate-500">{formatTime(saved.elapsedMs)}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
