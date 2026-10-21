import { Heart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { MAX_HEARTS, heartsLeft } from '../game/progress';
import { useI18n } from '../i18n/useI18n';

interface HeartsProps {
  mistakes: number;
}

export function Hearts({ mistakes }: HeartsProps): JSX.Element {
  const { t } = useI18n();
  const left = heartsLeft(mistakes);
  const prevMistakes = useRef(mistakes);
  const [lostIdx, setLostIdx] = useState<number | null>(null);

  // Play the "break" animation on the heart that has just emptied (never on first render).
  useEffect(() => {
    const increased = mistakes > prevMistakes.current;
    prevMistakes.current = mistakes;
    if (!increased || mistakes > MAX_HEARTS) return;
    setLostIdx(MAX_HEARTS - mistakes);
    const timer = window.setTimeout(() => setLostIdx(null), 700);
    return () => window.clearTimeout(timer);
  }, [mistakes]);

  return (
    <div className="flex gap-1.5" role="img" aria-label={t('hearts.aria', { left, max: MAX_HEARTS })}>
      {Array.from({ length: MAX_HEARTS }, (_, i) => (
        <Heart
          key={i}
          size={32}
          strokeWidth={2.5}
          aria-hidden="true"
          className={`transition-colors duration-300 ${
            i < left ? 'fill-rose-500 text-rose-600' : 'fill-transparent text-accent/35'
          } ${lostIdx === i ? 'animate-heart-lost' : ''}`}
        />
      ))}
    </div>
  );
}
