import { useCallback, useEffect, useState } from 'react';
import type { Level } from '../../core/types';

export type Route = { name: 'home' } | { name: 'level'; level: Level } | { name: 'play'; puzzleId: string };

const LEVELS: readonly Level[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];

function isLevel(s: string): s is Level {
  return (LEVELS as readonly string[]).includes(s);
}

function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '');
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return { name: 'home' };
  if (parts[0] === 'level' && parts[1] && isLevel(parts[1])) {
    return { name: 'level', level: parts[1] };
  }
  if (parts[0] === 'play' && parts[1]) {
    return { name: 'play', puzzleId: parts[1] };
  }
  return { name: 'home' };
}

export function useHashRoute(): [Route, (hash: string) => void] {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = (): void => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((hash: string) => {
    window.location.hash = hash;
  }, []);

  return [route, navigate];
}
