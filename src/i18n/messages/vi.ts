import { viAchievements } from './vi/achievements';
import { viCommon } from './vi/common';
import { viExplain } from './vi/explain';
import { viHome } from './vi/home';
import { viIntro } from './vi/intro';
import { viPlay } from './vi/play';
import { viScreens } from './vi/screens';
import { viSettings } from './vi/settings';
import { viTechniques } from './vi/techniques';

/** Vietnamese: the source catalog. Its keys define `MessageKey`; `en.ts` must have exactly the same ones. */
export const vi = {
  ...viCommon,
  ...viHome,
  ...viSettings,
  ...viIntro,
  ...viPlay,
  ...viScreens,
  ...viTechniques,
  ...viAchievements,
  ...viExplain,
};

export type MessageKey = keyof typeof vi;
