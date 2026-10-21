import { TriangleAlert } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import type { MessageKey } from '../i18n';
import { useI18n } from '../i18n/useI18n';
import { getStorageHealth, subscribeStorageHealth } from '../storage/storage';

const MESSAGES = {
  'memory-only': 'storage.memoryOnly',
  'write-failed': 'storage.writeFailed',
} as const satisfies Record<string, MessageKey>;

/** Tells the player when progress is not actually being saved (private mode, or storage full). */
export function StorageBanner(): JSX.Element | null {
  const health = useSyncExternalStore(subscribeStorageHealth, getStorageHealth);
  const { t } = useI18n();
  if (health === 'ok') return null;
  return (
    <div className="mx-auto w-full max-w-md px-5 pt-3">
      <p
        role="status"
        className="flex items-start gap-2 rounded-2xl bg-amber-100 p-3 text-sm font-bold text-amber-950 dark:bg-amber-900/40 dark:text-amber-50"
      >
        <TriangleAlert size={18} strokeWidth={2.75} className="mt-0.5 shrink-0" aria-hidden="true" />
        {t(MESSAGES[health])}
      </p>
    </div>
  );
}
