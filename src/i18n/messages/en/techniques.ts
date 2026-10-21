import type { Message } from '../../message';
import type { viTechniques } from '../vi/techniques';

export const enTechniques: Record<keyof typeof viTechniques, Message> = {
  'tech.group.singles': 'Singles',
  'tech.group.locked': 'Locked candidates',
  'tech.group.subsets': 'Subsets',
  'tech.group.fish': 'Fish',
  'tech.group.wings': 'Wings',
  'tech.group.chains': 'Single-digit chains',
  'tech.group.unique': 'Uniqueness',

  'tech.full-house.label': 'Full House',
  'tech.full-house.summary': 'When a row, column or box has exactly one empty cell left, the missing digit must go there.',
  'tech.full-house.steps':
    'Find a row, column or box with 8 cells filled.\nLook at the 8 digits already there: which of 1–9 is missing?\nPlace that digit in the last empty cell.',
  'tech.full-house.tip': 'Sweep the nearly full rows, columns and boxes first, before looking for fancier techniques.',

  'tech.naked-single.label': 'Naked Single',
  'tech.naked-single.summary': 'A cell where every other digit is already taken by its row, column or box has only one digit left.',
  'tech.naked-single.steps':
    'Pick an empty cell.\nCross out the digits already in its row, column and box.\nIf exactly one digit remains, place it.',
  'tech.naked-single.tip': 'Turn on notes and fill in any cell that is down to a single note right away.',

  'tech.hidden-single-box.label': 'Hidden Single in a box',
  'tech.hidden-single-box.summary': 'If a digit can go in only one cell of a 3×3 box, it must go in that cell.',
  'tech.hidden-single-box.steps':
    'Pick a box and a digit it doesn’t have yet.\nUse the same digit in neighboring rows and columns to rule out cells.\nIf only one cell is left, place the digit there.',
  'tech.hidden-single-box.tip': 'Tap a digit on the pad to highlight every cell holding it, then look for boxes with only one spot left.',

  'tech.hidden-single-line.label': 'Hidden Single in a row/column',
  'tech.hidden-single-line.summary': 'If a digit can go in only one cell of a row or column, it must go in that cell.',
  'tech.hidden-single-line.steps':
    'Pick a row (or column) and a digit it still lacks.\nRule out the cells blocked by a box or a crossing column/row.\nIf only one cell is left, place the digit there.',
  'tech.hidden-single-line.tip': 'Harder to spot than a box single because you have to look across three boxes.',

  'tech.pointing.label': 'Pointing',
  'tech.pointing.summary': 'If, inside a box, a digit can only sit on one row (or column), it is removed from the rest of that row (column) outside the box.',
  'tech.pointing.steps':
    'Pick a box and a digit not yet placed.\nLook at the cells in the box that can still take it: are they in a line?\nIf so, remove the digit from the other cells on that line outside the box.',
  'tech.pointing.tip': 'The box “points” out of itself: the digit is sure to be on that line, so nowhere else on the line can hold it.',

  'tech.claiming.label': 'Claiming',
  'tech.claiming.summary': 'If, in a row (or column), a digit can only sit inside one box, it is removed from the other cells of that box.',
  'tech.claiming.steps':
    'Pick a row/column and a digit not yet placed.\nLook at the cells that can still take it: are they all in the same box?\nIf so, remove the digit from the cells of that box outside this row/column.',
  'tech.claiming.tip': 'The reverse of Pointing: the line “claims” the digit’s place inside the box.',

  'tech.naked-pair.label': 'Naked Pair',
  'tech.naked-pair.summary': 'Two cells in the same row/column/box that hold the same two candidates remove those digits from the rest of the unit.',
  'tech.naked-pair.steps':
    'Find two cells in one unit, each with exactly two identical notes (say 3 and 7).\nThose two digits must be split between the two cells.\nErase 3 and 7 from every other cell in the unit.',
  'tech.naked-pair.tip': 'You need complete notes; the “Fill all” button gives you enough to search.',

  'tech.hidden-pair.label': 'Hidden Pair',
  'tech.hidden-pair.summary': 'If two digits appear in only the same two cells of a unit, those two cells can hold only those two digits.',
  'tech.hidden-pair.steps':
    'In a unit, find two digits whose possible spots are the same two cells.\nThose cells belong to those two digits.\nErase every other note from the two cells.',
  'tech.hidden-pair.tip': 'Hidden pairs are hard to see because the two cells are cluttered with other notes.',

  'tech.naked-triple.label': 'Naked Triple',
  'tech.naked-triple.summary': 'Three cells in a unit whose notes together contain only three digits remove those digits from the other cells of the unit.',
  'tech.naked-triple.steps':
    'Find three cells in one unit whose combined notes are just 3 digits (say {1,2}, {2,3}, {1,3}).\nThose three digits are used up by those three cells.\nErase them from every other cell in the unit.',
  'tech.naked-triple.tip': 'Each cell doesn’t need all three digits; only the combined set has to be exactly three.',

  'tech.hidden-triple.label': 'Hidden Triple',
  'tech.hidden-triple.summary': 'If three digits appear in only the same three cells of a unit, those three cells can hold only those three digits.',
  'tech.hidden-triple.steps':
    'In a unit, find three digits whose possible spots lie in the same three cells.\nThose cells belong to those three digits.\nErase every other note from the three cells.',
  'tech.hidden-triple.tip': 'Rare; it usually shows up only after you have used up the easier techniques.',

  'tech.x-wing.label': 'X-Wing',
  'tech.x-wing.summary': 'If a digit can go in only two columns in each of two rows (the same two columns), it is removed from those columns in all other rows.',
  'tech.x-wing.steps':
    'Pick a digit. Find two rows where it has exactly two possible spots.\nBoth rows’ spots sit in the same two columns, forming a rectangle.\nThe digit must take two diagonal corners, so erase it from those two columns in every other row.',
  'tech.x-wing.tip': 'It works the other way around too (two columns, eliminating from rows).',

  'tech.naked-quad.label': 'Naked Quad',
  'tech.naked-quad.summary': 'Four cells in a unit whose notes together contain only four digits remove those digits from the other cells of the unit.',
  'tech.naked-quad.steps':
    'Find four cells in one unit whose combined notes are exactly 4 digits.\nThose four digits are used up by those four cells.\nErase them from the remaining cells of the unit.',
  'tech.naked-quad.tip': 'Very rare; when a naked quad exists, the rest of the unit forms a hidden quad.',

  'tech.hidden-quad.label': 'Hidden Quad',
  'tech.hidden-quad.summary': 'If four digits appear in only the same four cells of a unit, those four cells can hold only those four digits.',
  'tech.hidden-quad.steps':
    'Find four digits whose possible spots lie in the same four cells of the unit.\nErase every other note from those four cells.',
  'tech.hidden-quad.tip': 'It is often easier to look for the naked quad in the rest of the unit.',

  'tech.skyscraper.label': 'Skyscraper',
  'tech.skyscraper.summary': 'Two rows that each have only two spots for a digit, sharing exactly one column, mean any cell seeing both free ends cannot hold that digit.',
  'tech.skyscraper.steps':
    'Pick a digit. Find two rows that each have exactly two possible cells for it.\nThe rows share one column (the two “base” cells line up); the other two cells are the “tops”.\nOne of the tops must hold the digit, so erase it from any cell that sees both tops.',
  'tech.skyscraper.tip': 'Picture two towers on the same ground floor, with the two rooftops as the tops.',

  'tech.swordfish.label': 'Swordfish',
  'tech.swordfish.summary': 'X-Wing extended to three rows and three columns: the digit is removed from those three columns in the other rows.',
  'tech.swordfish.steps':
    'Pick a digit. Find three rows where it has only 2–3 possible spots each.\nAll those spots lie within exactly three columns.\nErase the digit from those three columns in every other row.',
  'tech.swordfish.tip': 'Each row doesn’t need to use all three columns.',

  'tech.xy-wing.label': 'XY-Wing',
  'tech.xy-wing.summary': 'A pivot cell {X,Y} and two wing cells {X,Z} and {Y,Z} that see the pivot: any cell seeing both wings cannot be Z.',
  'tech.xy-wing.steps':
    'Find a pivot with exactly two notes, say {1,2}.\nFind two wings that see the pivot: one {1,3} and one {2,3}.\nWhether the pivot is 1 or 2, one wing becomes 3, so erase 3 from cells that see both wings.',
  'tech.xy-wing.tip': 'It only uses cells with exactly two notes, which are easy to find on a fully noted board.',

  'tech.xyz-wing.label': 'XYZ-Wing',
  'tech.xyz-wing.summary': 'A pivot {X,Y,Z} with two wings {X,Z} and {Y,Z}: any cell seeing all three cells cannot be Z.',
  'tech.xyz-wing.steps':
    'Find a pivot with three notes, say {1,2,3}.\nFind two wings that see the pivot: {1,3} and {2,3}.\nThe 3 must be in one of the three cells, so erase 3 from any cell that sees all three.',
  'tech.xyz-wing.tip': 'Unlike XY-Wing, the target cell also has to see the pivot.',

  'tech.w-wing.label': 'W-Wing',
  'tech.w-wing.summary': 'Two cells with the same notes {X,Y} that don’t see each other, joined by a strong link on Y: any cell seeing both cannot be X.',
  'tech.w-wing.steps':
    'Find two cells with the same notes {X,Y} that don’t share a unit.\nFind a unit where Y has only two spots, each seeing one of the two cells.\nErase X from cells that see both {X,Y} cells.',
  'tech.w-wing.tip': 'A strong link is a unit where the digit has exactly two possible spots.',

  'tech.simple-coloring.label': 'Simple Coloring',
  'tech.simple-coloring.summary': 'Color a digit’s strong-link chain with two alternating colors: a color that leads to a contradiction is removed from every cell of that color.',
  'tech.simple-coloring.steps':
    'Pick a digit and join the pairs of cells that are its only two spots in a unit.\nColor the chain’s cells alternately A and B (one color is right, the other wrong).\nIf two same-colored cells see each other, or an outside cell sees both colors, erase the digit there.',
  'tech.simple-coloring.tip': 'On paper, use two different pens or marks to keep track.',

  'tech.unique-rectangle-1.label': 'Unique Rectangle',
  'tech.unique-rectangle-1.summary': 'Four cells forming a rectangle across two boxes, three of them holding only {X,Y}: the fourth cannot be X or Y, or the puzzle would have two solutions.',
  'tech.unique-rectangle-1.steps':
    'Find four cells in two rows and two columns that sit in exactly two boxes.\nThree cells have only {X,Y}; the last one has extra digits.\nErase X and Y from the fourth cell (otherwise swapping X↔Y would give a second solution).',
  'tech.unique-rectangle-1.tip': 'It relies on the puzzle having a unique solution, which is always true here.',

  'tech.jellyfish.label': 'Jellyfish',
  'tech.jellyfish.summary': 'X-Wing extended to four rows and four columns.',
  'tech.jellyfish.steps':
    'Pick a digit. Find four rows where it lies only within the same four columns.\nErase the digit from those four columns in every other row.',
  'tech.jellyfish.tip': 'You will rarely need it.',
};
