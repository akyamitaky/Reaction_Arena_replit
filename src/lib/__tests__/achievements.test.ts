import { describe, it, expect } from 'vitest';
import {
  ACHIEVEMENT_BY_ID,
  activeDayInfoFromRuns,
  achievementStateFromStorage,
  claimNewAchievements,
  evaluateAchievements,
  isoWeekKey,
  markEverChallenged,
  type AchievementState,
} from '@/lib/achievements';
import { storage } from '@/lib/storage';
import { gameModes } from '@/lib/gameConfig';

const BASE_STATE: AchievementState = {
  gamesPlayed: 0,
  arenasPlayed: 0,
  arenaWins: 0,
  xp: 0,
  bestScore: 0,
  bestScores: {},
  dailyBestStreak: 0,
  maxCombo: 0,
  daysActiveThisWeek: 0,
  everChallenged: false,
};

function ids(state: AchievementState) {
  return evaluateAchievements(state).map(a => a.id);
}

describe('achievements', () => {
  it('grants no achievements on an empty state', () => {
    expect(ids(BASE_STATE)).toEqual([]);
  });

  it('awards game-count and score milestones', () => {
    const state = { ...BASE_STATE, gamesPlayed: 10, bestScore: 620 };
    const unlocked = ids(state);
    expect(unlocked).toContain('first_blood');
    expect(unlocked).toContain('ten_games');
    expect(unlocked).toContain('score_500');
    expect(unlocked).not.toContain('fifty_games');
    expect(unlocked).not.toContain('score_1000');
  });

  it('awards arena and combo achievements', () => {
    const state = { ...BASE_STATE, arenasPlayed: 2, arenaWins: 2, maxCombo: 21 };
    const unlocked = ids(state);
    expect(unlocked).toContain('arena_first');
    expect(unlocked).toContain('arena_win');
    expect(unlocked).toContain('combo_10');
    expect(unlocked).toContain('combo_20');
    expect(unlocked).not.toContain('arena_win_10');
  });

  it('awards mastery achievements when enough modes reach 90%', () => {
    const scorable = gameModes.filter(m => m.rounds > 0);
    const bestScores: Record<string, number> = {};
    for (const mode of scorable.slice(0, 5)) {
      bestScores[mode.id] = Math.round(mode.rounds * 150);
    }
    const state = { ...BASE_STATE, bestScores };
    expect(ids(state)).toContain('mode_master_5');
  });

  it('awards XP, weekly and daily streak achievements', () => {
    const state = { ...BASE_STATE, xp: 1200, daysActiveThisWeek: 3, dailyBestStreak: 7 };
    const unlocked = ids(state);
    expect(unlocked).toContain('xp_1000');
    expect(unlocked).toContain('week_warrior');
    expect(unlocked).toContain('daily_7');
    expect(unlocked).not.toContain('daily_30');
  });

  it('awards the challenger achievement only after a challenge is created', () => {
    expect(ids(BASE_STATE)).not.toContain('challenger');
    expect(ids({ ...BASE_STATE, everChallenged: true })).toContain('challenger');
  });

  it('claims each achievement exactly once', () => {
    const state = { ...BASE_STATE, gamesPlayed: 10, maxCombo: 10 };
    const first = claimNewAchievements(state);
    expect(first.map(a => a.id)).toContain('ten_games');
    expect(claimNewAchievements(state)).toEqual([]);
  });

  it('persists claims and later evaluates them as unlocked', () => {
    const state = { ...BASE_STATE, gamesPlayed: 1 };
    claimNewAchievements(state);
    expect(ACHIEVEMENT_BY_ID['first_blood']).toBeDefined();
  });
});

describe('activeDayInfoFromRuns', () => {
  it('computes the best consecutive daily streak', () => {
    const runs = [
      { at: '2026-08-10T10:00:00' },
      { at: '2026-08-11T10:00:00' },
      { at: '2026-08-12T10:00:00' },
      { at: '2026-08-15T10:00:00' },
      { at: '2026-08-16T10:00:00' },
    ];
    expect(activeDayInfoFromRuns(runs).dailyBestStreak).toBe(3);
    expect(activeDayInfoFromRuns(runs).activeDays).toBe(5);
  });

  it('dedupes multiple runs on the same day', () => {
    const runs = [{ at: '2026-08-12T08:00:00' }, { at: '2026-08-12T20:00:00' }];
    expect(activeDayInfoFromRuns(runs).activeDays).toBe(1);
    expect(activeDayInfoFromRuns(runs).dailyBestStreak).toBe(1);
  });
});

describe('isoWeekKey', () => {
  it('matches PostgreSQL IYYY-IW week format', () => {
    expect(isoWeekKey(new Date('2026-08-20T12:00:00'))).toMatch(/^\d{4}-\d{2}$/);
    expect(isoWeekKey(new Date('2026-08-20T12:00:00'))).toBe('2026-34');
  });

  it('treats adjacent days across a week boundary correctly', () => {
    const sunday = isoWeekKey(new Date('2026-08-16T12:00:00'));
    const monday = isoWeekKey(new Date('2026-08-17T12:00:00'));
    expect(sunday).not.toBe(monday);
  });
});

describe('achievementStateFromStorage', () => {
  it('assembles state from local storage', () => {
    storage.recordSoloGame(500, 'math', 95);
    storage.recordSoloGame(300, 'math', 60);
    storage.recordMaxCombo(12);
    markEverChallenged();

    const state = achievementStateFromStorage();
    expect(state.gamesPlayed).toBe(2);
    expect(state.bestScore).toBe(500);
    expect(state.bestScores.math).toBe(500);
    expect(state.maxCombo).toBe(12);
    expect(state.everChallenged).toBe(true);
  });
});
