import { Eraser, Lightbulb, PencilLine, Undo2, type LucideIcon } from 'lucide-react';

interface ToolbarProps {
  noteMode: boolean;
  onToggleNoteMode: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onErase: () => void;
  canErase: boolean;
  onHint: () => void;
  /** A hint has been previewed; the next press applies it. */
  hintPending: boolean;
  hintsUsed: number;
}

interface ToolProps {
  icon: LucideIcon;
  label: string;
  ariaLabel: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  tone?: string;
  iconClass?: string;
  badge?: number;
}

function Tool({ icon: Icon, label, ariaLabel, onClick, disabled, pressed, tone = 'btn-white', iconClass = '', badge }: ToolProps): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-pressed={pressed}
          className={`btn btn-icon !h-[3.75rem] !w-[3.75rem] !rounded-[1.25rem] ${tone}`}
        >
          <Icon size={28} strokeWidth={2.75} aria-hidden="true" className={iconClass} />
        </button>
        {badge !== undefined && badge > 0 && (
          <span
            key={badge}
            className="pointer-events-none absolute -right-2 -top-2 flex h-6 min-w-6 animate-pop-in items-center justify-center rounded-full bg-rose-500 px-1.5 text-sm font-black text-white"
            aria-hidden="true"
          >
            {badge}
          </span>
        )}
      </div>
      <span className="text-base font-extrabold leading-none">{label}</span>
    </div>
  );
}

export function Toolbar({
  noteMode,
  onToggleNoteMode,
  onUndo,
  canUndo,
  onErase,
  canErase,
  onHint,
  hintPending,
  hintsUsed,
}: ToolbarProps): JSX.Element {
  return (
    <div role="toolbar" aria-label="Công cụ" className="grid grid-cols-4 justify-items-center">
      <Tool icon={Undo2} label="Hoàn tác" ariaLabel="Hoàn tác (U)" onClick={onUndo} disabled={!canUndo} iconClass="text-primary" />
      <Tool icon={Eraser} label="Xóa" ariaLabel="Xóa số (Backspace)" onClick={onErase} disabled={!canErase} iconClass="text-rose-500" />
      <Tool
        icon={PencilLine}
        label="Ghi chú"
        ariaLabel={noteMode ? 'Ghi chú: đang bật (N)' : 'Ghi chú: đang tắt (N)'}
        onClick={onToggleNoteMode}
        pressed={noteMode}
        tone={noteMode ? 'btn-sky' : 'btn-white'}
        iconClass={noteMode ? '' : 'text-sky-600'}
      />
      <Tool
        icon={Lightbulb}
        label={hintPending ? 'Áp dụng' : 'Gợi ý'}
        ariaLabel={hintPending ? 'Áp dụng gợi ý (H)' : 'Gợi ý (H)'}
        onClick={onHint}
        tone="btn-amber"
        iconClass={hintPending ? 'animate-wiggle' : ''}
        badge={hintsUsed}
      />
    </div>
  );
}
