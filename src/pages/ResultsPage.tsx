import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { storage } from '@/lib/storage';
import { Trophy, RotateCcw, Home, ArrowRight, Sparkles, Zap, Swords, Copy, Check, Loader2 } from 'lucide-react';
import CountUp from '@/components/CountUp';
import Confetti from '@/components/Confetti';
import ShareResultButton from '@/components/ShareResultButton';
import { buildSoloShareCard } from '@/lib/shareCard';
import { play } from '@/lib/sound';
import { createChallenge, syncSoloProgress } from '@/lib/profileApi';
import { levelProgress, xpForGradePct } from '@/lib/progress';
import { markEverChallenged } from '@/lib/achievements';
import { claimAndCelebrate } from '@/hooks/useClaimAchievements';
import { toast } from 'sonner';

const GRADES = [
  { min: 90, title: 'Legendary', message: 'An immaculate run. Your reflexes are unmatched.', color: 'text-chart-1' },
  { min: 70, title: 'Amazing', message: 'Elite precision. Keep the momentum going.', color: 'text-chart-2' },
  { min: 50, title: 'Sharp', message: "Solid focus. A few more reps and you're elite.", color: 'text-chart-3' },
  { min: 25, title: 'Warming Up', message: 'Good start — speed comes with practice.', color: 'text-chart-4' },
  {
    min: 0,
    title: 'Keep Going',
    message: 'Every attempt rewires you for faster next time.',
    color: 'text-muted-foreground',
  },
];

export default function ResultsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { score = 0, rounds = 0, gameId = '', gameName = '' } = state || {};
  const name = storage.getPlayerName() || 'Player';
  const maxScore = rounds * 150;
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const grade = GRADES.find(g => pct >= g.min) || GRADES[GRADES.length - 1];
  const xpEarned = xpForGradePct(pct);
  const level = levelProgress(storage.getXp() + xpEarned);

  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeCode, setChallengeCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    storage.recordSoloGame(score, gameId, pct);
    syncSoloProgress({ name: storage.getPlayerName() || 'Player', score, gameId, pct });
  }, [score, gameId, pct]);

  useEffect(() => {
    if (pct >= 70) play('win');
    else if (pct >= 25) play('correct');
  }, [pct]);

  const handleCreateChallenge = async () => {
    if (!gameId) return;
    setCreating(true);
    try {
      const { code } = await createChallenge({ gameId, targetScore: score, challengerName: name });
      setChallengeCode(code);
      markEverChallenged();
      claimAndCelebrate();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not create the challenge.');
    } finally {
      setCreating(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(challengeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast('Could not copy. Share this code manually.');
    }
  };

  const shareText = buildSoloShareCard({ gameName, score, maxScore, grade: grade.title });

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-8">
      {pct >= 70 && <Confetti />}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-a/[0.12] via-transparent to-brand-c/[0.12] blur-3xl" />
      <motion.div
        className="relative w-full max-w-md space-y-7 text-center"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
          className="relative mx-auto h-20 w-20"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-a/40 to-brand-c/40 blur-xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-primary/30 btn-primary-gradient">
            <Trophy className="h-10 w-10 text-primary-foreground" />
          </div>
        </motion.div>

        <div>
          <p className="text-sm text-muted-foreground">Well played, {name}!</p>
          <h1 className={`mt-2 font-display text-4xl font-bold tracking-tight ${grade.color}`}>{grade.title}</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{grade.message}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-7 backdrop-blur-md">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-c/10 blur-2xl" />
          <p className="text-sm font-medium text-muted-foreground">{gameName}</p>
          <p className="mt-2 font-display text-6xl font-bold tracking-tight text-primary tabular-nums">
            <CountUp value={score} />
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">points</p>
          <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="h-full rounded-full btn-primary-gradient"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pct, 100)}%` }}
              transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span className="flex items-center gap-1 font-semibold text-primary">
              <Sparkles className="h-3 w-3" /> {pct}% mastery
            </span>
            <span>{maxScore}</span>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-secondary/40 px-4 py-2.5">
            <span className="flex items-center gap-1.5 text-sm font-bold text-primary">
              <Zap className="h-4 w-4 text-chart-4" /> +{xpEarned} XP
            </span>
            <span className="h-3 w-px bg-border/70" />
            <span className="text-xs font-medium text-muted-foreground">
              Level {level.level} · {level.title}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <ShareResultButton text={shareText} label="Share result" />
          <Button
            variant="secondary"
            className="w-full gap-2"
            size="lg"
            onClick={() => setChallengeOpen(true)}
            disabled={!gameId}
          >
            <Swords className="h-4 w-4" /> Challenge a Friend
          </Button>
          <Button className="w-full gap-2" size="lg" onClick={() => navigate(`/play/${gameId}`)}>
            <RotateCcw className="h-4 w-4" /> Play Again
          </Button>
          <Button variant="outline" className="w-full gap-2" size="lg" onClick={() => navigate('/select')}>
            <ArrowRight className="h-4 w-4" /> Try Another Mode
          </Button>
          <Button variant="ghost" className="w-full gap-2" size="lg" onClick={() => navigate('/')}>
            <Home className="h-4 w-4" /> Back to Dashboard
          </Button>
        </div>

        <Dialog open={challengeOpen} onOpenChange={setChallengeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{challengeCode ? 'Challenge created!' : 'Challenge a Friend'}</DialogTitle>
              <DialogDescription>
                {challengeCode
                  ? `Share this code — they play ${gameName} and try to beat your ${score} points.`
                  : `Your friend plays ${gameName} and tries to beat your ${score.toLocaleString()} points. One attempt per player.`}
              </DialogDescription>
            </DialogHeader>
            {creating ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : challengeCode ? (
              <div className="space-y-4 text-center">
                <button
                  onClick={copyCode}
                  className="mx-auto block w-full rounded-2xl border border-primary/30 bg-primary/[0.06] px-4 py-5 font-mono text-4xl font-bold tracking-[0.25em] text-primary transition-colors hover:bg-primary/[0.12]"
                  aria-label="Copy challenge code"
                >
                  {challengeCode}
                </button>
                <div className="flex justify-center gap-3">
                  <Button onClick={copyCode} variant="outline" className="gap-2">
                    {copied ? <Check className="h-4 w-4 text-chart-1" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy code'}
                  </Button>
                  <Button onClick={() => navigate(`/challenge/${challengeCode}`)} className="gap-2">
                    Play it now <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your friend opens the app and enters this code under "Enter challenge code".
                </p>
              </div>
            ) : (
              <Button className="w-full gap-2" onClick={handleCreateChallenge}>
                <Swords className="h-4 w-4" /> Create challenge code
              </Button>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
