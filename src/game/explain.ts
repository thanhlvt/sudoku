import type { CellRef, ExplainArg, Explanation, UnitRef } from '../core/types';
import type { MessageKey, Translate } from '../i18n';

function isUnitRef(v: object): v is UnitRef {
  return 'kind' in v;
}

function isCellRef(v: object): v is CellRef {
  return 'row' in v && 'col' in v;
}

function formatOne(v: UnitRef | CellRef, t: Translate): string {
  return isUnitRef(v) ? t(`explain.unit.${v.kind}` as MessageKey, { n: v.n }) : t('explain.cell', { row: v.row, col: v.col });
}

function formatArg(arg: ExplainArg, t: Translate): string {
  if (typeof arg === 'number') return String(arg);
  if (Array.isArray(arg)) {
    const list = arg as readonly (number | UnitRef | CellRef)[];
    // Cells carry a comma inside ("row 2, column 3"), so a list of them is separated by semicolons.
    const separator = list.length > 0 && typeof list[0] === 'object' && isCellRef(list[0]) ? '; ' : ', ';
    return list.map((item) => (typeof item === 'number' ? String(item) : formatOne(item, t))).join(separator);
  }
  return formatOne(arg as UnitRef | CellRef, t);
}

/** Subset / fish explanations name the pattern ("naked pair", "X-Wing") from its size. */
function patternName(code: Explanation['code'], size: number, t: Translate): string | null {
  if (code === 'naked-subset') return t(`explain.naked.${size}` as MessageKey);
  if (code === 'hidden-subset') return t(`explain.hidden.${size}` as MessageKey);
  if (code === 'fish') return t(`explain.fish.${size}` as MessageKey);
  return null;
}

/** The sentence that explains a solver step, in the language `t` translates to. */
export function explainText(explanation: Explanation, t: Translate): string {
  const params: Record<string, string | number> = {};
  for (const [name, arg] of Object.entries(explanation.args)) params[name] = formatArg(arg, t);
  const size = explanation.args.size;
  if (typeof size === 'number') {
    const name = patternName(explanation.code, size, t);
    if (name) params.name = name;
  }
  const text = t(`explain.${explanation.code}` as MessageKey, params);
  // Some languages start a sentence with a unit name ("row 3 has ..."), which reads better capitalised.
  return text.charAt(0).toUpperCase() + text.slice(1);
}
