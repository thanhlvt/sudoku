import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isNative } from './native';

/** `downloaded`: there was no share sheet for files, so the file was saved to the downloads instead. */
export type ShareOutcome = 'shared' | 'copied' | 'downloaded' | 'cancelled' | 'failed';

export interface ShareContent {
  title: string;
  text: string;
  /** Shared alongside the text when present. */
  url?: string | null;
}

/**
 * Where a puzzle link should point. The web build knows its own address; the Android build runs from
 * `https://localhost`, which means nothing to anyone else, so it only links when `VITE_PUBLIC_URL` was set
 * at build time (the address the game is published at).
 */
export function puzzleUrl(puzzleId: string): string | null {
  const base = isNative
    ? (import.meta.env.VITE_PUBLIC_URL as string | undefined)
    : `${window.location.origin}${window.location.pathname}`;
  if (!base) return null;
  return `${base.replace(/#.*$/, '')}#/play/${puzzleId}`;
}

function isCancel(error: unknown): boolean {
  const e = error as { name?: string; message?: string } | null;
  return e?.name === 'AbortError' || /cancel/i.test(e?.message ?? '');
}

/** Opens the system share sheet; where there is none (desktop browsers) the text is copied instead. */
export async function shareContent({ title, text, url }: ShareContent): Promise<ShareOutcome> {
  try {
    if (isNative) {
      await Share.share({ title, text, url: url ?? undefined, dialogTitle: title });
      return 'shared';
    }
    if (typeof navigator.share === 'function') {
      await navigator.share({ title, text, url: url ?? undefined });
      return 'shared';
    }
  } catch (error) {
    if (isCancel(error)) return 'cancelled';
    // Anything else (no share target, blocked by policy): fall through to copying.
  }
  try {
    await navigator.clipboard.writeText(url ? `${text}\n${url}` : text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

/** Saves `blob` as a file download (web). Returns false when the browser cannot do it. */
export function downloadBlob(filename: string, blob: Blob): boolean {
  try {
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    return true;
  } catch {
    return false;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result).replace(/^data:[^,]*,/, ''));
    reader.readAsDataURL(blob);
  });
}

export interface ShareFileContent {
  title: string;
  /** Name of the file the receiver sees, extension included. */
  filename: string;
  blob: Blob;
  /** Sent along with the file when the receiving app takes a caption. */
  text?: string;
}

/**
 * Hands a file (an image, a backup) to the system share sheet. Android has no file system access from the
 * WebView, so the file is written to the app cache first and shared by its URI. Browsers that cannot share
 * files (most desktop ones) save it to the downloads folder instead.
 */
export async function shareFile({ title, filename, blob, text }: ShareFileContent): Promise<ShareOutcome> {
  try {
    if (isNative) {
      const { uri } = await Filesystem.writeFile({ path: filename, data: await blobToBase64(blob), directory: Directory.Cache });
      await Share.share({ title, text, files: [uri], dialogTitle: title });
      return 'shared';
    }
    const file = new File([blob], filename, { type: blob.type });
    if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      await navigator.share({ title, text, files: [file] });
      return 'shared';
    }
  } catch (error) {
    if (isCancel(error)) return 'cancelled';
    if (isNative) return 'failed';
    // Blocked by policy or no share target: fall through to a download.
  }
  if (isNative) return 'failed';
  return downloadBlob(filename, blob) ? 'downloaded' : 'failed';
}
