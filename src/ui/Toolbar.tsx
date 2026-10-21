import { Eraser, Lightbulb, PencilLine, Redo2, Undo2, WandSparkles, type LucideIcon } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';

interface ToolbarProps {
  noteMode: boolean;
  onToggleNoteMode: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onRedo: () => void;
  canRedo: boolean;
  onErase: () => void;
  canErase: boolean;
  /** Write every empty cell's candidates into its notes. */
  onFillNotes: () => void;
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
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-pressed={pressed}
          className={`btn btn-icon !h-[3.25rem] !w-[3.25rem] !rounded-2xl ${tone}`}
        >
          <Icon size={25} strokeWidth={2.75} aria-hidden="true" className={iconClass} />
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
      <span className="whitespace-nowrap text-[0.8rem] font-extrabold leading-none max-[359px]:text-[0.7rem]">{label}</span>
    </div>
  );
}

export function Toolbar({
  noteMode,
  onToggleNoteMode,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
  onErase,
  canErase,
  onFillNotes,
  onHint,
  hintPending,
  hintsUsed,
}: ToolbarProps): JSX.Element {
  const { t } = useI18n();
  return (
    <div role="toolbar" aria-label={t('toolbar.aria')} className="grid grid-cols-6 justify-items-center">
      <Tool icon={Undo2} label={t('toolbar.undo')} ariaLabel={t('toolbar.undoAria')} onClick={onUndo} disabled={!canUndo} iconClass="text-primary" />
      <Tool icon={Redo2} label={t('toolbar.redo')} ariaLabel={t('toolbar.redoAria')} onClick={onRedo} disabled={!canRedo} iconClass="text-primary" />
      <Tool icon={Eraser} label={t('toolbar.erase')} ariaLabel={t('toolbar.eraseAria')} onClick={onErase} disabled={!canErase} iconClass="text-rose-500" />
      <Tool
        icon={PencilLine}
        label={t('toolbar.notes')}
        ariaLabel={t(noteMode ? 'toolbar.notesOnAria' : 'toolbar.notesOffAria')}
        onClick={onToggleNoteMode}
        pressed={noteMode}
        tone={noteMode ? 'btn-sky' : 'btn-white'}
        iconClass={noteMode ? '' : 'text-sky-600'}
      />
      <Tool
        icon={WandSparkles}
        label={t('toolbar.fill')}
        ariaLabel={t('toolbar.fillAria')}
        onClick={onFillNotes}
        iconClass="text-sky-600"
      />
      <Tool
        icon={Lightbulb}
        label={t(hintPending ? 'toolbar.apply' : 'toolbar.hint')}
        ariaLabel={t(hintPending ? 'toolbar.applyAria' : 'toolbar.hintAria')}
        onClick={onHint}
        tone="btn-amber"
        iconClass={hintPending ? 'animate-wiggle' : ''}
        badge={hintsUsed}
      />
    </div>
  );
}
