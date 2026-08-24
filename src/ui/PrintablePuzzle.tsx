import type { Level } from '../core/types';
import { LEVEL_LABELS } from './levelLabels';

interface PrintablePuzzleProps {
  puzzleId: string;
  level: Level;
  puzzleNumber: number;
  givens: string;
  solution?: string;
}

export function PrintablePuzzle({
  puzzleId,
  level,
  puzzleNumber,
  givens,
  solution,
}: PrintablePuzzleProps): JSX.Element {
  return (
    <div className="print-area hidden print:block">
      <h1 className="mb-1 text-2xl font-bold text-black">Sudoku — {LEVEL_LABELS[level]}</h1>
      <p className="mb-6 text-sm text-black">
        Màn số {puzzleNumber} · Mã: {puzzleId}
      </p>
      <PrintGrid cells={givens} />
      {solution && (
        <div className="mt-10" style={{ pageBreakBefore: 'always' }}>
          <h2 className="mb-4 mt-8 text-lg font-semibold text-black">Đáp án — {puzzleId}</h2>
          <PrintGrid cells={solution} compact />
        </div>
      )}
    </div>
  );
}

function PrintGrid({ cells, compact }: { cells: string; compact?: boolean }): JSX.Element {
  const sizeMm = compact ? 90 : 150;
  return (
    <div
      className="grid grid-cols-9 grid-rows-9 border-2 border-black"
      style={{ width: `${sizeMm}mm`, height: `${sizeMm}mm` }}
    >
      {Array.from({ length: 81 }, (_, idx) => {
        const ch = cells[idx];
        const row = Math.floor(idx / 9) + 1;
        const col = (idx % 9) + 1;
        return (
          <div
            key={idx}
            className="flex items-center justify-center font-medium text-black"
            style={{
              fontSize: compact ? '3mm' : '5mm',
              borderRight: col % 3 === 0 && col !== 9 ? '0.6mm solid black' : '0.15mm solid #555',
              borderBottom: row % 3 === 0 && row !== 9 ? '0.6mm solid black' : '0.15mm solid #555',
            }}
          >
            {ch !== '.' && ch !== '0' ? ch : ''}
          </div>
        );
      })}
    </div>
  );
}
