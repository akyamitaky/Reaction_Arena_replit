import { gameModes } from './gameConfig';
import { storage } from './storage';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  /** Icon name resolved by the UI layer. */
  icon: string;
  xp: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_blood', title: 'First Blood', description: 'Play your first game', icon: 'zap', xp: 20 },
  { id: 'ten_games', title: 'Getting Warm', description: 'Play 10 games', icon: 'gamepad', xp: 30 },
  { id: 'fifty_games', title: 'Fifty Strong', description: 'Play 50 games', icon: 'flame', xp: 50 },
  { id: 'hundred_games', title: 'Centurion', description: 'Play 100 games', icon: 'trophy', xp: 100 },
  { id: 'score_500', title: '500 Club', description: 'Score 500+ in a single game', icon: 'star', xp: 30 },
  { id: 'score_1000', title: 'Four-Figure Freak', description: 'Score 1000+ in a single game', icon: 'star', xp: 60 },
  {
    id: 'mode_master_5',
    title: 'Mode Master',
    description: 'Reach 90% mastery in 5 different modes',
    icon: 'target',
    xp: 80,
  },
  {
    id: 'mode_master_all',
    title: 'Complete Athlete',
    description: 'Reach 90% mastery in every mode',
    icon: 'target',
    xp: 200,
  },
  { id: 'combo_10', title: 'On Fire', description: 'Build a 10-hit combo in one game', icon: 'flame', xp: 40 },
  { id: 'combo_20', title: 'Unstoppable', description: 'Build a 20-hit combo in one game', icon: 'flame', xp: 80 },
  { id: 'arena_first', title: 'Into the Fray', description: 'Compete in your first arena', icon: 'swords', xp: 20 },
  { id: 'arena_win', title: 'Arena Victor', description: 'Win an arena', icon: 'crown', xp: 50 },
  { id: 'arena_win_10', title: 'Arena Legend', description: 'Win 10 arenas', icon: 'crown', xp: 100 },
  { id: 'daily_3', title: 'Streak Seeker', description: 'Keep a 3-day daily streak', icon: 'calendar', xp: 30 },
  { id: 'daily_7', title: 'Habit Maker', description: 'Keep a 7-day daily streak', icon: 'calendar', xp: 70 },
  { id: 'daily_30', title: 'Iron Discipline', description: 'Keep a 30-day daily streak', icon: 'calendar', xp: 150 },
  { id: 'xp_1000', title: '1000 XP', description: 'Earn 1000 total XP', icon: 'trophy', xp: 40 },
  { id: 'xp_5000', title: '5000 XP', description: 'Earn 5000 total XP', icon: 'trophy', xp: 100 },
  {
    id: 'week_warrior',
    title: 'Weekly Warrior',
    description: 'Play on 3 days in a single week',
    icon: 'calendar',
    xp: 40,
  },
  {
    id: 'challenger',
    title: 'Trendsetter',
    description: 'Send your first challenge to a friend',
    icon: 'link',
    xp: 30,
  },
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));

export interface AchievementState {
  gamesPlayed: number;
  arenasPlayed: number;
  arenaWins: number;
  xp: number;
  bestScore: number;
  /** gameId -> best score for that mode. */
  bestScores: Record<string, number>;
  dailyBestStreak: number;
  maxCombo: number;
  /** Distinct active days within the current ISO week. */
  daysActiveThisWeek: number;
  everChallenged: boolean;
}

function modesMastered(bestScores: Record<string, number>): number {
  let count = 0;
  for (const mode of gameModes) {
    if (mode.rounds <= 0) continue;
    const max = mode.rounds * 150;
    const best = bestScores[mode.id] || 0;
    if (best >= max * 0.9) count += 1;
  }
  return count;
}

/** Returns every achievement satisfied by the given state. */
export function evaluateAchievements(state: AchievementState): AchievementDef[] {
  const satisfied: AchievementDef[] = [];
  const masters = modesMastered(state.bestScores);
  const conditions: [string, boolean][] = [
    ['first_blood', state.gamesPlayed >= 1],
    ['ten_games', state.gamesPlayed >= 10],
    ['fifty_games', state.gamesPlayed >= 50],
    ['hundred_games', state.gamesPlayed >= 100],
    ['score_500', state.bestScore >= 500],
    ['score_1000', state.bestScore >= 1000],
    ['mode_master_5', masters >= 5],
    ['mode_master_all', masters >= gameModes.filter(m => m.rounds > 0).length],
    ['combo_10', state.maxCombo >= 10],
    ['combo_20', state.maxCombo >= 20],
    ['arena_first', state.arenasPlayed >= 1],
    ['arena_win', state.arenaWins >= 1],
    ['arena_win_10', state.arenaWins >= 10],
    ['daily_3', state.dailyBestStreak >= 3],
    ['daily_7', state.dailyBestStreak >= 7],
    ['daily_30', state.dailyBestStreak >= 30],
    ['xp_1000', state.xp >= 1000],
    ['xp_5000', state.xp >= 5000],
    ['week_warrior', state.daysActiveThisWeek >= 3],
    ['challenger', state.everChallenged],
  ];

  for (const [id, ok] of conditions) {
    if (ok && ACHIEVEMENT_BY_ID[id]) satisfied.push(ACHIEVEMENT_BY_ID[id]);
  }
  return satisfied;
}

export function xpForAchievements(defs: AchievementDef[]): number {
  return defs.reduce((sum, a) => sum + a.xp, 0);
}

// ---------------------------------------------------------------------------
// Client-side unlock store
// ---------------------------------------------------------------------------

const UNLOCKED_KEY = 'ra-achievements';

export function getUnlockedAchievementIds(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(UNLOCKED_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function getUnlockedAchievements(): AchievementDef[] {
  return getUnlockedAchievementIds()
    .map(id => ACHIEVEMENT_BY_ID[id])
    .filter((a): a is AchievementDef => Boolean(a));
}

function saveUnlockedAchievementIds(ids: string[]) {
  localStorage.setItem(UNLOCKED_KEY, JSON.stringify([...new Set(ids)]));
}

/**
 * Returns achievements that became newly satisfied (not yet unlocked),
 * persisting them so they only celebrate once.
 */
export function claimNewAchievements(state: AchievementState): AchievementDef[] {
  const unlocked = new Set(getUnlockedAchievementIds());
  const newly = evaluateAchievements(state).filter(a => !unlocked.has(a.id));
  if (newly.length > 0) {
    saveUnlockedAchievementIds([...unlocked, ...newly.map(a => a.id)]);
  }
  return newly;
}

/** True when the player has unlocked any achievement. */
export function hasUnlockedAchievements(): boolean {
  return getUnlockedAchievementIds().length > 0;
}

// ---------------------------------------------------------------------------
// Active-day tracking (drives daily-streak and weekly achievements)
// ---------------------------------------------------------------------------

/** ISO week key matching PostgreSQL's to_char(now(), 'IYYY-IW'), e.g. "2026-34". */
export function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7;
  return `${date.getUTCFullYear()}-${String(Math.ceil(week)).padStart(2, '0')}`;
}

export interface ActiveDayInfo {
  activeDays: number;
  daysActiveThisWeek: number;
  dailyBestStreak: number;
}

/** Derives streak/week activity purely from run timestamps (ISO strings). */
export function activeDayInfoFromRuns(runs: { at: string }[]): ActiveDayInfo {
  const days = [...new Set(runs.map(r => r.at.slice(0, 10)))].sort();
  const currentWeek = isoWeekKey(new Date());
  const weekDays = days.filter(d => isoWeekKey(new Date(`${d}T00:00:00`)) === currentWeek);

  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const day of days) {
    const ms = new Date(`${day}T00:00:00`).getTime();
    if (prev !== null && ms - prev === 86400000) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = ms;
  }

  return { activeDays: days.length, daysActiveThisWeek: weekDays.length, dailyBestStreak: best };
}

const EVER_CHALLENGED_KEY = 'ra-ever-challenged';

export function markEverChallenged() {
  localStorage.setItem(EVER_CHALLENGED_KEY, '1');
}

export function hasEverChallenged(): boolean {
  return localStorage.getItem(EVER_CHALLENGED_KEY) === '1';
}

/** Builds the achievement state from local storage so the UI can evaluate once. */
export function achievementStateFromStorage(): AchievementState {
  const stats = storage.getStats();
  const runs = storage.getRunHistory();
  const dayInfo = activeDayInfoFromRuns(runs);
  return {
    gamesPlayed: stats.gamesPlayed,
    arenasPlayed: stats.arenasPlayed,
    arenaWins: stats.arenaWins,
    xp: stats.xp,
    bestScore: stats.bestScore,
    bestScores: storage.getBestScores(),
    dailyBestStreak: dayInfo.dailyBestStreak,
    maxCombo: storage.getMaxCombo(),
    daysActiveThisWeek: dayInfo.daysActiveThisWeek,
    everChallenged: hasEverChallenged(),
  };
}
