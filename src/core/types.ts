export type Grid = Uint8Array; // 81, 0 = empty
export type Candidates = Uint16Array; // 81, bitmask 9 bit (bit 0 = digit 1)
export type Level = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';
export type Unit = readonly number[]; // 9 index
export type Symmetry = 'rotational-180' | 'mirror-vertical' | 'none';

export interface Step {
  technique: string;
  cost: number;
  placements: { idx: number; digit: number }[];
  eliminations: { idx: number; digit: number }[];
  cells: number[];
  explain: string;
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
