import { describe, it, expect } from 'vitest';
import { buildRecap, weekStartUtc, type RunRecord } from '@/lib/recap';

function run(gameId: string, score: number, pct: number, iso: string): RunRecord {
  return { gameId, score, pct, at: iso };
}

describe('recap', () => {
  const wednesday = new Date('2026-08-19T15:00:00Z'); // a Wednesday

  it('finds the Monday start of the week in UTC', () => {
    const start = weekStartUtc(wednesday);
    expect(start.toISOString()).toBe('2026-08-17T00:00:00.000Z');
  });

  it('treats Sunday as part of the previous week', () => {
    const sunday = new Date('2026-08-23T10:00:00Z');
    const start = weekStartUtc(sunday);
    expect(start.toISOString()).toBe('2026-08-17T00:00:00.000Z');
  });

  it('returns an empty recap when there are no runs this week', () => {
    const history = [run('math', 100, 80, '2026-08-10T10:00:00.000Z')];
    const recap = buildRecap(history, wednesday);
    expect(recap.runsThisWeek).toBe(0);
    expect(recap.bestRun).toBeNull();
    expect(recap.daysActive).toBe(0);
  });

  it('highlights the best run and favorite mode of the week', () => {
    const history = [
      run('math', 120, 80, '2026-08-18T09:00:00.000Z'),
      run('reflex', 150, 100, '2026-08-18T19:00:00.000Z'),
      run('math', 90, 60, '2026-08-19T08:00:00.000Z'),
      run('memory', 80, 50, '2026-08-10T08:00:00.000Z'),
    ];
    const recap = buildRecap(history, wednesday);
    expect(recap.runsThisWeek).toBe(3);
    expect(recap.daysActive).toBe(2);
    expect(recap.bestRun?.gameId).toBe('reflex');
    expect(recap.bestRun?.score).toBe(150);
    expect(recap.favoriteGameId).toBe('math');
  });
});
