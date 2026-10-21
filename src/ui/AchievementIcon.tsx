import { Calendar, Crown, Flame, Medal, Star, Target, Trophy, Zap, type LucideIcon } from 'lucide-react';
import type { AchievementIcon as IconName } from '../game/achievements';

const ICONS: Record<IconName, LucideIcon> = {
  trophy: Trophy,
  flame: Flame,
  zap: Zap,
  star: Star,
  target: Target,
  crown: Crown,
  medal: Medal,
  calendar: Calendar,
};

interface AchievementIconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function AchievementIcon({ name, size = 24, className = '' }: AchievementIconProps): JSX.Element {
  const Icon = ICONS[name];
  return <Icon size={size} strokeWidth={2.75} aria-hidden="true" className={className} />;
}
