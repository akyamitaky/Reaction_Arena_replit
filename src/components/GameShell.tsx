import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Clock, Zap, Flame } from 'lucide-react';
import { GameMode } from '@/lib/gameConfig';
import { ARENA_TIME } from '@/lib/gameConstants';
import { comboMultiplier, comboLabel } from '@/lib/progress';
import { storage } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { play, playCorrect } from '@/lib/sound';
import SoundToggle from '@/components/SoundToggle';
import { track } from '@/lib/analytics';

interface Props {
  mode: GameMode;
  onComplete?: (score: number, timeTakenMs: number) => void;
  /** Marks a timed 1-round arena round. Defaults to `onComplete` being set. */
  arena?: boolean;
  arenaProgress?: { current: number; total: number; totalScore: number };
  children: (ctx: GameContext) => React.ReactNode;
}

export interface GameContext {
  round: number;
  score: number;
  timeLeft: number;
  /** Current combo streak (consecutive correct answers). */
  combo: number;
  /** Highest combo reached in this session. */
  maxCombo: number;
  addScore: (points: number) => void;
  /** Reset the combo after a wrong answer. */
  reportWrong: () => void;
  nextRound: () => void;
  endGame: () => void;
}

export default function GameShell({ mode, onComplete, arena, arenaProgress, children }: Props) {
  const navigate = useNavigate();
  const isArena = arena ?? !!onComplete;

  const effectiveRounds = isArena ? 1 : mode.rounds;
  const effectiveTime = isArena ? ARENA_TIME : mode.timePerRound;

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(effectiveTime);
  const [started, setStarted] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  const scoreRef = useRef(score);
  scoreRef.current = score;
  const roundRef = useRef(round);
  roundRef.current = round;
  const comboRef = useRef(combo);
  comboRef.current = combo;
  const maxComboRef = useRef(maxCombo);
  maxComboRef.current = maxCombo;
  const startTimeRef = useRef<number>(0);
  const doneRef = useRef(false);

  // Guards against a round being advanced twice when the per-round clock and
  // a game's own setTimeout(nextRound) fire in the same window. The lock is
  // released whenever the round actually changes.
  const advanceLockRef = useRef(false);

  useEffect(() => {
    advanceLockRef.current = false;
  }, [round]);

  const endGame = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    const timeTakenMs = Date.now() - startTimeRef.current;
    if (!isArena) {
      storage.recordMaxCombo(maxComboRef.current);
    }
    track('game_complete', {
      gameId: mode.id,
      score: scoreRef.current,
      rounds: effectiveRounds,
      arena: isArena ? 1 : 0,
    });
    if (onComplete) {
      onComplete(scoreRef.current, timeTakenMs);
    } else {
      navigate('/results', {
        state: {
          score: scoreRef.current,
          rounds: mode.rounds,
          gameId: mode.id,
          gameName: mode.label,
          maxCombo: maxComboRef.current,
        },
      });
    }
  }, [mode, navigate, onComplete, isArena]);

  const nextRound = useCallback(() => {
    if (advanceLockRef.current || doneRef.current) return;
    advanceLockRef.current = true;
    if (roundRef.current >= effectiveRounds) {
      endGame();
    } else {
      setRound(r => r + 1);
      setTimeLeft(effectiveTime);
    }
  }, [effectiveRounds, effectiveTime, endGame]);

  const addScore = useCallback(
    (pts: number) => {
      if (pts <= 0) return;
      playCorrect();
      const nextCombo = comboRef.current + 1;
      comboRef.current = nextCombo;
      setCombo(nextCombo);
      if (nextCombo > maxComboRef.current) {
        maxComboRef.current = nextCombo;
        setMaxCombo(nextCombo);
      }
      const multiplier = isArena ? 1 : comboMultiplier(nextCombo);
      setScore(s => s + Math.round(pts * multiplier));
    },
    [isArena],
  );

  const reportWrong = useCallback(() => {
    comboRef.current = 0;
    setCombo(0);
  }, []);

  // Audible tick for the final seconds of a timed round.
  useEffect(() => {
    if (!started || effectiveTime === 0) return;
    if (timeLeft <= 3 && timeLeft > 0) play('tick');
  }, [started, timeLeft, effectiveTime]);

  useEffect(() => {
    if (!started || effectiveTime === 0 || timeLeft <= 0) return;
    const t = setInterval(() => {
      // Decided from the captured `timeLeft` rather than inside a setState
      // updater: a side-effecting nextRound() inside an updater can be
      // double-invoked and its timeLeft reset overwritten by the updater's
      // return value, freezing the round timer at 0 while the game keeps
      // running.
      if (timeLeft <= 1) {
        nextRound();
      } else {
        setTimeLeft(timeLeft - 1);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [started, timeLeft, effectiveTime, nextRound]);

  const handleStart = () => {
    startTimeRef.current = Date.now();
    setStarted(true);
    play('start');
    track('game_start', { gameId: mode.id, arena: isArena ? 1 : 0 });
  };

  // Keyboard shortcuts: R restarts the current game, Esc leaves it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        doneRef.current = false;
        advanceLockRef.current = false;
        startTimeRef.current = 0;
        setScore(0);
        setRound(1);
        setTimeLeft(effectiveTime);
        setCombo(0);
        setMaxCombo(0);
        setStarted(false);
        play('start');
      } else if (e.key === 'Escape' && !isArena && !arenaProgress) {
        e.preventDefault();
        navigate('/select');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, isArena, arenaProgress, effectiveTime]);

  if (!started) {
    return (
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-a/[0.12] via-transparent to-brand-c/[0.12] blur-3xl" />
        <div className="relative flex flex-col items-center gap-6 text-center">
          {arenaProgress && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-1 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.08] px-4 py-1.5 text-xs font-semibold text-primary"
            >
              Arena Challenge
            </motion.div>
          )}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-a/30 to-brand-c/30 blur-xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-border/70 bg-card/80 backdrop-blur-md">
              <mode.icon className={cn('h-10 w-10', mode.color)} />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h1 className="font-display text-4xl font-bold tracking-tight">{mode.label}</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{mode.description}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            {isArena ? (
              <>
                <Clock className="h-4 w-4 text-primary" />
                <span>{ARENA_TIME}s · Answer fast for more points!</span>
              </>
            ) : (
              <span>
                {mode.rounds} rounds{mode.timePerRound > 0 ? ` · ${mode.timePerRound}s per round` : ''}
              </span>
            )}
          </motion.div>
          {arenaProgress && (
            <p className="text-xs text-muted-foreground">
              Game {arenaProgress.current} of {arenaProgress.total} ·{' '}
              <span className="font-semibold text-primary">{arenaProgress.totalScore} pts</span> so far
            </p>
          )}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
            <Button size="lg" className="gap-2 px-12 text-base" onClick={handleStart}>
              <Zap className="h-5 w-5" /> Start
            </Button>
            {!arenaProgress && (
              <Button variant="ghost" className="mt-2" onClick={() => navigate('/select')}>
                ← Back to modes
              </Button>
            )}
          </motion.div>
          <p className="mt-4 text-[11px] text-muted-foreground">
            Tip: press <kbd className="rounded border border-border/60 bg-card/60 px-1 font-mono">R</kbd> to restart ·{' '}
            <kbd className="rounded border border-border/60 bg-card/60 px-1 font-mono">Esc</kbd> to exit
          </p>
        </div>
      </div>
    );
  }

  const timerPct = effectiveTime > 0 ? Math.round((timeLeft / effectiveTime) * 100) : 100;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            {!arenaProgress && (
              <Button variant="ghost" size="icon" onClick={() => navigate('/select')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            {arenaProgress && (
              <div className="rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
                Game <span className="text-primary">{arenaProgress.current}</span>/{arenaProgress.total}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <SoundToggle />
            {!isArena && combo >= 2 && (
              <motion.span
                key={combo}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 16 }}
                className="flex items-center gap-1 rounded-full border border-chart-4/40 bg-chart-4/10 px-3 py-1 tabular-nums text-chart-4"
              >
                <Flame className="h-4 w-4" /> {combo} {comboLabel(combo)}
              </motion.span>
            )}
            {!isArena && (
              <span className="hidden rounded-full border border-border/60 bg-card/60 px-3 py-1 text-muted-foreground sm:inline-block">
                Round {round}/{effectiveRounds}
              </span>
            )}
            <motion.span
              key={score}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.08] px-3 py-1 tabular-nums text-primary"
            >
              <Trophy className="h-4 w-4" /> {score}
            </motion.span>
            {effectiveTime > 0 && (
              <span
                className={cn(
                  'flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 tabular-nums',
                  timeLeft <= 3 && 'border-destructive/40 text-destructive animate-pulse-soft',
                )}
              >
                <Clock className="h-4 w-4" /> {timeLeft}s
              </span>
            )}
          </div>
        </div>
        {effectiveTime > 0 && (
          <div className="h-0.5 w-full bg-border/40">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-1000 ease-linear',
                timeLeft <= 3 ? 'bg-destructive' : 'btn-primary-gradient',
              )}
              style={{ width: `${timerPct}%` }}
            />
          </div>
        )}
      </header>
      <main className="relative flex flex-1 items-center justify-center p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,hsl(var(--brand-a)/0.05),transparent)]" />
        {children({ round, score, timeLeft, combo, maxCombo, addScore, reportWrong, nextRound, endGame })}
      </main>
    </div>
  );
}
