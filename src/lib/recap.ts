export interface RunRecord {
  gameId: string;
  score: number;
  pct: number;
  at: string;
}

export interface Recap {
  runsThisWeek: number;
  daysActive: number;
  bestRun: RunRecord | null;
  favoriteGameId: string | null;
}

/** Monday 00:00:00 UTC of the week containing `now`. */
export function weekStartUtc(now: Date): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay();
  const back = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - back);
  return d;
}

export function thisWeekRuns(history: RunRecord[], now: Date): RunRecord[] {
  const start = weekStartUtc(now).getTime();
  return history.filter(r => new Date(r.at).getTime() >= start);
}

export function buildRecap(history: RunRecord[], now: Date): Recap {
  const runs = thisWeekRuns(history, now);
  if (runs.length === 0) {
    return { runsThisWeek: 0, daysActive: 0, bestRun: null, favoriteGameId: null };
  }

  const bestRun = runs.reduce((best, r) => (r.score > best.score ? r : best), runs[0]);

  const days = new Set(runs.map(r => r.at.slice(0, 10)));
  const counts = new Map<string, number>();
  for (const r of runs) {
    counts.set(r.gameId, (counts.get(r.gameId) || 0) + 1);
  }
  let favoriteGameId: string | null = null;
  let favoriteCount = 0;
  for (const [id, count] of counts) {
    if (count > favoriteCount) {
      favoriteGameId = id;
      favoriteCount = count;
    }
  }

  return { runsThisWeek: runs.length, daysActive: days.size, bestRun, favoriteGameId };
}
