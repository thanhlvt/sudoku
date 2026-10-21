import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

interface SheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Bottom sheet: dimmed backdrop fades in, the panel slides up. Closes on backdrop tap or Escape. */
export function Sheet({ title, onClose, children }: SheetProps): JSX.Element {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 animate-fade-in bg-night/60" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative max-h-[90dvh] w-full max-w-md animate-sheet-up overflow-y-auto rounded-t-[2rem] bg-card p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] outline-none"
      >
        <div className="sheet-handle mx-auto mb-4" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="btn btn-soft btn-icon !h-10 !w-10 !rounded-xl">
            <X size={20} strokeWidth={3} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
