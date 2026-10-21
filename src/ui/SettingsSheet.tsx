import { Download, HelpCircle, Lock, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { hapticsSupported, playCue, preloadSounds } from '../feedback';
import { remindersSupported, reminderPermission, requestReminderPermission, type ReminderPermission } from '../notifications';
import { PALETTES, isPaletteUnlocked } from '../game/palettes';
import { LANGUAGE_PREFERENCES, LOCALE_NAMES, type MessageKey } from '../i18n';
import { formatDate } from '../i18n/format';
import { useI18n } from '../i18n/useI18n';
import { isNative } from '../native';
import { downloadBlob, shareFile } from '../share';
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

const TOGGLES: { key: ToggleKey; label: MessageKey; hint: MessageKey; show?: boolean }[] = [
  { key: 'showMistakes', label: 'settings.showMistakes.label', hint: 'settings.showMistakes.hint' },
  { key: 'highlightSameDigit', label: 'settings.highlightSameDigit.label', hint: 'settings.highlightSameDigit.hint' },
  { key: 'highlightPeers', label: 'settings.highlightPeers.label', hint: 'settings.highlightPeers.hint' },
  { key: 'autoRemoveNotes', label: 'settings.autoRemoveNotes.label', hint: 'settings.autoRemoveNotes.hint' },
  { key: 'soundEnabled', label: 'settings.soundEnabled.label', hint: 'settings.soundEnabled.hint' },
  { key: 'hapticsEnabled', label: 'settings.hapticsEnabled.label', hint: 'settings.hapticsEnabled.hint', show: hapticsSupported },
  { key: 'reminderEnabled', label: 'settings.reminderEnabled.label', hint: 'settings.reminderEnabled.hint', show: remindersSupported },
];

const THEMES: { value: Settings['theme']; label: MessageKey }[] = [
  { value: 'system', label: 'settings.theme.system' },
  { value: 'light', label: 'settings.theme.light' },
  { value: 'dark', label: 'settings.theme.dark' },
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
  const { t, intlLocale } = useI18n();
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
    else setMessage(t('settings.reminderPermission'));
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
    if (window.confirm(t('confirm.clearAll'))) {
      clearAllProgress();
      window.location.reload();
    }
  }

  async function handleBackup(): Promise<void> {
    const blob = new Blob([createBackup(Date.now())], { type: 'application/json' });
    const filename = `sudoku-backup-${new Date().toISOString().slice(0, 10)}.json`;
    if (isNative) {
      // No downloads folder in the WebView: hand the file to the share sheet (Drive, Files, e-mail...).
      const outcome = await shareFile({ title: t('settings.backupTitle'), filename, blob });
      setMessage(
        outcome === 'shared' ? t('settings.backupShared') : outcome === 'cancelled' ? null : t('settings.backupFailed'),
      );
      return;
    }
    setMessage(downloadBlob(filename, blob) ? t('settings.backupDownloaded') : t('settings.backupFailed'));
  }

  async function handleRestoreFile(file: File | undefined): Promise<void> {
    if (!file) return;
    if (file.size > MAX_BACKUP_FILE_BYTES) {
      setMessage(t('settings.fileTooLarge'));
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setMessage(t('settings.fileUnreadable'));
      return;
    }
    const backup = parseBackup(text);
    if (!backup) {
      setMessage(t('settings.fileInvalid'));
      return;
    }
    const when = backup.exportedAt ? t('settings.restoreWhen', { date: formatDate(backup.exportedAt, intlLocale) }) : '';
    if (window.confirm(t('settings.restoreConfirm', { count: backup.games.length, when }))) {
      applyBackup(backup);
      window.location.reload();
    }
  }

  return (
    <Sheet title={t('settings.title')} onClose={onClose}>
      <div className="flex flex-col gap-1">
        {TOGGLES.filter((toggle) => toggle.show !== false).map(({ key, label, hint }) => (
          <button
            key={key}
            type="button"
            role="switch"
            aria-checked={settings[key]}
            onClick={() => toggle(key)}
            className="flex min-h-[3.5rem] items-center justify-between gap-4 rounded-2xl px-2 py-2 text-left transition-colors active:bg-page"
          >
            <span>
              <span className="block text-base font-extrabold">{t(label)}</span>
              <span className="block text-sm font-semibold text-accent">{t(hint)}</span>
              {key === 'reminderEnabled' && settings.reminderEnabled && permission === 'denied' && (
                <span className="mt-0.5 block text-sm font-extrabold text-rose-600 dark:text-rose-300">
                  {t('settings.reminderDenied')}
                </span>
              )}
            </span>
            <Switch on={settings[key]} />
          </button>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-2 px-2 text-base font-extrabold">{t('settings.theme')}</div>
        <div role="radiogroup" aria-label={t('settings.theme')} className="grid grid-cols-3 gap-2">
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
                {t(label)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 px-2 text-base font-extrabold">{t('settings.language')}</div>
        <div role="radiogroup" aria-label={t('settings.language')} className="grid grid-cols-3 gap-2">
          {LANGUAGE_PREFERENCES.map((value) => {
            const active = settings.language === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ language: value })}
                className={`btn min-h-11 text-sm ${active ? 'btn-primary' : 'btn-soft'}`}
              >
                {value === 'auto' ? t('settings.language.auto') : LOCALE_NAMES[value]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 px-2 text-base font-extrabold">
          {t('settings.palette')} <span className="text-sm font-bold text-accent">{t('settings.paletteHint')}</span>
        </div>
        <div role="radiogroup" aria-label={t('settings.palette')} className="grid grid-cols-2 gap-2">
          {PALETTES.map(({ id, labelKey, unlockLevel, swatch }) => {
            const label = t(labelKey);
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
                aria-label={unlocked ? label : t('settings.paletteLocked', { label, level: unlockLevel })}
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
        <div className="px-2 text-base font-extrabold">{t('settings.data')}</div>
        <button type="button" onClick={onShowIntro} className="btn btn-soft w-full justify-start">
          <HelpCircle size={20} strokeWidth={2.75} aria-hidden="true" />
          {t('settings.howToPlay')}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => void handleBackup()} className="btn btn-soft min-h-12 text-sm">
            <Download size={18} strokeWidth={2.75} aria-hidden="true" />
            {t('settings.backup')}
          </button>
          <button type="button" onClick={() => fileInput.current?.click()} className="btn btn-soft min-h-12 text-sm">
            <Upload size={18} strokeWidth={2.75} aria-hidden="true" />
            {t('settings.restore')}
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          // Android pickers label a backup that came through Drive or chat with all sorts of types, so do not filter there.
          accept={isNative ? undefined : '.json,.txt,application/json,text/plain'}
          className="hidden"
          aria-label={t('settings.pickFile')}
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
        {t('settings.clearAll')}
      </button>
    </Sheet>
  );
}
