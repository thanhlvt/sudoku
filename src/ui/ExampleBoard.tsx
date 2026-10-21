import type { TechniqueExample } from '../game/techniqueExample';

const NOTE_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

interface ExampleBoardProps {
  example: TechniqueExample;
}

/**
 * A read-only 9x9 that shows one real moment of a technique: the cells it involves are highlighted and show
 * their candidates, digits it removes are struck through in red, and a digit it places is green.
 */
export function ExampleBoard({ example }: ExampleBoardProps): JSX.Element {
  const { grid, candidates, step } = example;
  const involved = new Set(step.cells);
  const removed = new Map<number, Set<number>>();
  for (const { idx, digit } of step.eliminations) {
    const set = removed.get(idx) ?? new Set<number>();
    set.add(digit);
    removed.set(idx, set);
  }
  const placed = new Map(step.placements.map((p) => [p.idx, p.digit]));

  return (
    <div
      role="img"
      aria-label="Bàn ví dụ minh hoạ kỹ thuật. Ô nền vàng là các ô tham gia; số gạch đỏ là số bị loại."
      className="mx-auto w-full max-w-[22rem] select-none overflow-hidden rounded-xl border-[3px] border-board-frame bg-board-cell"
    >
      <div className="grid grid-cols-9">
        {Array.from({ length: 81 }, (_, idx) => {
          const row = Math.floor(idx / 9);
          const col = idx % 9;
          const value = grid[idx]!;
          const isInvolved = involved.has(idx) || removed.has(idx) || placed.has(idx);
          const borderRight = col === 8 ? '' : col % 3 === 2 ? 'border-r-[2px] border-r-board-frame' : 'border-r border-r-board-line';
          const borderBottom = row === 8 ? '' : row % 3 === 2 ? 'border-b-[2px] border-b-board-frame' : 'border-b border-b-board-line';
          const placedDigit = placed.get(idx);
          return (
            <div
              key={idx}
              className={`relative flex aspect-square items-center justify-center ${borderRight} ${borderBottom} ${
                isInvolved ? 'bg-board-hint' : 'bg-board-cell'
              }`}
            >
              {value !== 0 ? (
                <span className="text-[clamp(0.8rem,4.2vw,1.15rem)] font-extrabold leading-none text-ink">{value}</span>
              ) : placedDigit !== undefined ? (
                <span className="text-[clamp(0.9rem,4.6vw,1.3rem)] font-black leading-none text-emerald-600 dark:text-emerald-300">
                  {placedDigit}
                </span>
              ) : isInvolved ? (
                <span className="grid h-full w-full grid-cols-3 grid-rows-3 p-[5%] leading-none">
                  {NOTE_DIGITS.map((d) => {
                    const has = (candidates[idx]! & (1 << (d - 1))) !== 0;
                    const struck = removed.get(idx)?.has(d) ?? false;
                    return (
                      <span
                        key={d}
                        className={`flex items-center justify-center text-[clamp(0.5rem,2.9vw,0.7rem)] font-bold ${
                          struck
                            ? 'text-board-wrong-ink line-through decoration-2'
                            : 'text-ink'
                        }`}
                      >
                        {has ? d : ''}
                      </span>
                    );
                  })}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
