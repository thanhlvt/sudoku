const memoryStore = new Map<string, string>();
let availabilityChecked = false;
let available = false;

function checkAvailability(): boolean {
  if (availabilityChecked) return available;
  availabilityChecked = true;
  try {
    const testKey = '__sudoku_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    available = true;
  } catch {
    available = false;
  }
  return available;
}

export function isAvailable(): boolean {
  return checkAvailability();
}

/**
 * `memory-only`: localStorage is unusable, progress lives until the tab closes.
 * `write-failed`: localStorage works but the last write was rejected (quota full, nothing left to evict).
 */
export type StorageHealth = 'ok' | 'memory-only' | 'write-failed';

let lastWriteFailed = false;
const healthListeners = new Set<() => void>();

function setLastWriteFailed(failed: boolean): void {
  if (failed === lastWriteFailed) return;
  lastWriteFailed = failed;
  for (const listener of healthListeners) listener();
}

/** Snapshot for `useSyncExternalStore`: a primitive, so it is stable between changes. */
export function getStorageHealth(): StorageHealth {
  if (!checkAvailability()) return 'memory-only';
  return lastWriteFailed ? 'write-failed' : 'ok';
}

export function subscribeStorageHealth(listener: () => void): () => void {
  healthListeners.add(listener);
  return () => {
    healthListeners.delete(listener);
  };
}

function isQuotaExceeded(err: unknown): boolean {
  if (!(err instanceof DOMException)) return false;
  return err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED' || err.code === 22 || err.code === 1014;
}

function evictOldestCompletedGame(): boolean {
  try {
    let oldestKey: string | null = null;
    let oldestCompletedAt = Infinity;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith('sudoku:v1:game:')) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as { status?: string; completedAt?: number };
        if (parsed.status === 'completed' && (parsed.completedAt ?? 0) < oldestCompletedAt) {
          oldestCompletedAt = parsed.completedAt ?? 0;
          oldestKey = key;
        }
      } catch {
        continue;
      }
    }
    if (oldestKey === null) return false;
    window.localStorage.removeItem(oldestKey);
    return true;
  } catch {
    return false;
  }
}

function getRaw(key: string): string | null {
  if (checkAvailability()) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return memoryStore.get(key) ?? null;
}

function setRaw(key: string, value: string): boolean {
  if (checkAvailability()) {
    try {
      window.localStorage.setItem(key, value);
      setLastWriteFailed(false);
      return true;
    } catch (err) {
      if (isQuotaExceeded(err) && evictOldestCompletedGame()) {
        try {
          window.localStorage.setItem(key, value);
          setLastWriteFailed(false);
          return true;
        } catch {
          // fall through to the failure path
        }
      }
      setLastWriteFailed(true);
      return false;
    }
  }
  memoryStore.set(key, value);
  return true;
}

function removeRaw(key: string): void {
  if (checkAvailability()) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return;
  }
  memoryStore.delete(key);
}

/**
 * Reads and parses `key`. Corrupt JSON -- or, when `validate` is given, a value of the wrong shape --
 * deletes the key and yields `fallback`, so one bad record can never poison later reads.
 *
 * `validate` receives the untrusted parsed value and returns the sanitised `T`, or `null` to reject it.
 * Without it the parsed value is trusted as `T`, which is only acceptable for data the caller checks itself.
 */
export function readJSON<T>(key: string, fallback: T, validate?: (value: unknown) => T | null): T {
  const raw = getRaw(key);
  if (raw === null) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!validate) return parsed as T;
    const checked = validate(parsed);
    if (checked !== null) return checked;
  } catch {
    // fall through: unparsable (or a validator that threw) is treated as invalid
  }
  removeRaw(key);
  return fallback;
}

export function writeJSON(key: string, value: unknown): boolean {
  try {
    return setRaw(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  removeRaw(key);
}

export function removeAllWithPrefix(prefix: string): void {
  if (checkAvailability()) {
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(prefix)) toRemove.push(key);
      }
      for (const key of toRemove) window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return;
  }
  for (const key of Array.from(memoryStore.keys())) {
    if (key.startsWith(prefix)) memoryStore.delete(key);
  }
}

export function listKeysWithPrefix(prefix: string): string[] {
  if (checkAvailability()) {
    try {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(prefix)) keys.push(key);
      }
      return keys;
    } catch {
      return [];
    }
  }
  return Array.from(memoryStore.keys()).filter((key) => key.startsWith(prefix));
}
