import { motion } from 'framer-motion';
import { CalendarRange, Trophy, Flame, Target } from 'lucide-react';
import { storage } from '@/lib/storage';
import { buildRecap } from '@/lib/recap';
import { gradeForPct } from '@/lib/progress';
import { getGameMode } from '@/lib/gameConfig';

export default function WeeklyRecap() {
  const recap = buildRecap(storage.getRunHistory(), new Date());
  const bestMode = recap.bestRun ? getGameMode(recap.bestRun.gameId) : null;
  const favoriteMode = recap.favoriteGameId ? getGameMode(recap.favoriteGameId) : null;

  if (recap.runsThisWeek === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.12 }}
      className="pb-10"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-secondary/60">
          <CalendarRange className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">This week</h2>
          <p className="text-xs text-muted-foreground">Your moment recap</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Trophy className="h-4 w-4 text-chart-2" /> Best run
          </div>
          <p className="mt-3 font-display text-2xl font-bold tabular-nums text-primary">
            {recap.bestRun ? recap.bestRun.score.toLocaleString() : 0}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {recap.bestRun ? (
              <>
                {bestMode?.label || recap.bestRun.gameId} · {gradeForPct(recap.bestRun.pct)}
              </>
            ) : (
              'No runs yet'
            )}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Flame className="h-4 w-4 text-chart-4" /> Active days
          </div>
          <p className="mt-3 font-display text-2xl font-bold tabular-nums text-primary">{recap.daysActive}</p>
          <p className="mt-1 text-sm text-muted-foreground">{recap.runsThisWeek} total runs this week</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Target className="h-4 w-4 text-chart-3" /> Favorite mode
          </div>
          <p className="mt-3 font-display text-2xl font-bold tracking-tight text-primary">
            {favoriteMode?.label || '—'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {favoriteMode ? `Your go-to this week` : 'Keep exploring'}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
