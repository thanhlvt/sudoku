export type Grid = Uint8Array; // 81, 0 = empty
export type Candidates = Uint16Array; // 81, bitmask 9 bit (bit 0 = digit 1)
export type Level = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';
export type Unit = readonly number[]; // 9 index
export type Symmetry = 'rotational-180' | 'mirror-vertical' | 'none';

/** A row, column or box, numbered from 1 the way the player sees them. */
export interface UnitRef {
  kind: 'row' | 'col' | 'box';
  n: number;
}

/** A cell, 1-based row and column. */
export interface CellRef {
  row: number;
  col: number;
}

/** Which sentence a step's explanation is. The wording lives in the UI layer (src/game/explain.ts), per language. */
export type ExplainCode =
  | 'full-house'
  | 'naked-single'
  | 'hidden-single'
  | 'pointing'
  | 'claiming'
  | 'naked-subset'
  | 'hidden-subset'
  | 'fish'
  | 'skyscraper'
  | 'coloring-clash'
  | 'coloring-both'
  | 'unique-rectangle'
  | 'w-wing'
  | 'xy-wing'
  | 'xyz-wing';

export type ExplainArg = number | UnitRef | CellRef | readonly number[] | readonly UnitRef[] | readonly CellRef[];

/** Why a step is valid, as data: the core stays free of any natural language. */
export interface Explanation {
  code: ExplainCode;
  args: Readonly<Record<string, ExplainArg>>;
}

export interface Step {
  technique: string;
  cost: number;
  placements: { idx: number; digit: number }[];
  eliminations: { idx: number; digit: number }[];
  cells: number[];
  explain: Explanation;
}

export interface Technique {
  name: string;
  cost: number;
  find(grid: Readonly<Grid>, cands: Readonly<Candidates>): Step | null;
}

export interface Rating {
  solved: boolean;
  maxCost: number;
  score: number;
  hardest: string | null;
  counts: Record<string, number>;
  level: Level | null;
}

export interface PuzzleRecord {
  id: string;
  index: number;
  puzzle: string;
  solution: string;
  givens: number;
  symmetry: Symmetry;
  seed: number;
  rating: {
    maxCost: number;
    score: number;
    hardest: string;
    counts: Record<string, number>;
  };
}

export interface LevelBank {
  schemaVersion: number;
  generatorVersion: number;
  level: Level;
  count: number;
  puzzles: PuzzleRecord[];
}

export interface Manifest {
  schemaVersion: number;
  generatorVersion: number;
  levels: { level: Level; count: number; file: string }[];
}
