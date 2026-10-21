import { Share } from '@capacitor/share';
import { isNative } from './native';

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

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

/** Saves `text` as a file download (web). Returns false when the browser cannot do it. */
export function downloadTextFile(filename: string, text: string, mime = 'application/json'): boolean {
  try {
    const blob = new Blob([text], { type: mime });
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
