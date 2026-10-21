import { ChevronLeft, Play, Star } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import type { Level, LevelBank } from '../core/types';
import { pickNextIndex, starsFor, summarizeByLevel } from '../game/progress';
import { Stars } from './Stars';
import { LEVEL_LABELS, LEVEL_THEME } from './levelLabels';
import { useSavedProgress } from './hooks/useSavedProgress';

interface LevelListScreenProps {
  level: Level;
  bank: LevelBank | null;
  /** The level's bank could not be loaded; show a retry instead of skeletons forever. */
  loadFailed: boolean;
  onRetry: () => void;
  onNavigate: (hash: string) => void;
  onBack: () => void;
}

const PAGE_SIZE = 20;

const COMPLETED_STYLE = { '--btn-bg': '34 197 94', '--btn-edge': '21 128 61', '--btn-fg': '255 255 255' } as CSSProperties;
const TAB_ACTIVE_STYLE = { '--btn-bg': '49 46 129', '--btn-edge': '30 27 75', '--btn-fg': '255 255 255' } as CSSProperties;

export function LevelListScreen({ level, bank, loadFailed, onRetry, onNavigate, onBack }: LevelListScreenProps): JSX.Element {
  const theme = LEVEL_THEME[level];
  const { games, byId } = useSavedProgress();
  const [pageOverride, setPageOverride] = useState<number | null>(null);

  const count = bank?.puzzles.length ?? 0;
  const summary = useMemo(() => summarizeByLevel(games)[level], [games, level]);
  const nextIndex = useMemo(() => (bank ? pickNextIndex(level, count, byId) : 0), [bank, level, count, byId]);
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const page = Math.min(pageOverride ?? Math.floor(nextIndex / PAGE_SIZE), pageCount - 1);

  const pct = count > 0 ? (summary.completed / count) * 100 : 0;
  const pageStart = page * PAGE_SIZE;
  const pagePuzzles = (bank?.puzzles ?? []).slice(pageStart, pageStart + PAGE_SIZE);
  const nextPuzzle = bank?.puzzles[nextIndex];

  return (
    <main className="flex flex-1 flex-col">
      <header className={`relative overflow-hidden rounded-b-[2.25rem] px-5 pb-6 pt-5 ${theme.bg}`}>
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute -right-3 -top-6 animate-pop-in text-[11rem] font-black leading-none ${theme.ghost}`}
        >
          {theme.n}
        </span>
        <div className="relative flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Quay lại"
            className="btn btn-icon !h-12 !w-12 !rounded-2xl !shadow-none"
            style={{ '--btn-bg': theme.edgeRgb, '--btn-edge': theme.edgeRgb, '--btn-fg': '255 255 255' } as CSSProperties}
          >
            <ChevronLeft size={28} strokeWidth={3.5} aria-hidden="true" />
          </button>
          <h1 className="text-3xl font-black text-white">{LEVEL_LABELS[level]}</h1>
        </div>
        <div className="relative mt-4 flex gap-2 text-base font-extrabold text-white">
          <span className={`rounded-full px-4 py-2 tabular-nums ${theme.edge}`}>
            {summary.completed}/{count} màn
          </span>
          <span className={`flex items-center gap-1.5 rounded-full px-4 py-2 tabular-nums ${theme.edge}`}>
            <Star size={16} strokeWidth={0} className="fill-amber-400" aria-hidden="true" />
            {summary.stars}/{count * 3}
          </span>
        </div>
        <div className={`relative mt-4 h-3 overflow-hidden rounded-full ${theme.edge}`}>
          <span
            className="block h-full animate-bar-grow rounded-full bg-amber-400"
            style={{ width: summary.completed > 0 ? `max(${pct}%, 0.75rem)` : 0 }}
          />
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto px-5 pb-2 pt-4" role="tablist" aria-label="Nhóm màn">
        {Array.from({ length: pageCount }, (_, p) => {
          const active = p === page;
          const from = p * PAGE_SIZE + 1;
          const to = Math.min(count, (p + 1) * PAGE_SIZE);
          return (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setPageOverride(p)}
              className={`btn min-h-11 min-w-0 flex-1 !rounded-xl !px-1 text-sm tabular-nums ${active ? 'animate-tab-pop' : 'btn-white !text-accent'}`}
              style={active ? TAB_ACTIVE_STYLE : undefined}
            >
              {from}–{to}
            </button>
          );
        })}
      </div>

      <div key={page} className="grid grid-cols-4 gap-3 px-5 pb-4 pt-3">
        {!bank && loadFailed && (
          <div role="alert" className="col-span-4 flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-base font-bold text-accent">Không tải được danh sách màn. Hãy kiểm tra kết nối mạng.</p>
            <button type="button" onClick={onRetry} className="btn btn-primary min-h-12 px-6">
              Thử lại
            </button>
          </div>
        )}
        {!bank &&
          !loadFailed &&
          Array.from({ length: PAGE_SIZE }, (_, i) => (
            <div key={i} className="aspect-[1/0.88] animate-pulse rounded-2xl bg-soft" aria-hidden="true" />
          ))}
        {pagePuzzles.map((p, i) => {
          const saved = byId.get(p.id);
          const status = saved?.status ?? 'new';
          const isNext = p.index === nextIndex;
          const stateClass =
            status === 'completed' ? '' : isNext ? 'btn-primary cta-ring' : 'btn-tile';
          const statusLabel =
            status === 'completed'
              ? `đã xong, ${starsFor(saved!.mistakes)} sao`
              : status === 'in-progress'
                ? 'đang chơi'
                : 'chưa chơi';
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onNavigate(`#/play/${p.id}`)}
              aria-label={`Màn ${p.index + 1}, ${statusLabel}`}
              className={`btn aspect-[1/0.88] animate-pop-in flex-col gap-1 !rounded-2xl !px-0 text-2xl font-black ${stateClass}`}
              style={{ ...(status === 'completed' ? COMPLETED_STYLE : null), animationDelay: `${Math.min(i * 22, 440)}ms` }}
            >
              <span className="leading-none">{p.index + 1}</span>
              {status === 'completed' ? (
                <Stars
                  count={starsFor(saved!.mistakes)}
                  size={14}
                  filledClass="fill-yellow-300 text-yellow-300"
                  emptyClass="fill-transparent text-white/70"
                />
              ) : isNext ? (
                <span className="text-xs font-black uppercase leading-none tracking-wider">Chơi</span>
              ) : status === 'in-progress' ? (
                <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-0 mt-auto bg-gradient-to-t from-page via-page to-transparent px-5 pb-6 pt-8">
        <button
          type="button"
          disabled={!nextPuzzle}
          onClick={() => nextPuzzle && onNavigate(`#/play/${nextPuzzle.id}`)}
          className="btn btn-primary cta-ring cta-shine min-h-16 w-full text-xl"
        >
          <Play size={22} strokeWidth={0} className="fill-white" aria-hidden="true" />
          {nextPuzzle ? `Chơi màn ${nextPuzzle.index + 1}` : 'Đang tải...'}
        </button>
      </div>
    </main>
  );
}
