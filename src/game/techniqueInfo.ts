import type { MessageKey, Translate } from '../i18n';

/** Which family a technique is listed under; the group names live in the message catalogs. */
export type TechniqueGroup = 'singles' | 'locked' | 'subsets' | 'fish' | 'wings' | 'chains' | 'unique';

/**
 * The techniques the game teaches, in the order they are listed. `id` is the technique's `name` in the solver, which
 * is also what `PuzzleRecord.rating` refers to. Their names and lessons are in the catalogs (`tech.<id>.*`).
 */
export const TECHNIQUES: readonly { id: string; group: TechniqueGroup }[] = [
  { id: 'full-house', group: 'singles' },
  { id: 'naked-single', group: 'singles' },
  { id: 'hidden-single-box', group: 'singles' },
  { id: 'hidden-single-line', group: 'singles' },
  { id: 'pointing', group: 'locked' },
  { id: 'claiming', group: 'locked' },
  { id: 'naked-pair', group: 'subsets' },
  { id: 'hidden-pair', group: 'subsets' },
  { id: 'naked-triple', group: 'subsets' },
  { id: 'hidden-triple', group: 'subsets' },
  { id: 'x-wing', group: 'fish' },
  { id: 'naked-quad', group: 'subsets' },
  { id: 'hidden-quad', group: 'subsets' },
  { id: 'skyscraper', group: 'chains' },
  { id: 'swordfish', group: 'fish' },
  { id: 'xy-wing', group: 'wings' },
  { id: 'xyz-wing', group: 'wings' },
  { id: 'w-wing', group: 'wings' },
  { id: 'simple-coloring', group: 'chains' },
  { id: 'unique-rectangle-1', group: 'unique' },
  { id: 'jellyfish', group: 'fish' },
];

const BY_ID = new Map(TECHNIQUES.map((t) => [t.id, t]));

/** Player-facing names and lessons for a technique, in the language `t` translates to. */
export interface TechniqueInfo {
  id: string;
  label: string;
  group: string;
  /** One sentence: what the technique lets you conclude. */
  summary: string;
  /** How to spot it, step by step. */
  steps: readonly string[];
  /** A short rule of thumb. */
  tip: string;
}

// The keys are built from ids; `tests` in techniqueInfo.test.ts check that every one exists in every catalog.
const key = (id: string, part: string): MessageKey => `tech.${id}.${part}` as MessageKey;

export function techniqueInfo(id: string, t: Translate): TechniqueInfo | undefined {
  const def = BY_ID.get(id);
  if (!def) return undefined;
  return {
    id,
    label: t(key(id, 'label')),
    group: t(`tech.group.${def.group}` as MessageKey),
    summary: t(key(id, 'summary')),
    steps: t(key(id, 'steps')).split('\n'),
    tip: t(key(id, 'tip')),
  };
}

/** Display name; an unknown id is shown as it is so a newer bank never breaks the screen. */
export function techniqueLabel(id: string, t: Translate): string {
  return BY_ID.has(id) ? t(key(id, 'label')) : id;
}

export function isTechniqueId(id: unknown): id is string {
  return typeof id === 'string' && BY_ID.has(id);
}
