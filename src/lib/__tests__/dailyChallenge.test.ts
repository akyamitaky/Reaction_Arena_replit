import { describe, it, expect } from 'vitest';
import { dailyGameId, getDailyStreak, recordDaily, utcDateKey, yesterdayKey } from '@/lib/dailyChallenge';

describe('dailyChallenge dates', () => {
  it('formats a UTC date key', () => {
    expect(utcDateKey(new Date('2026-08-18T12:00:00Z'))).toBe('2026-08-18');
    expect(utcDateKey(new Date('2026-08-18T23:59:00Z'))).toBe('2026-08-18');
  });

  it('computes the previous UTC day', () => {
    expect(yesterdayKey('2026-08-18')).toBe('2026-08-17');
    expect(yesterdayKey('2026-03-01')).toBe('2026-02-28');
  });
});

describe('dailyChallenge game pick', () => {
  it('is deterministic for the same date', () => {
    expect(dailyGameId('2026-08-18')).toBe(dailyGameId('2026-08-18'));
  });

  it('varies across dates and always resolves to a real mode', () => {
    const ids = new Set(['2026-01-01', '2026-05-15', '2026-08-18', '2026-12-31'].map(dailyGameId));
    expect(ids.size).toBeGreaterThan(1);
    for (const id of ids) expect(id.length).toBeGreaterThan(0);
  });

  it('never picks scribble for a solo daily', () => {
    for (let day = 1; day <= 31; day++) {
      const key = `2026-08-${String(day).padStart(2, '0')}`;
      expect(dailyGameId(key)).not.toBe('scribble');
    }
  });
});

describe('dailyChallenge streak', () => {
  it('starts a fresh streak on first play', () => {
    const streak = recordDaily(120, '2026-08-18');
    expect(streak.current).toBe(1);
    expect(streak.bestStreak).toBe(1);
    expect(streak.playedToday).toBe(true);
    expect(streak.lastScore).toBe(120);
    expect(streak.bestScore).toBe(120);
  });

  it('keeps the streak when played again the same day', () => {
    recordDaily(120, '2026-08-18');
    const streak = recordDaily(60, '2026-08-18');
    expect(streak.current).toBe(1);
    expect(streak.bestScore).toBe(120);
  });

  it('extends the streak on a consecutive day', () => {
    recordDaily(120, '2026-08-18');
    const streak = recordDaily(200, '2026-08-19');
    expect(streak.current).toBe(2);
    expect(streak.bestStreak).toBe(2);
  });

  it('resets the streak after a missed day', () => {
    recordDaily(120, '2026-08-18');
    const streak = recordDaily(90, '2026-08-21');
    expect(streak.current).toBe(1);
    expect(streak.bestStreak).toBe(1);
  });

  it('reports unplayed state for a new day', () => {
    recordDaily(120, '2026-08-18');
    const today = getDailyStreak('2026-08-19');
    expect(today.playedToday).toBe(false);
    expect(today.current).toBe(1);
  });
});
