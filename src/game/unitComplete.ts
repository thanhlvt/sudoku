import { UNITS_OF } from '../core/board';
import type { Grid } from '../core/types';

/**
 * Cells of every row/column/box through `idx` that are now completely and correctly filled, mapped to
 * their distance from `idx` (in cells within the unit). The UI uses it to ripple a celebration outward.
 * Returns an empty map when `idx` itself is wrong or no unit is complete yet.
 */
export function completedUnitCells(board: Grid, solution: Grid, idx: number): Map<number, number> {
  const out = new Map<number, number>();
  if (board[idx] === 0 || board[idx] !== solution[idx]) return out;

  for (const unit of UNITS_OF[idx]!) {
    if (!unit.every((cell) => board[cell] === solution[cell])) continue;
    const origin = unit.indexOf(idx);
    unit.forEach((cell, pos) => {
      const distance = Math.abs(pos - origin);
      const known = out.get(cell);
      if (known === undefined || distance < known) out.set(cell, distance);
    });
  }
  return out;
}
