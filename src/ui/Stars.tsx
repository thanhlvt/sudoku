import { Star } from 'lucide-react';

interface StarsProps {
  count: number;
  total?: number;
  size?: number;
  /** Colour classes for earned / missing stars. */
  filledClass?: string;
  emptyClass?: string;
  /** Pop the stars in one after another (completion screen). */
  animated?: boolean;
  className?: string;
}

export function Stars({
  count,
  total = 3,
  size = 14,
  filledClass = 'fill-amber-400 text-amber-500',
  emptyClass = 'fill-transparent text-amber-500/60',
  animated = false,
  className = '',
}: StarsProps): JSX.Element {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`${count} trên ${total} sao`}>
      {Array.from({ length: total }, (_, i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={2.5}
          aria-hidden="true"
          className={`${i < count ? filledClass : emptyClass} ${animated ? 'animate-star-pop' : ''}`}
          style={animated ? { animationDelay: `${0.5 + i * 0.22}s` } : undefined}
        />
      ))}
    </span>
  );
}
