import type { Message } from '../../message';
import type { viIntro } from '../vi/intro';

export const enIntro: Record<keyof typeof viIntro, Message> = {
  'intro.title': 'How to play',
  'intro.pagesAria': 'Tutorial pages',
  'intro.page': 'Page {n}',
  'intro.skip': 'Skip',
  'intro.back': 'Back',
  'intro.next': 'Next',
  'intro.start': 'Start playing',
  'intro.rules.title': 'The rules',
  'intro.rules.body': 'Fill the grid with the digits 1 to 9 so every row, every column and every 3×3 box contains all nine digits, with no repeats.',
  'intro.rules.detail': 'Tap a cell, then tap a digit on the pad below. Wrong digits turn red.',
  'intro.notes.title': 'Notes',
  'intro.notes.body': 'Turn on “Notes” to jot down the digits a cell could be. Notes help you spot when only one possibility is left.',
  'intro.notes.detail': 'Press and hold a digit for a quick note. “Fill all” pencils in every possibility for you.',
  'intro.logic.title': 'No guessing',
  'intro.logic.body': 'Every puzzle can be solved by pure logic, never by trial and error.',
  'intro.logic.detail': 'Stuck? Tap “Hint”: the first press explains the technique to use, the second fills the digit in.',
  'intro.daily.title': 'Come back every day',
  'intro.daily.body': 'There’s a new challenge each day. Finish them back to back to grow your streak and unlock achievements and new board colors.',
  'intro.daily.detail': 'Want to get better? Open “Learn” to see each technique with a real example.',
};
