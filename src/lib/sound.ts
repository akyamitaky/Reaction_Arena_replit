/**
 * Lightweight Web Audio sound engine + haptic feedback.
 *
 * No audio assets: everything is synthesized with oscillators and gain
 * envelopes. The AudioContext is created lazily on first play so it always
 * happens inside a user gesture. Sound + haptics share a single persisted
 * mute toggle.
 */

const SOUND_KEY = 'reaction-sound-enabled';

export type SoundName = 'click' | 'correct' | 'wrong' | 'start' | 'tick' | 'win' | 'fanfare' | 'levelup';

let ctx: AudioContext | null = null;
let lastCorrectAt = 0;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(SOUND_KEY);
  return stored === null ? true : stored === '1';
}

export function setSoundEnabled(enabled: boolean) {
  localStorage.setItem(SOUND_KEY, enabled ? '1' : '0');
}

export function haptic(pattern: number | number[]) {
  if (!isSoundEnabled()) return;
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // vibration is best-effort
  }
}

function tone(freq: number, durationMs: number, opts: { type?: OscillatorType; gain?: number; when?: number } = {}) {
  const context = getContext();
  if (!context || !isSoundEnabled()) return;
  const { type = 'sine', gain = 0.12, when = 0 } = opts;
  const t0 = context.currentTime + when;
  const osc = context.createOscillator();
  const env = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(gain, t0 + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + durationMs / 1000);
  osc.connect(env);
  env.connect(context.destination);
  osc.start(t0);
  osc.stop(t0 + durationMs / 1000 + 0.02);
}

const HAPTICS: Partial<Record<SoundName, number[]>> = {
  correct: [15],
  wrong: [40, 60, 40],
  win: [50, 60, 80],
  fanfare: [50, 50, 80, 120],
  levelup: [30, 40, 60],
};

const PATTERNS: Record<SoundName, () => void> = {
  click: () => tone(620, 60, { gain: 0.08 }),
  correct: () => {
    tone(523.25, 120);
    tone(659.25, 120, { when: 0.09 });
    tone(783.99, 180, { when: 0.18 });
  },
  wrong: () => tone(180, 220, { type: 'sawtooth', gain: 0.1 }),
  start: () => {
    tone(392, 140);
    tone(523.25, 140, { when: 0.12 });
    tone(659.25, 220, { when: 0.24 });
  },
  tick: () => tone(950, 45, { gain: 0.07 }),
  win: () => {
    tone(523.25, 150);
    tone(659.25, 150, { when: 0.15 });
    tone(783.99, 150, { when: 0.3 });
    tone(1046.5, 350, { when: 0.45 });
  },
  fanfare: () => {
    tone(392, 120);
    tone(523.25, 120, { when: 0.1 });
    tone(659.25, 120, { when: 0.2 });
    tone(783.99, 300, { when: 0.3 });
    tone(783.99, 120, { when: 0.5 });
    tone(1046.5, 350, { when: 0.6 });
  },
  levelup: () => {
    tone(659.25, 100);
    tone(830.61, 100, { when: 0.09 });
    tone(987.77, 260, { when: 0.18 });
  },
};

export function play(name: SoundName) {
  if (!isSoundEnabled()) return;
  try {
    PATTERNS[name]();
  } catch {
    // audio failures are non-fatal
  }
  const h = HAPTICS[name];
  if (h) haptic(h);
}

/**
 * Correct-answer blip, debounced so multi-point games (memory tiles, whacks)
 * don't machine-gun the speaker.
 */
export function playCorrect() {
  const now = Date.now();
  if (now - lastCorrectAt < 140) return;
  lastCorrectAt = now;
  play('correct');
}

export function resetSoundForTests() {
  ctx = null;
  lastCorrectAt = 0;
}
