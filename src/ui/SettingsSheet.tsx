import { Download, HelpCircle, Lock, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { hapticsSupported, playCue, preloadSounds } from '../feedback';
import { remindersSupported, reminderPermission, requestReminderPermission, type ReminderPermission } from '../notifications';
import { PALETTES, isPaletteUnlocked } from '../game/palettes';
import { isNative } from '../native';
import { downloadTextFile, shareContent } from '../share';
import { applyBackup, createBackup, parseBackup } from '../storage/backup';
import { clearAllProgress, type Settings } from '../storage/schema';
import { Sheet } from './Sheet';

interface SettingsSheetProps {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
  /** The player's level, which decides which board palettes are unlocked. */
  playerLevel: number;
  onShowIntro: () => void;
}

type ToggleKey =
  | 'highlightSameDigit'
  | 'highlightPeers'
  | 'showMistakes'
  | 'autoRemoveNotes'
  | 'soundEnabled'
  | 'hapticsEnabled'
  | 'reminderEnabled';

const TOGGLES: { key: ToggleKey; label: string; hint: string; show?: boolean }[] = [
  { key: 'showMistakes', label: 'Báo số sai', hint: 'Tô đỏ ô điền sai và trừ tim' },
  { key: 'highlightSameDigit', label: 'Tô các số giống nhau', hint: 'Làm nổi mọi ô cùng giá trị với ô đang chọn' },
  { key: 'highlightPeers', label: 'Tô hàng, cột, ô 3×3', hint: 'Làm nhạt vùng liên quan tới ô đang chọn' },
  { key: 'autoRemoveNotes', label: 'Tự xóa ghi chú', hint: 'Điền số xong thì gỡ số đó khỏi ghi chú lân cận' },
  { key: 'soundEnabled', label: 'Âm thanh', hint: 'Tiếng khi điền số, báo sai, xong hàng và hoàn thành màn' },
  { key: 'hapticsEnabled', label: 'Rung', hint: 'Rung nhẹ khi điền số và khi điền sai', show: hapticsSupported },
  { key: 'reminderEnabled', label: 'Nhắc làm thử thách', hint: 'Thông báo lúc 20:00 nếu bạn chưa làm thử thách hôm nay', show: remindersSupported },
];

const THEMES: { value: Settings['theme']; label: string }[] = [
  { value: 'system', label: 'Theo máy' },
  { value: 'light', label: 'Sáng' },
  { value: 'dark', label: 'Tối' },
];

const MAX_BACKUP_FILE_BYTES = 8_000_000;

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

export function SettingsSheet({ settings, onChange, onClose, playerLevel, onShowIntro }: SettingsSheetProps): JSX.Element {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  /** Whether the OS lets us show notifications (Android): the switch alone cannot make a blocked reminder appear. */
  const [permission, setPermission] = useState<ReminderPermission>('unsupported');

  useEffect(() => {
    if (remindersSupported) void reminderPermission().then(setPermission);
  }, []);

  async function toggleReminder(): Promise<void> {
    if (settings.reminderEnabled) {
      onChange({ reminderEnabled: false });
      return;
    }
    // Turning it on is the moment to ask for the system permission.
    const result = await requestReminderPermission();
    setPermission(result);
    if (result === 'granted') onChange({ reminderEnabled: true });
    else setMessage('Cần cho phép thông báo cho Sudoku trong cài đặt của máy để nhận nhắc nhở.');
  }

  function toggle(key: ToggleKey): void {
    if (key === 'reminderEnabled') {
      void toggleReminder();
      return;
    }
    const next = !settings[key];
    onChange({ [key]: next });
    // Let the player hear / feel what they just switched on.
    if (next && key === 'soundEnabled') {
      preloadSounds();
      playCue('place', { sound: true, haptics: false });
    } else if (next && key === 'hapticsEnabled') {
      playCue('place', { sound: false, haptics: true });
    }
  }

  function handleClear(): void {
    if (window.confirm('Xóa toàn bộ tiến độ, sao, thống kê và chuỗi ngày? Hành động này không thể hoàn tác.')) {
      clearAllProgress();
      window.location.reload();
    }
  }

  async function handleBackup(): Promise<void> {
    const text = createBackup(Date.now());
    if (isNative) {
      // No file system access in the WebView: hand the text to the share sheet (Drive, e-mail, notes...).
      const outcome = await shareContent({ title: 'Sao lưu Sudoku', text });
      setMessage(
        outcome === 'shared'
          ? 'Đã mở bảng chia sẻ. Hãy lưu nội dung lại ở nơi bạn muốn.'
          : outcome === 'cancelled'
            ? null
            : 'Không sao lưu được.',
      );
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    setMessage(downloadTextFile(`sudoku-backup-${stamp}.json`, text) ? 'Đã tải về file sao lưu.' : 'Không sao lưu được.');
  }

  async function handleRestoreFile(file: File | undefined): Promise<void> {
    if (!file) return;
    if (file.size > MAX_BACKUP_FILE_BYTES) {
      setMessage('File quá lớn, không phải file sao lưu của Sudoku.');
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setMessage('Không đọc được file.');
      return;
    }
    const backup = parseBackup(text);
    if (!backup) {
      setMessage('File này không phải bản sao lưu hợp lệ của Sudoku.');
      return;
    }
    const when = backup.exportedAt ? ` (lưu ngày ${new Date(backup.exportedAt).toLocaleDateString('vi-VN')})` : '';
    if (
      window.confirm(
        `Khôi phục ${backup.games.length} màn đã chơi${when}? Tiến độ hiện tại trên máy này sẽ bị thay thế bằng bản sao lưu.`,
      )
    ) {
      applyBackup(backup);
      window.location.reload();
    }
  }

  return (
    <Sheet title="Cài đặt" onClose={onClose}>
      <div className="flex flex-col gap-1">
        {TOGGLES.filter((t) => t.show !== false).map(({ key, label, hint }) => (
          <button
            key={key}
            type="button"
            role="switch"
            aria-checked={settings[key]}
            onClick={() => toggle(key)}
            className="flex min-h-[3.5rem] items-center justify-between gap-4 rounded-2xl px-2 py-2 text-left transition-colors active:bg-page"
          >
            <span>
              <span className="block text-base font-extrabold">{label}</span>
              <span className="block text-sm font-semibold text-accent">{hint}</span>
              {key === 'reminderEnabled' && settings.reminderEnabled && permission === 'denied' && (
                <span className="mt-0.5 block text-sm font-extrabold text-rose-600 dark:text-rose-300">
                  Thông báo đang bị tắt trong cài đặt của máy.
                </span>
              )}
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

      <div className="mt-4">
        <div className="mb-2 px-2 text-base font-extrabold">
          Màu bàn cờ <span className="text-sm font-bold text-accent">· mở khoá khi lên cấp</span>
        </div>
        <div role="radiogroup" aria-label="Màu bàn cờ" className="grid grid-cols-2 gap-2">
          {PALETTES.map(({ id, label, unlockLevel, swatch }) => {
            const unlocked = isPaletteUnlocked(id, playerLevel);
            const active = settings.boardPalette === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={!unlocked}
                onClick={() => onChange({ boardPalette: id })}
                aria-label={unlocked ? label : `${label}, mở khoá ở cấp ${unlockLevel}`}
                className={`btn min-h-12 justify-start gap-2.5 !px-3 text-sm ${active ? 'btn-primary' : 'btn-soft'}`}
              >
                <span
                  className="h-6 w-6 shrink-0 rounded-full border-2 border-white/70"
                  style={{ backgroundColor: swatch } as CSSProperties}
                  aria-hidden="true"
                />
                <span className="flex-1 text-left">{label}</span>
                {!unlocked && (
                  <span className="flex shrink-0 items-center gap-1 text-xs font-extrabold opacity-80" aria-hidden="true">
                    <Lock size={12} strokeWidth={3} />
                    {unlockLevel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <div className="px-2 text-base font-extrabold">Dữ liệu</div>
        <button type="button" onClick={onShowIntro} className="btn btn-soft w-full justify-start">
          <HelpCircle size={20} strokeWidth={2.75} aria-hidden="true" />
          Hướng dẫn chơi
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => void handleBackup()} className="btn btn-soft min-h-12 text-sm">
            <Download size={18} strokeWidth={2.75} aria-hidden="true" />
            Sao lưu
          </button>
          <button type="button" onClick={() => fileInput.current?.click()} className="btn btn-soft min-h-12 text-sm">
            <Upload size={18} strokeWidth={2.75} aria-hidden="true" />
            Khôi phục
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".json,.txt,application/json,text/plain"
          className="hidden"
          aria-label="Chọn file sao lưu"
          onChange={(e) => {
            void handleRestoreFile(e.target.files?.[0]);
            e.target.value = ''; // so picking the same file twice still fires
          }}
        />
        {message && (
          <p role="status" className="px-2 text-sm font-bold text-accent">
            {message}
          </p>
        )}
      </div>

      <button type="button" onClick={handleClear} className="btn btn-soft mt-6 w-full text-rose-600 dark:text-rose-300">
        <Trash2 size={20} strokeWidth={2.75} aria-hidden="true" />
        Xóa toàn bộ tiến độ
      </button>
    </Sheet>
  );
}
