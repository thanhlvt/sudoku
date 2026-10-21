import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNative } from './native';

/**
 * Sound effects and vibration. Sounds are the .mp3 files in `public/sounds/` (replace them freely, keep the
 * names); they are fetched once, decoded into Web Audio buffers and played with no per-play latency.
 * Everything here fails silently: no audio support, a missing file or a blocked autoplay must never affect play.
 */
export type SoundName = 'place' | 'note' | 'erase' | 'undo' | 'error' | 'unit' | 'hint' | 'win';
type HapticKind = 'light' | 'medium' | 'error' | 'success';

/** A game event and how it is signalled. One event can be a sound, a vibration, or both. */
export type Cue = 'place' | 'note' | 'erase' | 'undo' | 'error' | 'unit' | 'hint' | 'win';

const CUES: Record<Cue, { sound: SoundName; haptic: HapticKind | null }> = {
  place: { sound: 'place', haptic: 'light' },
  note: { sound: 'note', haptic: 'light' },
  erase: { sound: 'erase', haptic: 'light' },
  undo: { sound: 'undo', haptic: 'light' },
  error: { sound: 'error', haptic: 'error' },
  unit: { sound: 'unit', haptic: 'medium' },
  hint: { sound: 'hint', haptic: 'light' },
  win: { sound: 'win', haptic: 'success' },
};

const SOUND_NAMES = Object.keys(CUES) as SoundName[];
const MASTER_VOLUME = 0.8;

// -- Sound ------------------------------------------------------------------------------------------------------

type AudioContextCtor = typeof AudioContext;

const rawData = new Map<SoundName, ArrayBuffer>();
const decoded = new Map<SoundName, AudioBuffer>();
let context: AudioContext | null = null;
let master: GainNode | null = null;
let preloadStarted = false;

function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

function soundUrl(name: SoundName): string {
  return `${import.meta.env.BASE_URL}sounds/${name}.mp3`;
}

function decodePending(): void {
  const ctx = context;
  if (!ctx) return;
  for (const [name, data] of rawData) {
    rawData.delete(name);
    // decodeAudioData detaches the buffer it is given; a copy keeps the failure path (and Safari's
    // callback-only signature) simple.
    ctx.decodeAudioData(data.slice(0)).then(
      (buffer) => decoded.set(name, buffer),
      () => {},
    );
  }
}

/** Creates the audio context. Browsers only let it run after a user gesture, so call this from one. */
function prime(): AudioContext | null {
  if (!context) {
    const Ctor = audioContextCtor();
    if (!Ctor) return null;
    try {
      context = new Ctor();
      master = context.createGain();
      master.gain.value = MASTER_VOLUME;
      master.connect(context.destination);
    } catch {
      context = null;
      return null;
    }
  }
  if (context.state === 'suspended') void context.resume().catch(() => {});
  decodePending();
  return context;
}

/** Downloads the sound files (once) so the first effect does not wait on the network. Safe to call repeatedly. */
export function preloadSounds(): void {
  if (preloadStarted || !audioContextCtor() || typeof fetch !== 'function') return;
  preloadStarted = true;
  for (const name of SOUND_NAMES) {
    fetch(soundUrl(name))
      .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(String(res.status)))))
      .then((data) => {
        rawData.set(name, data);
        decodePending();
      })
      .catch(() => {});
  }
  // The first tap or key press unlocks audio for the whole page.
  const unlock = (): void => {
    prime();
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
}

function playSound(name: SoundName): void {
  const ctx = prime();
  if (!ctx || !master) return;
  const buffer = decoded.get(name);
  if (!buffer) return;
  try {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(master);
    source.start();
  } catch {
    // Nothing useful to do; sound is optional.
  }
}

// -- Haptics ----------------------------------------------------------------------------------------------------

const VIBRATE_PATTERN: Record<HapticKind, number | number[]> = {
  light: 8,
  medium: 16,
  error: [30, 40, 30],
  success: [15, 40, 15, 40, 40],
};

/** Whether this device can vibrate at all (the settings sheet hides the toggle when it cannot). */
export const hapticsSupported: boolean =
  isNative || (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function');

function vibrate(kind: HapticKind): void {
  try {
    if (isNative) {
      if (kind === 'error') void Haptics.notification({ type: NotificationType.Error }).catch(() => {});
      else if (kind === 'success') void Haptics.notification({ type: NotificationType.Success }).catch(() => {});
      else void Haptics.impact({ style: kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(VIBRATE_PATTERN[kind]);
    }
  } catch {
    // Vibration is optional.
  }
}

// -- Public -----------------------------------------------------------------------------------------------------

export interface FeedbackChannels {
  sound: boolean;
  haptics: boolean;
}

/** Signals a game event on the channels the player has enabled. */
export function playCue(cue: Cue, channels: FeedbackChannels): void {
  const spec = CUES[cue];
  if (channels.sound) playSound(spec.sound);
  if (channels.haptics && spec.haptic) vibrate(spec.haptic);
}
