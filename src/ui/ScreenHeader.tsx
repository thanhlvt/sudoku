import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
  /** Something small on the right, e.g. a counter. */
  right?: ReactNode;
}

/** Back button + title, shared by the secondary screens (achievements, calendar, learn, stats). */
export function ScreenHeader({ title, onBack, right }: ScreenHeaderProps): JSX.Element {
  return (
    <header className="flex items-center gap-3">
      <button type="button" onClick={onBack} aria-label="Quay lại" className="btn btn-white btn-icon !h-12 !w-12 shrink-0 !rounded-2xl">
        <ChevronLeft size={28} strokeWidth={3.5} aria-hidden="true" className="text-accent" />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-2xl font-black">{title}</h1>
      {right}
    </header>
  );
}
