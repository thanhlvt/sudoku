import { claiming } from './claiming';
import { fullHouse } from './fullHouse';
import { hiddenPair } from './hiddenPair';
import { hiddenQuad } from './hiddenQuad';
import { hiddenSingleBox } from './hiddenSingleBox';
import { hiddenSingleLine } from './hiddenSingleLine';
import { hiddenTriple } from './hiddenTriple';
import { jellyfish } from './jellyfish';
import { nakedPair } from './nakedPair';
import { nakedQuad } from './nakedQuad';
import { nakedSingle } from './nakedSingle';
import { nakedTriple } from './nakedTriple';
import { pointing } from './pointing';
import { simpleColoring } from './simpleColoring';
import { skyscraper } from './skyscraper';
import { swordfish } from './swordfish';
import { uniqueRectangle1 } from './uniqueRectangle1';
import { wWing } from './wWing';
import { xWing } from './xWing';
import { xyWing } from './xyWing';
import { xyzWing } from './xyzWing';
import type { Technique } from '../types';

export const TECHNIQUE_ORDER: readonly Technique[] = [
  fullHouse,
  nakedSingle,
  hiddenSingleBox,
  hiddenSingleLine,
  pointing,
  claiming,
  nakedPair,
  hiddenPair,
  nakedTriple,
  hiddenTriple,
  xWing,
  nakedQuad,
  hiddenQuad,
  skyscraper,
  swordfish,
  xyWing,
  xyzWing,
  wWing,
  simpleColoring,
  uniqueRectangle1,
  jellyfish,
];

export {
  claiming,
  fullHouse,
  hiddenPair,
  hiddenQuad,
  hiddenSingleBox,
  hiddenSingleLine,
  hiddenTriple,
  jellyfish,
  nakedPair,
  nakedQuad,
  nakedSingle,
  nakedTriple,
  pointing,
  simpleColoring,
  skyscraper,
  swordfish,
  uniqueRectangle1,
  wWing,
  xWing,
  xyWing,
  xyzWing,
};
