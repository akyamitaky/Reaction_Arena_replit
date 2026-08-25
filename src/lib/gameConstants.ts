/** Seconds allowed per game in a multiplayer arena. */
export const ARENA_TIME = 15;

/** Maximum number of seconds per round for timed single-player games (0 = reaction based). */
export const MAX_ROUND_SECONDS = 30;

/** Maximum raw score the server accepts for a single arena game. */
export const MAX_ARENA_SCORE = 300;

/** Maximum duration (ms) the server accepts for a single arena game. */
export const MAX_ARENA_TIME_MS = 120_000;

/** Maximum points per round for a solo game score total estimate. */
export const MAX_SOLO_ROUND_SCORE = 150;

/** Typical delay (ms) before advancing to the next round after feedback. */
export const FEEDBACK_DELAY_MS = 800;

/** Delay (ms) for lengthier post-game feedback before advancing. */
export const LONG_FEEDBACK_DELAY_MS = 1200;

/** Standard award for a correct solo answer. */
export const CORRECT_ANSWER_POINTS = 100;
