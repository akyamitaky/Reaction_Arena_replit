import { describe, it, expect, beforeEach } from 'vitest';
import { isSoundEnabled, play, playCorrect, resetSoundForTests, setSoundEnabled } from '@/lib/sound';

describe('sound engine', () => {
  beforeEach(() => {
    localStorage.clear();
    resetSoundForTests();
  });

  it('is enabled by default and persists the toggle', () => {
    expect(isSoundEnabled()).toBe(true);
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
  });

  it('does not throw when the AudioContext is unavailable', () => {
    // jsdom has no AudioContext — every pattern must degrade to a no-op.
    expect(() => play('fanfare')).not.toThrow();
    expect(() => play('wrong')).not.toThrow();
    expect(() => playCorrect()).not.toThrow();
  });

  it('debounces rapid correct-answer blips without throwing', () => {
    expect(() => {
      playCorrect();
      playCorrect();
      playCorrect();
    }).not.toThrow();
  });
});
