import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Trophy, Target, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { storage, type RunRecord } from '@/lib/storage';
import { getGameMode, type GameMode } from '@/lib/gameConfig';
import { gradeForPct, levelProgress } from '@/lib/progress';
import TrendChart from '@/components/TrendChart';
import { cn } from '@/lib/utils';

function shortLabel(run: RunRecord): string {
  const mode = getGameMode(run.gameId);
  return mode ? mode.label.slice(0, 3) : run.gameId.slice(0, 3);
}

function lastRuns(count: number): RunRecord[] {
  return storage.getRunHistory().slice(-count);
}

export default function StatsPage() {
  const navigate = useNavigate();
  const history = useMemo(() => lastRuns(20), []);
  const bestScores = useMemo(() => storage.getBestScores(), []);
  const stats = storage.getStats();
  const level = levelProgress(stats.xp);

  const scoreData = history.map((r, i) => ({
    label: i === 0 || i === history.length - 1 ? shortLabel(r) : '',
    value: r.score,
  }));
  const pctData = history.map((r, i) => ({
    label: i === 0 || i === history.length - 1 ? shortLabel(r) : '',
    value: r.pct,
  }));

  const avgScore = history.length > 0 ? Math.round(history.reduce((s, r) => s + r.score, 0) / history.length) : 0;
  const avgPct = history.length > 0 ? Math.round(history.reduce((s, r) => s + r.pct, 0) / history.length) : 0;
  const bestRun = history.reduce<RunRecord | null>((best, r) => (best && best.score >= r.score ? best : r), null);

  const ranked = useMemo(() => {
    const entries: { gameId: string; score: number; mode: GameMode }[] = [];
    for (const [gameId, score] of Object.entries(bestScores)) {
      const mode = getGameMode(gameId);
      if (mode) entries.push({ gameId, score, mode });
    }
    return entries.sort((a, b) => b.score - a.score);
  }, [bestScores]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 flex items-center gap-4"
      >
        <Button variant="outline" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Your performance</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">Personal stats</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Based on your last {history.length} solo runs · Level {level.level} · {stats.xp.toLocaleString()} XP
          </p>
        </div>
      </motion.div>

      {history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/70 py-16 text-center backdrop-blur-md"
        >
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
          <p className="font-display text-lg font-bold">No runs yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Play a few solo games and your score and mastery trends will show up here.
          </p>
          <Button onClick={() => navigate('/select')}>Browse games</Button>
        </motion.div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-md"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <Activity className="h-4 w-4 text-primary" /> Score trend
              </div>
              <div className="mt-3">
                <TrendChart data={scoreData} color="text-primary" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-md"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <Target className="h-4 w-4 text-chart-3" /> Mastery trend
              </div>
              <div className="mt-3">
                <TrendChart data={pctData} color="text-chart-3" unit="%" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-md"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <Trophy className="h-4 w-4 text-chart-2" /> Summary
              </div>
              <div className="mt-3 space-y-3">
                <SummaryRow label="Average score" value={avgScore.toLocaleString()} />
                <SummaryRow label="Average mastery" value={`${avgPct}%`} />
                <SummaryRow label="Best grade" value={bestRun ? gradeForPct(bestRun.pct) : '—'} />
                <SummaryRow label="Total games" value={stats.gamesPlayed.toLocaleString()} />
              </div>
            </motion.div>
          </div>

          <section className="pb-6">
            <div className="mb-4 mt-8 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-secondary/60">
                <Trophy className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight">Per-mode bests</h2>
                <p className="text-xs text-muted-foreground">Your highest score in each game</p>
              </div>
            </div>
            {ranked.length === 0 ? (
              <p className="rounded-2xl border border-border/60 bg-card/70 p-6 text-sm text-muted-foreground">
                No bests recorded yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {ranked.map((entry, i) => (
                  <motion.div
                    key={entry.gameId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * Math.min(i, 8) }}
                    className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 backdrop-blur-md"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-secondary/50">
                      <entry.mode.icon className={cn('h-4 w-4', entry.mode.color)} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{entry.mode.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {gradeForPct(
                          Math.min(100, (entry.score / (entry.mode.rounds > 0 ? entry.mode.rounds * 150 : 150)) * 100),
                        )}
                      </p>
                    </div>
                    <span className="font-display text-sm font-bold tabular-nums text-primary">
                      {entry.score.toLocaleString()}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-2 text-sm last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-display font-bold tabular-nums text-foreground">{value}</span>
    </div>
  );
}
