interface ToolbarProps {
  noteMode: boolean;
  onToggleNoteMode: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onHint: () => void;
  paused: boolean;
  onTogglePause: () => void;
  onPrint: () => void;
}

const BTN =
  'min-h-[44px] px-3 rounded-md border border-slate-300 dark:border-slate-600 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed';

export function Toolbar({
  noteMode,
  onToggleNoteMode,
  onUndo,
  canUndo,
  onHint,
  paused,
  onTogglePause,
  onPrint,
}: ToolbarProps): JSX.Element {
  return (
    <div className="flex w-full flex-wrap items-center gap-2" style={{ maxWidth: 560 }}>
      <button type="button" onClick={onUndo} disabled={!canUndo} aria-label="Hoàn tác (U)" className={BTN}>
        ↶ Hoàn tác
      </button>
      <button
        type="button"
        onClick={onToggleNoteMode}
        aria-pressed={noteMode}
        aria-label="Chế độ ghi chú (N)"
        className={`${BTN} ${noteMode ? 'border-blue-400 bg-blue-100 dark:bg-blue-900/50' : ''}`}
      >
        ✎ Ghi chú
      </button>
      <button type="button" onClick={onHint} aria-label="Gợi ý (H)" className={BTN}>
        💡 Gợi ý
      </button>
      <button type="button" onClick={onTogglePause} aria-label="Tạm dừng (Space)" className={BTN}>
        {paused ? '▶ Tiếp tục' : '⏸ Tạm dừng'}
      </button>
      <button type="button" onClick={onPrint} aria-label="In câu đố ra giấy" className={BTN}>
        🖨 In
      </button>
    </div>
  );
}
