import { useCallback, useRef, useState } from 'react';
import { getStorageHealth } from '../../storage/storage';

/**
 * State that mirrors one localStorage record.
 *
 * Every update starts from what is *stored*, not from this tab's copy: with two tabs open, the tab that
 * saves second would otherwise overwrite the first one's progress with its stale snapshot. The one exception
 * is when the last write failed -- then storage is behind and this tab's copy is the newer truth.
 *
 * `load` and `save` must be stable (module-level) functions. The updater runs outside any React state
 * updater, so StrictMode's double-invocation cannot apply an increment twice.
 */
export function usePersistedState<T>(
  load: () => T,
  save: (value: T) => boolean,
): [T, (updater: (prev: T) => T) => void] {
  const [value, setValue] = useState<T>(load);
  const latest = useRef(value);

  const update = useCallback(
    (updater: (prev: T) => T) => {
      const base = getStorageHealth() === 'write-failed' ? latest.current : load();
      const next = updater(base);
      if (next !== base) save(next);
      latest.current = next;
      setValue(next);
    },
    [load, save],
  );

  return [value, update];
}
