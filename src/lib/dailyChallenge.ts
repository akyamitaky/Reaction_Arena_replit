/**
 * Daily Challenge — the Wordle-style retention hook.
 *
 * One game is chosen deterministically from the date (same game for everyone
 * that day), and each completed daily challenge feeds a consecutive-day
 * streak. Streaks + a shared daily focal point are what bring players back
 * tomorrow.
 */

import { gameModes } from '@/lib/gameConfig';
import { storage } from '@/lib/storage';

const KEYS = {
  current: 'ra-daily-current',
  bestStreak: 'ra-daily-best-streak',
  bestScore: 'ra-daily-best-score',
  lastDate: 'ra-daily-last-date',
  lastScore: 'ra-daily-last-score',
  history: 'ra-daily-history',
  milestones: 'ra-streak-milestones',
} as const;

/** Streak milestones that award a one-time bonus (distinct from achievements). */
export const STREAK_MILESTONES: ReadonlyArray<{ days: number; xp: number; label: string }> = [
  { days: 3, xp: 10, label: '3-day streak' },
  { days: 7, xp: 25, label: '7-day streak' },
  { days: 14, xp: 50, label: '14-day streak' },
  { days: 30, xp: 100, label: '30-day streak' },
];

const MAX_HISTORY = 90;

export function utcDateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function yesterdayKey(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Deterministic 32-bit hash so the same date always picks the same game. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function dailyGameId(dateKey = utcDateKey()): string {
  const pool = gameModes.filter(m => m.id !== 'scribble');
  return pool[hashString(dateKey) % pool.length].id;
}

export interface DailyStreak {
  current: number;
  bestStreak: number;
  playedToday: boolean;
  lastDate: string;
  lastScore: number;
  bestScore: number;
  /** Ascending list of UTC date keys the daily challenge was played on. */
  history: string[];
  /** Milestone day-counts already rewarded (see STREAK_MILESTONES). */
  awardedMilestones: number[];
  /** Milestone day-counts rewarded by the most recent recordDaily call. */
  justAwarded: number[];
}

function readNum(key: string): number {
  const value = Number(localStorage.getItem(key) || 0);
  return Number.isFinite(value) ? value : 0;
}

function readHistory(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEYS.history) || '[]');
    if (!Array.isArray(raw)) return [];
    const days = raw.filter((x): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)).sort();
    return [...new Set(days)];
  } catch {
    return [];
  }
}

function readAwardedMilestones(): number[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEYS.milestones) || '[]');
    return Array.isArray(raw) ? raw.filter((x): x is number => typeof x === 'number') : [];
  } catch {
    return [];
  }
}

export function getDailyStreak(dateKey = utcDateKey()): DailyStreak {
  return {
    current: readNum(KEYS.current),
    bestStreak: readNum(KEYS.bestStreak),
    playedToday: localStorage.getItem(KEYS.lastDate) === dateKey,
    lastDate: localStorage.getItem(KEYS.lastDate) || '',
    lastScore: readNum(KEYS.lastScore),
    bestScore: readNum(KEYS.bestScore),
    history: readHistory(),
    awardedMilestones: readAwardedMilestones(),
    justAwarded: [],
  };
}

/**
 * Records a completed daily challenge. Returns the updated streak plus any
 * milestone bonuses newly awarded (these are also banked as XP).
 */
export function recordDaily(score: number, dateKey = utcDateKey()): DailyStreak {
  const lastDate = localStorage.getItem(KEYS.lastDate);
  const current =
    lastDate === dateKey ? readNum(KEYS.current) : lastDate === yesterdayKey(dateKey) ? readNum(KEYS.current) + 1 : 1;
  localStorage.setItem(KEYS.current, String(current));
  localStorage.setItem(KEYS.bestStreak, String(Math.max(readNum(KEYS.bestStreak), current)));
  localStorage.setItem(KEYS.bestScore, String(Math.max(readNum(KEYS.bestScore), score)));
  localStorage.setItem(KEYS.lastDate, dateKey);
  localStorage.setItem(KEYS.lastScore, String(score));

  const history = readHistory();
  if (!history.includes(dateKey)) {
    history.push(dateKey);
    localStorage.setItem(KEYS.history, JSON.stringify(history.slice(-MAX_HISTORY)));
  }

  const awarded = readAwardedMilestones();
  const justAwarded: number[] = [];
  for (const milestone of STREAK_MILESTONES) {
    if (current === milestone.days && !awarded.includes(milestone.days)) {
      awarded.push(milestone.days);
      storage.addXp(milestone.xp);
      justAwarded.push(milestone.days);
    }
  }
  if (justAwarded.length > 0) {
    localStorage.setItem(KEYS.milestones, JSON.stringify(awarded));
  }

  return { ...getDailyStreak(dateKey), justAwarded };
}
