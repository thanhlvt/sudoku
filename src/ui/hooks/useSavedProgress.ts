import { useEffect, useMemo, useState } from 'react';
import { listGames, loadLast, type LastPlayed, type SavedGame } from '../../storage/schema';

export interface SavedProgress {
  games: SavedGame[];
  byId: ReadonlyMap<string, SavedGame>;
  last: LastPlayed | null;
}

function read(): { games: SavedGame[]; last: LastPlayed | null } {
  return { games: listGames(), last: loadLast() };
}

/**
 * Saved games + "last played" for the home / level screens.
 *
 * The play screen flushes its final debounced save while it unmounts, which is *after* the next
 * screen's first render, so a one-off read in render can miss the last few moves. Re-reading in an
 * effect runs after that flush and corrects it.
 */
export function useSavedProgress(): SavedProgress {
  const [data, setData] = useState(read);
  useEffect(() => setData(read()), []);
  const byId = useMemo(() => new Map(data.games.map((g) => [g.puzzleId, g])), [data.games]);
  return { games: data.games, byId, last: data.last };
}
