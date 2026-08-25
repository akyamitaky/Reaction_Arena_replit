/**
 * Daily Challenge — the Wordle-style retention hook.
 *
 * One game is chosen deterministically from the date (same game for everyone
 * that day), and each completed daily challenge feeds a consecutive-day
 * streak. Streaks + a shared daily focal point are what bring players back
 * tomorrow.
 */

import { gameModes } from '@/lib/gameConfig';

const KEYS = {
  current: 'ra-daily-current',
  bestStreak: 'ra-daily-best-streak',
  bestScore: 'ra-daily-best-score',
  lastDate: 'ra-daily-last-date',
  lastScore: 'ra-daily-last-score',
} as const;

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
}

function readNum(key: string): number {
  const value = Number(localStorage.getItem(key) || 0);
  return Number.isFinite(value) ? value : 0;
}

export function getDailyStreak(dateKey = utcDateKey()): DailyStreak {
  return {
    current: readNum(KEYS.current),
    bestStreak: readNum(KEYS.bestStreak),
    playedToday: localStorage.getItem(KEYS.lastDate) === dateKey,
    lastDate: localStorage.getItem(KEYS.lastDate) || '',
    lastScore: readNum(KEYS.lastScore),
    bestScore: readNum(KEYS.bestScore),
  };
}

export function recordDaily(score: number, dateKey = utcDateKey()): DailyStreak {
  const lastDate = localStorage.getItem(KEYS.lastDate);
  const current =
    lastDate === dateKey ? readNum(KEYS.current) : lastDate === yesterdayKey(dateKey) ? readNum(KEYS.current) + 1 : 1;
  localStorage.setItem(KEYS.current, String(current));
  localStorage.setItem(KEYS.bestStreak, String(Math.max(readNum(KEYS.bestStreak), current)));
  localStorage.setItem(KEYS.bestScore, String(Math.max(readNum(KEYS.bestScore), score)));
  localStorage.setItem(KEYS.lastDate, dateKey);
  localStorage.setItem(KEYS.lastScore, String(score));
  return getDailyStreak(dateKey);
}
