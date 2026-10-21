import { TriangleAlert } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { getStorageHealth, subscribeStorageHealth } from '../storage/storage';

const MESSAGES = {
  'memory-only': 'Trình duyệt không cho lưu dữ liệu, nên tiến độ sẽ mất khi bạn đóng trang.',
  'write-failed': 'Bộ nhớ đã đầy nên tiến độ mới chưa được lưu. Hãy giải phóng dung lượng rồi chơi tiếp.',
} as const;

/** Tells the player when progress is not actually being saved (private mode, or storage full). */
export function StorageBanner(): JSX.Element | null {
  const health = useSyncExternalStore(subscribeStorageHealth, getStorageHealth);
  if (health === 'ok') return null;
  return (
    <div className="mx-auto w-full max-w-md px-5 pt-3">
      <p
        role="status"
        className="flex items-start gap-2 rounded-2xl bg-amber-100 p-3 text-sm font-bold text-amber-950 dark:bg-amber-900/40 dark:text-amber-50"
      >
        <TriangleAlert size={18} strokeWidth={2.75} className="mt-0.5 shrink-0" aria-hidden="true" />
        {MESSAGES[health]}
      </p>
    </div>
  );
}
