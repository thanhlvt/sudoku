// Synthesises the game's sound effects and encodes them as MP3 into public/sounds/.
//
//   npm run sounds
//
// The output is deterministic (fixed noise seed), so re-running only rewrites identical files. To use your own
// sounds, just overwrite the .mp3 files in public/sounds/ (same names) -- the game only reads those files.
// Re-running this script will overwrite them again, so don't run it after replacing them.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Mp3Encoder } from '@breezystack/lamejs';

const SAMPLE_RATE = 44100;
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sounds');

/** Tiny seeded PRNG so the noise in the sounds is identical on every run. */
function noiseSource(seed = 1234567) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x80000000 - 1;
  };
}

function buffer(seconds) {
  return new Float32Array(Math.ceil(seconds * SAMPLE_RATE));
}

/** A struck-bell / marimba-like note: a sine with a few decaying harmonics. */
function addTone(buf, { freq, start = 0, dur, gain = 0.5, decay = 18, harmonics = [1, 0.35, 0.12], attack = 0.003 }) {
  const first = Math.floor(start * SAMPLE_RATE);
  const count = Math.floor(dur * SAMPLE_RATE);
  for (let i = 0; i < count && first + i < buf.length; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.min(1, t / attack) * Math.exp(-decay * t);
    let v = 0;
    harmonics.forEach((h, k) => {
      v += h * Math.sin(2 * Math.PI * freq * (k + 1) * t);
    });
    buf[first + i] += v * env * gain;
  }
}

/** A pitch glide (used for swishes and the "undo" blip). */
function addSweep(buf, { from, to, start = 0, dur, gain = 0.4, decay = 10 }) {
  const first = Math.floor(start * SAMPLE_RATE);
  const count = Math.floor(dur * SAMPLE_RATE);
  let phase = 0;
  for (let i = 0; i < count && first + i < buf.length; i++) {
    const t = i / SAMPLE_RATE;
    const freq = from + ((to - from) * i) / count;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    buf[first + i] += Math.sin(phase) * Math.min(1, t / 0.004) * Math.exp(-decay * t) * gain;
  }
}

/** Band-limited noise burst (one-pole low-pass), for clicks and swishes. */
function addNoise(buf, { start = 0, dur, gain = 0.3, decay = 40, smooth = 0.5 }) {
  const rand = noiseSource(Math.floor(start * 1000) + 99);
  const first = Math.floor(start * SAMPLE_RATE);
  const count = Math.floor(dur * SAMPLE_RATE);
  let last = 0;
  for (let i = 0; i < count && first + i < buf.length; i++) {
    const t = i / SAMPLE_RATE;
    last += smooth * (rand() - last);
    buf[first + i] += last * Math.exp(-decay * t) * gain;
  }
}

function addBuzz(buf, { freq, start = 0, dur, gain = 0.35, decay = 9 }) {
  const first = Math.floor(start * SAMPLE_RATE);
  const count = Math.floor(dur * SAMPLE_RATE);
  for (let i = 0; i < count && first + i < buf.length; i++) {
    const t = i / SAMPLE_RATE;
    // Soft-clipped sine gives a dull "bzzt" without being harsh.
    const s = Math.tanh(3 * Math.sin(2 * Math.PI * freq * t)) * 0.7 + Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.3;
    buf[first + i] += s * Math.min(1, t / 0.005) * Math.exp(-decay * t) * gain;
  }
}

/** Peak-normalise to `peak` and fade the last few ms so there is no click at the end. */
function finish(buf, peak = 0.7) {
  let max = 0;
  for (const v of buf) max = Math.max(max, Math.abs(v));
  const scale = max > 0 ? peak / max : 1;
  const fade = Math.min(buf.length, Math.floor(0.012 * SAMPLE_RATE));
  for (let i = 0; i < buf.length; i++) {
    const tail = buf.length - i < fade ? (buf.length - i) / fade : 1;
    buf[i] *= scale * tail;
  }
  return buf;
}

function encodeMp3(samples) {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) pcm[i] = Math.max(-1, Math.min(1, samples[i])) * 32767;
  const encoder = new Mp3Encoder(1, SAMPLE_RATE, 96);
  const parts = [];
  const BLOCK = 1152;
  for (let i = 0; i < pcm.length; i += BLOCK) {
    const chunk = encoder.encodeBuffer(pcm.subarray(i, i + BLOCK));
    if (chunk.length > 0) parts.push(Buffer.from(chunk));
  }
  const tail = encoder.flush();
  if (tail.length > 0) parts.push(Buffer.from(tail));
  return Buffer.concat(parts);
}

// Note frequencies (Hz).
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;
const E6 = 1318.5;
const G6 = 1568.0;

const SOUNDS = {
  // Digit placed: a soft wooden "tok".
  place() {
    const b = buffer(0.16);
    addTone(b, { freq: 440, dur: 0.15, gain: 0.6, decay: 28, harmonics: [1, 0.5, 0.15] });
    addNoise(b, { dur: 0.02, gain: 0.35, decay: 150, smooth: 0.35 });
    return finish(b);
  },
  // Pencil mark toggled: a lighter, higher tick.
  note() {
    const b = buffer(0.09);
    addTone(b, { freq: 1250, dur: 0.08, gain: 0.5, decay: 55, harmonics: [1, 0.2] });
    addNoise(b, { dur: 0.012, gain: 0.25, decay: 200, smooth: 0.6 });
    return finish(b, 0.55);
  },
  // Cell cleared: a quick downward swish.
  erase() {
    const b = buffer(0.14);
    addNoise(b, { dur: 0.13, gain: 0.5, decay: 22, smooth: 0.18 });
    addSweep(b, { from: 520, to: 260, dur: 0.12, gain: 0.25, decay: 24 });
    return finish(b, 0.55);
  },
  // Undo / redo: two short blips stepping back.
  undo() {
    const b = buffer(0.2);
    addTone(b, { freq: 587, start: 0, dur: 0.1, gain: 0.5, decay: 30, harmonics: [1, 0.2] });
    addTone(b, { freq: 440, start: 0.07, dur: 0.12, gain: 0.5, decay: 28, harmonics: [1, 0.2] });
    return finish(b, 0.6);
  },
  // Wrong digit: a dull low buzz.
  error() {
    const b = buffer(0.3);
    addBuzz(b, { freq: 130, dur: 0.28, gain: 0.5, decay: 9 });
    addBuzz(b, { freq: 98, start: 0.0, dur: 0.28, gain: 0.3, decay: 9 });
    return finish(b, 0.7);
  },
  // Row / column / box completed: a rising three-note arpeggio.
  unit() {
    const b = buffer(0.6);
    [C5, E5, G5].forEach((freq, k) => {
      addTone(b, { freq, start: k * 0.075, dur: 0.45, gain: 0.5, decay: 9, harmonics: [1, 0.3, 0.1] });
    });
    addTone(b, { freq: C6, start: 0.225, dur: 0.35, gain: 0.3, decay: 11, harmonics: [1, 0.2] });
    return finish(b, 0.7);
  },
  // Hint shown: a small two-note sparkle.
  hint() {
    const b = buffer(0.5);
    addTone(b, { freq: C6, start: 0, dur: 0.3, gain: 0.45, decay: 12, harmonics: [1, 0.25] });
    addTone(b, { freq: G6, start: 0.09, dur: 0.38, gain: 0.4, decay: 11, harmonics: [1, 0.25] });
    addTone(b, { freq: E6, start: 0.18, dur: 0.3, gain: 0.25, decay: 14, harmonics: [1] });
    return finish(b, 0.6);
  },
  // Puzzle solved: a short fanfare ending on a held major chord.
  win() {
    const b = buffer(1.9);
    [C5, E5, G5, C6].forEach((freq, k) => {
      addTone(b, { freq, start: k * 0.12, dur: 0.4, gain: 0.45, decay: 7, harmonics: [1, 0.35, 0.12] });
    });
    [C5, E5, G5, C6, E6].forEach((freq) => {
      addTone(b, { freq, start: 0.52, dur: 1.35, gain: 0.3, decay: 2.6, harmonics: [1, 0.3, 0.1] });
    });
    addTone(b, { freq: G6, start: 0.7, dur: 1.1, gain: 0.18, decay: 3.2, harmonics: [1] });
    return finish(b, 0.75);
  },
};

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, make] of Object.entries(SOUNDS)) {
  const mp3 = encodeMp3(make());
  writeFileSync(join(OUT_DIR, `${name}.mp3`), mp3);
  console.log(`${name}.mp3  ${(mp3.length / 1024).toFixed(1)} KB`);
}
