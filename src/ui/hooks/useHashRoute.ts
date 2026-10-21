import { useCallback, useEffect, useState } from 'react';
import { isLevel, isPuzzleId } from '../../core/levels';
import type { Level } from '../../core/types';
import { isTechniqueId } from '../../game/techniqueInfo';

export type Route =
  | { name: 'home' }
  | { name: 'level'; level: Level }
  | { name: 'play'; puzzleId: string }
  | { name: 'achievements' }
  | { name: 'calendar' }
  | { name: 'stats' }
  | { name: 'learn' }
  | { name: 'technique'; id: string };

/** The hash is attacker-controllable (anyone can send a link), so only well-formed targets become routes. */
export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '');
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return { name: 'home' };
  if (parts[0] === 'level' && isLevel(parts[1])) {
    return { name: 'level', level: parts[1] };
  }
  if (parts[0] === 'play' && isPuzzleId(parts[1])) {
    return { name: 'play', puzzleId: parts[1] };
  }
  if (parts.length === 1) {
    if (parts[0] === 'achievements') return { name: 'achievements' };
    if (parts[0] === 'calendar') return { name: 'calendar' };
    if (parts[0] === 'stats') return { name: 'stats' };
    if (parts[0] === 'learn') return { name: 'learn' };
  }
  if (parts[0] === 'learn' && isTechniqueId(parts[1])) {
    return { name: 'technique', id: parts[1] };
  }
  return { name: 'home' };
}

export function useHashRoute(): [Route, (hash: string, replace?: boolean) => void] {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = (): void => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  /** `replace` swaps the current history entry (used for "up"/"next" moves so Back doesn't revisit them). */
  const navigate = useCallback((hash: string, replace = false) => {
    if (replace) {
      window.location.replace(hash);
    } else {
      window.location.hash = hash;
    }
  }, []);

  return [route, navigate];
}
