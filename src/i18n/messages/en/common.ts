import type { Message } from '../../message';
import type { viCommon } from '../vi/common';

export const enCommon: Record<keyof typeof viCommon, Message> = {
  'common.back': 'Back',
  'common.close': 'Close',
  'common.retry': 'Try again',
  'common.loading': 'Loading...',
  'common.play': 'Play',
  'common.dataLoadFailed': 'Couldn’t load the puzzle data.',
  'common.puzzleNumber': 'Puzzle {n}',
  'common.levelPuzzle': '{level} · Puzzle {n}',
  'common.starsOf': '{count} of {total} stars',
  'common.done': 'done',
  'common.notDone': 'not played',

  'level.beginner': 'Beginner',
  'level.easy': 'Easy',
  'level.medium': 'Medium',
  'level.hard': 'Hard',
  'level.expert': 'Expert',

  'hearts.aria': '{left} of {max} hearts left',
  'timer.remaining': '{time} left',
  'timer.elapsed': 'Time {time}',
  'timer.paused': '{label}, paused',

  'storage.memoryOnly': 'Your browser won’t let the game save data, so progress will be lost when you close the page.',
  'storage.writeFailed': 'Storage is full, so new progress isn’t being saved. Free up some space and keep playing.',

  'confirm.clearAll': 'Delete all progress, stars, stats and streaks? This can’t be undone.',
  'error.title': 'Something went wrong',
  'error.body':
    'The app ran into an unexpected problem. Try reloading. If it keeps happening, your saved data may be corrupted; you can delete it and start over.',
  'error.reload': 'Reload',
  'error.clearReload': 'Delete data and reload',

  'board.aria': 'Sudoku board',
  'board.cell.empty': 'Row {row}, column {col}, empty',
  'board.cell.filled': 'Row {row}, column {col}, {value}',
  'board.cell.given': 'Row {row}, column {col}, {value}, given',
  'board.cell.wrong': 'Row {row}, column {col}, {value}, wrong',
  'pad.aria': 'Number pad',
  'pad.digit': 'Digit {digit}, {left} left',
  'pad.digitNote': 'Digit {digit}, notes mode, {left} left',
  'example.aria': 'Example board illustrating the technique. Yellow cells are the ones involved; red struck-through digits are removed.',

  'print.title': 'Sudoku — {level}',
  'print.meta': 'Puzzle {n} · ID: {id}',
  'print.solution': 'Solution — {id}',

  'player.levelShort': 'Lv',
  'player.xpAria': 'Level {level}, {into} of {span} XP',
  'player.title.1': 'Rookie',
  'player.title.5': 'Mind Trainer',
  'player.title.10': 'Expert',
  'player.title.15': 'Grandmaster',
  'player.title.20': 'Legend',

  'palette.violet': 'Violet',
  'palette.ocean': 'Ocean',
  'palette.forest': 'Forest',
  'palette.sunset': 'Sunset',
};
