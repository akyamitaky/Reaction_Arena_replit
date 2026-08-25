import { describe, it, expect } from 'vitest';
import {
  ARENA_TIME,
  MAX_ARENA_SCORE,
  MAX_ARENA_TIME_MS,
  FEEDBACK_DELAY_MS,
  LONG_FEEDBACK_DELAY_MS,
  CORRECT_ANSWER_POINTS,
} from '@/lib/gameConstants';

describe('gameConstants', () => {
  it('defines a 15 second arena round', () => {
    expect(ARENA_TIME).toBe(15);
  });

  it('keeps arena score bounds aligned with the server contract', () => {
    expect(MAX_ARENA_SCORE).toBe(300);
    expect(MAX_ARENA_TIME_MS).toBe(120_000);
  });

  it('orders feedback delays so the long variant wins', () => {
    expect(LONG_FEEDBACK_DELAY_MS).toBeGreaterThan(FEEDBACK_DELAY_MS);
  });

  it('awards the standard correct-answer points', () => {
    expect(CORRECT_ANSWER_POINTS).toBe(100);
  });
});
