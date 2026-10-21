import { Trash2 } from 'lucide-react';
import { clearAllProgress, type Settings } from '../storage/schema';
import { Sheet } from './Sheet';

interface SettingsSheetProps {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
}

type ToggleKey = 'highlightSameDigit' | 'highlightPeers' | 'showMistakes' | 'autoRemoveNotes';

const TOGGLES: { key: ToggleKey; label: string; hint: string }[] = [
  { key: 'showMistakes', label: 'Báo số sai', hint: 'Tô đỏ ô điền sai và trừ tim' },
  { key: 'highlightSameDigit', label: 'Tô các số giống nhau', hint: 'Làm nổi mọi ô cùng giá trị với ô đang chọn' },
  { key: 'highlightPeers', label: 'Tô hàng, cột, ô 3×3', hint: 'Làm nhạt vùng liên quan tới ô đang chọn' },
  { key: 'autoRemoveNotes', label: 'Tự xóa ghi chú', hint: 'Điền số xong thì gỡ số đó khỏi ghi chú lân cận' },
];

const THEMES: { value: Settings['theme']; label: string }[] = [
  { value: 'system', label: 'Theo máy' },
  { value: 'light', label: 'Sáng' },
  { value: 'dark', label: 'Tối' },
];

function Switch({ on }: { on: boolean }): JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200 ${on ? 'bg-primary' : 'bg-soft'}`}
    >
      <span
        className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ease-out ${
          on ? 'translate-x-6' : ''
        }`}
      />
    </span>
  );
}

export function SettingsSheet({ settings, onChange, onClose }: SettingsSheetProps): JSX.Element {
  function handleClear(): void {
    if (window.confirm('Xóa toàn bộ tiến độ, sao, thống kê và chuỗi ngày? Hành động này không thể hoàn tác.')) {
      clearAllProgress();
      window.location.reload();
    }
  }

  return (
    <Sheet title="Cài đặt" onClose={onClose}>
      <div className="flex flex-col gap-1">
        {TOGGLES.map(({ key, label, hint }) => (
          <button
            key={key}
            type="button"
            role="switch"
            aria-checked={settings[key]}
            onClick={() => onChange({ [key]: !settings[key] })}
            className="flex min-h-[3.5rem] items-center justify-between gap-4 rounded-2xl px-2 py-2 text-left transition-colors active:bg-page"
          >
            <span>
              <span className="block text-base font-extrabold">{label}</span>
              <span className="block text-sm font-semibold text-accent">{hint}</span>
            </span>
            <Switch on={settings[key]} />
          </button>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-2 px-2 text-base font-extrabold">Giao diện</div>
        <div role="radiogroup" aria-label="Giao diện" className="grid grid-cols-3 gap-2">
          {THEMES.map(({ value, label }) => {
            const active = settings.theme === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ theme: value })}
                className={`btn min-h-11 text-sm ${active ? 'btn-primary' : 'btn-soft'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <button type="button" onClick={handleClear} className="btn btn-soft mt-6 w-full text-rose-600 dark:text-rose-300">
        <Trash2 size={20} strokeWidth={2.75} aria-hidden="true" />
        Xóa toàn bộ tiến độ
      </button>
    </Sheet>
  );
}
