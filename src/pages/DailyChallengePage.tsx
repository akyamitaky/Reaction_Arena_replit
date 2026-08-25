import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Flame, Zap, CalendarDays, Check, Trophy } from 'lucide-react';
import { dailyGameId, getDailyStreak, utcDateKey } from '@/lib/dailyChallenge';
import { getGameMode } from '@/lib/gameConfig';
import CountUp from '@/components/CountUp';

export default function DailyChallengePage() {
  const navigate = useNavigate();
  const dateKey = utcDateKey();
  const gameId = dailyGameId(dateKey);
  const mode = getGameMode(gameId);
  const streak = getDailyStreak(dateKey);

  const play = () => navigate(`/play/${gameId}?daily=1`);

  if (!mode) {
    navigate('/');
    return null;
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-a/[0.12] via-transparent to-brand-c/[0.12] blur-3xl" />
      <motion.div
        className="relative w-full max-w-md space-y-6 text-center"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.08] px-4 py-1.5 text-xs font-semibold text-primary">
          <CalendarDays className="h-3.5 w-3.5" /> Daily Challenge
        </div>

        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">
            One game. <span className="text-gradient">Every day.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
            Everyone plays the same game today. Come back tomorrow to keep your streak alive.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.12] to-transparent px-5 py-3 backdrop-blur-md">
            <Flame className="h-6 w-6 text-chart-4" />
            <div className="text-left">
              <p className="font-display text-2xl font-bold leading-none tabular-nums">
                <CountUp value={streak.current} />
              </p>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">day streak</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-5 py-3 backdrop-blur-md">
            <Trophy className="h-6 w-6 text-chart-2" />
            <div className="text-left">
              <p className="font-display text-2xl font-bold leading-none tabular-nums">
                <CountUp value={streak.bestScore} />
              </p>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">best score</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-7 backdrop-blur-md">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-c/10 blur-2xl" />
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-border/70 bg-secondary/60">
            <mode.icon className={`h-8 w-8 ${mode.color}`} />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">{mode.label}</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{mode.description}</p>
        </div>

        {streak.playedToday ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 rounded-xl border border-chart-1/25 bg-chart-1/10 px-4 py-3 text-sm font-semibold text-chart-1">
              <Check className="h-4 w-4" /> Completed today — {streak.lastScore} pts
            </div>
            <Button variant="outline" className="w-full gap-2" size="lg" onClick={play}>
              <Zap className="h-4 w-4" /> Play again
            </Button>
          </div>
        ) : (
          <Button size="lg" className="w-full gap-2 px-8 text-lg" onClick={play}>
            <Zap className="h-5 w-5" /> Start today's challenge
          </Button>
        )}
      </motion.div>
    </div>
  );
}
