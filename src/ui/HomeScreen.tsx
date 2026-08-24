import type { Manifest } from '../core/types';
import type { LastPlayed, Stats } from '../storage/schema';
import { LEVEL_LABELS } from './levelLabels';

interface HomeScreenProps {
  manifest: Manifest | null;
  stats: Stats;
  last: LastPlayed | null;
  onNavigate: (hash: string) => void;
}

export function HomeScreen({ manifest, stats, last, onNavigate }: HomeScreenProps): JSX.Element {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-center text-2xl font-bold">Sudoku</h1>
      {last && (
        <button
          type="button"
          onClick={() => onNavigate(`#/play/${last.puzzleId}`)}
          className="min-h-[44px] rounded-md bg-blue-600 font-medium text-white"
        >
          Chơi tiếp
        </button>
      )}
      <div className="grid grid-cols-1 gap-3">
        {(manifest?.levels ?? []).map(({ level, count }) => {
          const s = stats[level];
          return (
            <button
              key={level}
              type="button"
              onClick={() => onNavigate(`#/level/${level}`)}
              className="min-h-[44px] rounded-lg border border-slate-300 p-4 text-left hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              <div className="font-semibold">{LEVEL_LABELS[level]}</div>
              <div className="text-sm text-slate-500">
                {s.completed}/{count} đã xong
              </div>
            </button>
          );
        })}
        {!manifest && <p className="text-center text-sm text-slate-500">Đang tải danh sách cấp độ...</p>}
      </div>
    </div>
  );
}
