import { Suspense, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import GameShell from '@/components/GameShell';
import { getGameMode, type GameMode } from '@/lib/gameConfig';
import { getGameComponent } from '@/lib/gameRegistry';
import { storage } from '@/lib/storage';
import {
  getChallenge,
  submitChallengeResult,
  syncSoloProgress,
  type ChallengeInfo,
  type SubmitChallengeResult as SubmitResult,
} from '@/lib/profileApi';
import { claimAndCelebrate } from '@/hooks/useClaimAchievements';
import { ArrowLeft, Loader2, Play, RotateCcw, Home, Swords, Trophy } from 'lucide-react';
import { toast } from 'sonner';

type Phase = 'load' | 'ready' | 'playing' | 'done';

export default function ChallengePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<ChallengeInfo | null>(null);
  const [phase, setPhase] = useState<Phase>('load');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cleanCode = (code || '').trim().toUpperCase();
  const mode = challenge ? getGameMode(challenge.gameId) : null;

  useEffect(() => {
    let active = true;
    getChallenge(cleanCode)
      .then(info => {
        if (!active) return;
        setChallenge(info);
        setPhase('ready');
      })
      .catch(err => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Could not load the challenge.');
      });
    return () => {
      active = false;
    };
  }, [cleanCode]);

  const handleComplete = (score: number) => {
    if (submitting) return;
    const playerName = storage.getPlayerName() || 'Player';
    setSubmitting(true);
    submitChallengeResult({ code: cleanCode, playerName, score })
      .then(res => {
        setResult(res);
        setPhase('done');
        recordRun(score);
        if (res.beat) toast(`You beat the challenge! Target was ${res.targetScore}.`);
        claimAndCelebrate();
      })
      .catch(err => {
        toast(err instanceof Error ? err.message : 'Could not submit your result.');
        navigate('/');
      })
      .finally(() => setSubmitting(false));
  };

  const recordRun = (score: number) => {
    if (!challenge) return;
    const pct = mode && mode.rounds > 0 ? Math.round((score / (mode.rounds * 150)) * 100) : 0;
    storage.recordSoloGame(score, challenge.gameId, pct);
    syncSoloProgress({ name: storage.getPlayerName() || 'Player', score, gameId: challenge.gameId, pct });
  };

  if (phase === 'load') {
    return <LoadingState code={cleanCode} />;
  }

  if (error || (!challenge && phase !== 'done')) {
    return (
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10">
          <Swords className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="font-display text-2xl font-bold">Challenge not found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {error || `No challenge matches "${cleanCode}". Double-check the code with your friend.`}
        </p>
        <Button variant="outline" className="gap-2" onClick={() => navigate('/')}>
          <Home className="h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  if (phase === 'ready' && challenge && mode) {
    return <ReadyState challenge={challenge} mode={mode} onPlay={() => setPhase('playing')} />;
  }

  if (phase === 'playing' && challenge && mode) {
    const GameComponent = getGameComponent(mode.id);
    if (!GameComponent) {
      navigate('/');
      return null;
    }
    return (
      <GameShell key={`challenge-${cleanCode}`} mode={mode} arena={false} onComplete={handleComplete}>
        {ctx => (
          <Suspense
            fallback={
              <div className="flex flex-col items-center gap-3 py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading game...</p>
              </div>
            }
          >
            <GameComponent {...ctx} />
          </Suspense>
        )}
      </GameShell>
    );
  }

  if (phase === 'done' && challenge && result) {
    return (
      <ChallengeResultView
        challenge={challenge}
        result={result}
        onPlayAgain={() => setPhase('playing')}
        onHome={() => navigate('/')}
      />
    );
  }

  return <LoadingState code={cleanCode} />;
}

function LoadingState({ code }: { code: string }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading challenge {code}...</p>
    </div>
  );
}

function ReadyState({ challenge, mode, onPlay }: { challenge: ChallengeInfo; mode: GameMode; onPlay: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="relative mx-auto w-full max-w-xl px-4 pb-16 pt-10 sm:px-6">
      <Button variant="ghost" size="sm" className="mb-6 gap-1 text-muted-foreground" onClick={() => navigate('/')}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-brand-a/[0.12] via-card to-brand-c/[0.12] p-8 backdrop-blur-md"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-c/15 blur-3xl" />
        <div className="relative flex flex-col items-center gap-5 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 btn-primary-gradient">
            <mode.icon className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Challenge · {challenge.code}
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
              Beat {challenge.challengerName}'s {mode.label} score
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Score above <span className="font-bold tabular-nums text-foreground">{challenge.targetScore}</span> to win
              {challenge.targetName ? ` — ${challenge.targetName} is watching` : ''}. You get one shot per attempt.
            </p>
          </div>
          <Button size="lg" className="mt-2 gap-2 px-8" onClick={onPlay}>
            <Play className="h-5 w-5" /> Take the challenge
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function ChallengeResultView({
  challenge,
  result,
  onPlayAgain,
  onHome,
}: {
  challenge: ChallengeInfo;
  result: SubmitResult;
  onPlayAgain: () => void;
  onHome: () => void;
}) {
  const won = result.beat;
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-a/[0.12] via-transparent to-brand-c/[0.12] blur-3xl" />
      <motion.div
        className="relative w-full max-w-md space-y-7 text-center"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
          className="relative mx-auto h-20 w-20"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-a/40 to-brand-c/40 blur-xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-primary/30 btn-primary-gradient">
            <Trophy className="h-10 w-10 text-primary-foreground" />
          </div>
        </motion.div>

        <div>
          <h1
            className={`font-display text-4xl font-bold tracking-tight ${won ? 'text-chart-1' : 'text-muted-foreground'}`}
          >
            {won ? 'Challenge beaten!' : 'So close!'}
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            {won
              ? `${challenge.challengerName}'s target of ${result.targetScore} is history.`
              : `You scored ${result.score} — ${challenge.challengerName} is still ahead with ${result.targetScore}.`}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-md">
          <p className="font-display text-5xl font-bold tracking-tight text-primary tabular-nums">{result.score}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            your score · target {result.targetScore}
          </p>
          <div className="mt-4 divide-y divide-border/50 rounded-xl border border-border/40 text-left">
            {result.results.map(r => (
              <div key={r.playerName} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="font-semibold">{r.playerName}</span>
                <span className="tabular-nums text-muted-foreground">{r.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Button className="w-full gap-2" size="lg" onClick={onPlayAgain}>
            <RotateCcw className="h-4 w-4" /> Try Again
          </Button>
          <Button variant="outline" className="w-full gap-2" size="lg" onClick={onHome}>
            <Home className="h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
