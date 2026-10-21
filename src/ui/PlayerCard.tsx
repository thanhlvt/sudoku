import { useMemo, type CSSProperties } from 'react';
import { playerLevel, totalXp } from '../game/xp';
import { loadWeekly, type SavedGame } from '../storage/schema';

interface PlayerCardProps {
  games: readonly SavedGame[];
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
}

/** The player's level, title and progress to the next level. Experience is derived from the saved games. */
export function PlayerCard({ games, onClick, className = '', style }: PlayerCardProps): JSX.Element {
  const xp = useMemo(() => totalXp(games, loadWeekly().done.length), [games]);
  const { level, title, into, span } = playerLevel(xp);
  const pct = (into / span) * 100;

  const body = (
    <>
      <span
        className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary text-white shadow-[0_4px_0_0_#5B21B6]"
        aria-hidden="true"
      >
        <span className="text-[0.6rem] font-black uppercase leading-none tracking-wider text-white/80">Cấp</span>
        <span className="text-2xl font-black leading-none">{level}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-lg font-black">{title}</span>
          <span className="shrink-0 text-sm font-extrabold tabular-nums text-accent">
            {into}/{span} XP
          </span>
        </span>
        <span className="h-3 overflow-hidden rounded-full bg-soft" role="img" aria-label={`Cấp ${level}, ${into} trên ${span} kinh nghiệm`}>
          <span
            className="block h-full animate-bar-grow rounded-full bg-primary-light"
            style={{ width: into > 0 ? `max(${pct}%, 0.75rem)` : 0 }}
          />
        </span>
      </span>
    </>
  );

  const base = `card flex items-center gap-4 p-4 text-left ${className}`;
  return onClick ? (
    <button type="button" onClick={onClick} className={`btn btn-white !h-auto w-full justify-start gap-4 !rounded-3xl !px-4 !py-4 ${className}`} style={style}>
      {body}
    </button>
  ) : (
    <div className={base} style={style}>
      {body}
    </div>
  );
}
