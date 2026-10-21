import type { Message } from '../../message';
import type { viExplain } from '../vi/explain';

export const enExplain: Record<keyof typeof viExplain, Message> = {
  'explain.unit.row': 'row {n}',
  'explain.unit.col': 'column {n}',
  'explain.unit.box': 'box {n}',
  'explain.cell': 'row {row}, column {col}',
  'explain.naked.2': 'naked pair',
  'explain.naked.3': 'naked triple',
  'explain.naked.4': 'naked quad',
  'explain.hidden.2': 'hidden pair',
  'explain.hidden.3': 'hidden triple',
  'explain.hidden.4': 'hidden quad',
  'explain.fish.2': 'X-Wing',
  'explain.fish.3': 'Swordfish',
  'explain.fish.4': 'Jellyfish',

  'explain.full-house': '{unit} has only 1 empty cell left, so that cell must be {digit}.',
  'explain.naked-single': 'Cell ({cell}) has only one digit left that can go in it: {digit}.',
  'explain.hidden-single': 'In {unit}, the digit {digit} can only go in cell ({cell}).',
  'explain.pointing':
    'In {box}, the digit {digit} can only sit in {line}, so it is removed from the other cells of {line} outside the box ({targets}).',
  'explain.claiming':
    'In {line}, the digit {digit} can only sit in {box}, so it is removed from the other cells of {box} ({targets}).',
  'explain.naked-subset':
    'In {unit}, {size} cells ({cells}) can only hold the digits {{digits}}: a {name}, so those digits are removed from the other cells of {unit}.',
  'explain.hidden-subset':
    'In {unit}, the digits {{digits}} can only go in {size} cells ({cells}): a {name}, so every other digit is removed from those cells.',
  'explain.fish':
    '{name}: the digit {digit} in {bases} sits in exactly {size} shared columns/rows, so it is removed from the other cells of those columns/rows ({targets}).',
  'explain.skyscraper':
    'Skyscraper on {digit}: {unitA} and {unitB} each have only 2 spots for it, lined up in one column/row at ({anchor}), so {digit} is removed from cell ({target}).',
  'explain.coloring-clash':
    'Coloring chain for {digit}: the two same-colored cells ({cellA}) and ({cellB}) see each other, so that color is wrong; remove {digit} from {targets}.',
  'explain.coloring-both':
    'Coloring chain for {digit}: cell ({cell}) sees both colors of the chain, so {digit} is removed from that cell.',
  'explain.unique-rectangle':
    'The rectangle {corners} has 3 corners holding only {{digits}}; if the last corner ({odd}) held only those two digits too, the puzzle would have 2 solutions, so those digits are removed from cell ({odd}).',
  'explain.w-wing':
    'W-Wing between ({cellA}) and ({cellB}) (both {{x}, {y}}), joined by a strong link on {y}: {x} is removed from {targets}.',
  'explain.xy-wing':
    'XY-Wing around the pivot ({pivot}) ({digits}) and the two wings ({claw1}), ({claw2}): {z} is removed from {targets}.',
  'explain.xyz-wing':
    'XYZ-Wing around the pivot ({pivot}) ({digits}) and the two wings ({claw1}), ({claw2}): {z} is removed from {targets}.',

  'reminder.generic.1.title': 'Today’s challenge is waiting',
  'reminder.generic.1.body': 'A fresh Sudoku, solved by logic, in just a few minutes.',
  'reminder.generic.2.title': 'Time for a brain workout',
  'reminder.generic.2.body': 'Finish the daily challenge to unlock new achievements.',
  'reminder.generic.3.title': 'Fancy a Sudoku?',
  'reminder.generic.3.body': 'Today’s challenge is ready.',
  'reminder.waiting.title': 'Your {streak}-day streak is waiting',
  'reminder.waiting.body': 'Play today’s challenge to stretch it to {next} days.',
  'reminder.keep.title': 'Keep your {streak}-day streak!',
  'reminder.keep.body': 'Play today’s challenge to make it {next} days.',

  'share.title': 'Sudoku',
  'share.dailyTitle': 'Sudoku · Challenge {date}',
  'share.level': '{level} · Puzzle {n} {stars}',
  'share.mistakes': { one: '{count} mistake', other: '{count} mistakes' },
  'share.hints': { one: '{count} hint', other: '{count} hints' },
  'share.streak': { one: '{count}-day streak', other: '{count}-day streak' },
};
