import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Home, RotateCcw, Flame, Trophy, Zap } from 'lucide-react';
import { getDailyStreak } from '@/lib/dailyChallenge';
import CountUp from '@/components/CountUp';
import Confetti from '@/components/Confetti';
import ShareResultButton from '@/components/ShareResultButton';
import { play } from '@/lib/sound';
import { DAILY_XP, levelProgress } from '@/lib/progress';
import { storage } from '@/lib/storage';

export default function DailyResultsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { score = 0, gameId = '', gameName = '' } = state || {};
  const streak = getDailyStreak();
  const level = levelProgress(storage.getXp());

  useEffect(() => {
    play('win');
  }, []);

  const shareText = [
    `🔥 ReactionArena Daily Challenge — ${score} pts`,
    `I kept a ${streak.current}-day streak alive in ${gameName}.`,
    `Can you match it?`,
  ].join('\n');

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-8">
      {streak.current >= 3 && <Confetti />}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-a/[0.12] via-transparent to-brand-c/[0.12] blur-3xl" />
      <motion.div
        className="relative w-full max-w-md space-y-6 text-center"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
          className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-primary/30 btn-primary-gradient"
        >
          <Flame className="h-10 w-10 text-primary-foreground" />
        </motion.div>

        <div>
          <p className="text-sm text-muted-foreground">Daily Challenge Complete!</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">
            <span className="text-gradient">{streak.current}-day streak!</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{gameName}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-7 backdrop-blur-md">
          <p className="font-display text-6xl font-bold tracking-tight text-primary tabular-nums">
            <CountUp value={score} />
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">points today</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/60 bg-secondary/40 px-3 py-3">
              <p className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                <Flame className="h-3.5 w-3.5 text-chart-4" /> Current
              </p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums">{streak.current}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-secondary/40 px-3 py-3">
              <p className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                <Trophy className="h-3.5 w-3.5 text-chart-2" /> Best
              </p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums">{streak.bestStreak}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-secondary/40 px-4 py-2.5">
            <span className="flex items-center gap-1.5 text-sm font-bold text-primary">
              <Zap className="h-4 w-4 text-chart-4" /> +{DAILY_XP} XP
            </span>
            <span className="h-3 w-px bg-border/70" />
            <span className="text-xs font-medium text-muted-foreground">
              Level {level.level} · {level.title}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <ShareResultButton text={shareText} label="Share your streak" />
          <Button
            variant="secondary"
            className="w-full gap-2"
            size="lg"
            onClick={() => navigate(`/play/${gameId}?daily=1`)}
          >
            <RotateCcw className="h-4 w-4" /> Play again
          </Button>
          <Button variant="ghost" className="w-full gap-2" size="lg" onClick={() => navigate('/')}>
            <Home className="h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
