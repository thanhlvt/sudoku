import { Check, Lightbulb, Play } from 'lucide-react';
import { useMemo, type CSSProperties } from 'react';
import { levelFromPuzzleId } from '../game/puzzleBank';
import { indexPuzzles, masteredTechniques, practicePuzzles } from '../game/practice';
import { findTechniqueExample } from '../game/techniqueExample';
import { techniqueInfo } from '../game/techniqueInfo';
import { ExampleBoard } from './ExampleBoard';
import { ScreenHeader } from './ScreenHeader';
import { LEVEL_LABELS } from './levelLabels';
import { useAllBanks } from './hooks/useAllBanks';
import { useSavedProgress } from './hooks/useSavedProgress';

interface TechniqueScreenProps {
  id: string;
  onNavigate: (hash: string) => void;
  onBack: () => void;
}

const MAX_PRACTICE = 6;
/** How many practice puzzles are tried when looking for one that yields a worked example. */
const EXAMPLE_ATTEMPTS = 4;

export function TechniqueScreen({ id, onNavigate, onBack }: TechniqueScreenProps): JSX.Element {
  const info = techniqueInfo(id);
  const { banks, failed, retry } = useAllBanks();
  const { games, byId } = useSavedProgress();

  const data = useMemo(() => {
    if (!banks) return null;
    const practice = practicePuzzles(id, banks);
    let example = null;
    for (const puzzle of practice.slice(0, EXAMPLE_ATTEMPTS)) {
      example = findTechniqueExample(puzzle.puzzle, id);
      if (example) break;
    }
    const mastered = masteredTechniques(games, indexPuzzles(banks), [id]).has(id);
    return { practice, example, mastered };
  }, [banks, games, id]);

  if (!info) {
    return (
      <main className="flex flex-1 flex-col gap-4 px-5 pt-5">
        <ScreenHeader title="Kỹ thuật" onBack={onBack} />
        <p className="text-base font-bold">Không tìm thấy kỹ thuật này.</p>
      </main>
    );
  }

  const list = data?.practice.slice(0, MAX_PRACTICE) ?? [];
  const next = data ? (data.practice.find((p) => byId.get(p.id)?.status !== 'completed') ?? data.practice[0]) : undefined;

  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pb-8 pt-5">
      <ScreenHeader title={info.label} onBack={onBack} />

      <div className="flex items-center gap-2">
        <span className="rounded-full bg-soft px-3 py-1 text-sm font-extrabold text-accent">{info.group}</span>
        {data?.mastered && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-sm font-extrabold text-white">
            <Check size={14} strokeWidth={4} aria-hidden="true" />
            Đã thành thạo
          </span>
        )}
      </div>

      <p className="text-lg font-extrabold leading-snug">{info.summary}</p>

      <section className="card p-4" aria-label="Cách nhận biết">
        <h2 className="mb-2 text-lg font-black">Cách nhận biết</h2>
        <ol className="flex flex-col gap-2.5">
          {info.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-base font-bold leading-snug">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-white" aria-hidden="true">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-100 p-3 text-sm font-extrabold leading-snug text-amber-950 dark:bg-amber-900/40 dark:text-amber-50">
          <Lightbulb size={18} strokeWidth={2.75} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden="true" />
          {info.tip}
        </p>
      </section>

      <section aria-label="Ví dụ" className="flex flex-col gap-3">
        <h2 className="text-lg font-black">Ví dụ thật</h2>
        {failed && (
          <div role="alert" className="flex flex-col items-start gap-3">
            <p className="text-base font-bold text-accent">Không tải được dữ liệu màn chơi.</p>
            <button type="button" onClick={retry} className="btn btn-primary min-h-12 px-6">
              Thử lại
            </button>
          </div>
        )}
        {!banks && !failed && <p className="text-base font-bold text-accent">Đang tải...</p>}
        {data && !data.example && (
          <p className="text-base font-bold text-accent">Chưa có ví dụ cho kỹ thuật này trong ngân hàng màn chơi hiện tại.</p>
        )}
        {data?.example && (
          <>
            <ExampleBoard example={data.example} />
            <p className="text-base font-bold leading-snug">{data.example.step.explain}</p>
          </>
        )}
      </section>

      {data && data.practice.length > 0 && (
        <section aria-label="Luyện tập" className="flex flex-col gap-3">
          <h2 className="text-lg font-black">Luyện tập</h2>
          <div className="grid grid-cols-2 gap-3">
            {list.map((p) => {
              const done = byId.get(p.id)?.status === 'completed';
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onNavigate(`#/play/${p.id}`)}
                  aria-label={`${LEVEL_LABELS[levelFromPuzzleId(p.id)]}, màn ${p.index + 1}${done ? ', đã xong' : ''}`}
                  className={`btn min-h-14 flex-col !gap-0.5 !rounded-2xl text-base ${done ? '' : 'btn-white'}`}
                  style={done ? ({ '--btn-bg': '34 197 94', '--btn-edge': '21 128 61', '--btn-fg': '255 255 255' } as CSSProperties) : undefined}
                >
                  <span className="leading-none">Màn {p.index + 1}</span>
                  <span className="text-xs font-extrabold leading-none opacity-80">{LEVEL_LABELS[levelFromPuzzleId(p.id)]}</span>
                </button>
              );
            })}
          </div>
          {next && (
            <button
              type="button"
              onClick={() => onNavigate(`#/play/${next.id}`)}
              className="btn btn-primary cta-ring cta-shine mt-1 min-h-16 w-full text-xl"
            >
              <Play size={22} strokeWidth={0} className="fill-white" aria-hidden="true" />
              Luyện tập ngay
            </button>
          )}
        </section>
      )}
    </main>
  );
}
