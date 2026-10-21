import { useMemo } from 'react';
import { mulberry32 } from '../core/rng';

const COLORS = ['#F43F5E', '#F97316', '#22C55E', '#EC4899', '#0EA5E9', '#FACC15', '#A78BFA'];

interface Piece {
  left: number;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
  w: number;
  h: number;
  round: boolean;
  color: string;
}

/** Decorative falling confetti. Pure CSS animation; hidden entirely under prefers-reduced-motion. */
export function Confetti({ count = 44 }: { count?: number }): JSX.Element {
  const pieces = useMemo<Piece[]>(() => {
    const rand = mulberry32(2024);
    return Array.from({ length: count }, (_, i) => {
      const round = rand() < 0.3;
      const w = 7 + rand() * 9;
      return {
        left: rand() * 100,
        delay: rand() * 2.4,
        duration: 3.2 + rand() * 2.4,
        drift: (rand() - 0.5) * 140,
        spin: 360 + rand() * 720,
        w,
        h: round ? w : w * (1.4 + rand()),
        round,
        color: COLORS[i % COLORS.length]!,
      };
    });
  }, [count]);

  return (
    <div className="confetti pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="animate-confetti-fall absolute top-0 block"
          style={
            {
              left: `${p.left}%`,
              width: p.w,
              height: p.h,
              backgroundColor: p.color,
              borderRadius: p.round ? '9999px' : 3,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              '--drift': `${p.drift}px`,
              '--spin': `${p.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
