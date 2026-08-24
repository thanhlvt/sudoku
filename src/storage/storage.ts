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
      return true;
    } catch (err) {
      if (isQuotaExceeded(err) && evictOldestCompletedGame()) {
        try {
          window.localStorage.setItem(key, value);
          return true;
        } catch {
          return false;
        }
      }
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

export function readJSON<T>(key: string, fallback: T): T {
  const raw = getRaw(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    removeRaw(key);
    return fallback;
  }
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
