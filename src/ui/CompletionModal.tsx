import { formatTime } from './Timer';

interface CompletionModalProps {
  elapsedMs: number;
  mistakes: number;
  hintsUsed: number;
  isNewRecord: boolean;
  onNext: () => void;
  onClose: () => void;
}

export function CompletionModal({
  elapsedMs,
  mistakes,
  hintsUsed,
  isNewRecord,
  onNext,
  onClose,
}: CompletionModalProps): JSX.Element {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="completion-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 id="completion-title" className="mb-1 text-xl font-semibold">
          Hoàn thành!
        </h2>
        {isNewRecord && <p className="mb-3 text-sm text-amber-600 dark:text-amber-400">Kỷ lục mới!</p>}
        <dl className="mb-4 grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-slate-500">Thời gian</dt>
          <dd className="tabular-nums">{formatTime(elapsedMs)}</dd>
          <dt className="text-slate-500">Lỗi</dt>
          <dd>{mistakes}</dd>
          <dt className="text-slate-500">Gợi ý đã dùng</dt>
          <dd>{hintsUsed}</dd>
        </dl>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] flex-1 rounded-md border border-slate-300 dark:border-slate-600"
          >
            Đóng
          </button>
          <button type="button" onClick={onNext} className="min-h-[44px] flex-1 rounded-md bg-blue-600 text-white">
            Màn tiếp theo
          </button>
        </div>
      </div>
    </div>
  );
}
