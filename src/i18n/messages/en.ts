import type { Message } from '../message';
import { enAchievements } from './en/achievements';
import { enCommon } from './en/common';
import { enExplain } from './en/explain';
import { enHome } from './en/home';
import { enIntro } from './en/intro';
import { enPlay } from './en/play';
import { enScreens } from './en/screens';
import { enSettings } from './en/settings';
import { enTechniques } from './en/techniques';
import type { MessageKey } from './vi';

export const en: Record<MessageKey, Message> = {
  ...enCommon,
  ...enHome,
  ...enSettings,
  ...enIntro,
  ...enPlay,
  ...enScreens,
  ...enTechniques,
  ...enAchievements,
  ...enExplain,
};
