import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowRight, Crown, Loader2, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerData {
  id: string;
  name: string;
  totalScore: number;
  currentGameScore: number;
  isHost: boolean;
}

interface Props {
  players: PlayerData[];
  gamesPlayed: number;
  totalGames: number;
  nextGameName: string;
  nextGameIcon?: React.ComponentType<{ className?: string }>;
  nextGameColor: string;
  isHost: boolean;
  advancing: boolean;
  onAdvance: () => void;
  currentPlayerId: string;
  /** Seconds until the arena auto-advances (0 = none/unknown). */
  autoAdvanceIn?: number;
}

export default function MultiplayerInterstitial({
  players,
  gamesPlayed,
  totalGames,
  nextGameName,
  nextGameIcon: NextIcon,
  nextGameColor,
  isHost,
  advancing,
  onAdvance,
  currentPlayerId,
  autoAdvanceIn = 0,
}: Props) {
  const pct = Math.round((gamesPlayed / totalGames) * 100);
  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-a/[0.12] via-transparent to-brand-c/[0.12] blur-3xl" />
      <motion.div
        className="relative w-full max-w-sm space-y-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Arena Progress</p>
          <p className="text-sm text-muted-foreground">
            {gamesPlayed}/{totalGames} games complete
          </p>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="h-full rounded-full btn-primary-gradient"
              initial={{ width: `${Math.round(((gamesPlayed - 1) / totalGames) * 100)}%` }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-border/50 bg-secondary/40 px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-bold">
              <Trophy className="h-4 w-4 text-primary" /> Leaderboard
            </span>
          </div>
          <div className="divide-y divide-border/50">
            {sorted.map((p, i) => {
              const isMe = p.id === currentPlayerId;
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn('flex items-center gap-3 px-4 py-3', isMe && 'bg-primary/[0.06]')}
                >
                  <span className="w-8 text-center text-lg">{medal || `${i + 1}.`}</span>
                  <div className="flex-1 text-left">
                    <p className={cn('text-sm font-bold', isMe && 'text-primary')}>
                      {p.name} {isMe && <span className="text-xs font-normal text-muted-foreground">(You)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">+{p.currentGameScore} this round</p>
                  </div>
                  <span className="font-display text-lg font-bold tabular-nums text-primary">{p.totalScore}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {nextGameName && (
          <div className="space-y-2 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.06] to-transparent p-4 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Next Up</p>
            <div className="flex items-center justify-center gap-3">
              {NextIcon && (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-card/80">
                  <NextIcon className={cn('h-5 w-5', nextGameColor)} />
                </div>
              )}
              <span className="font-display text-xl font-bold tracking-tight">{nextGameName}</span>
            </div>
          </div>
        )}

        {isHost ? (
          <div className="space-y-3">
            <Button size="lg" className="w-full gap-2 text-lg" onClick={onAdvance} disabled={advancing}>
              {advancing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
              {advancing ? 'Starting...' : 'Next Game'}
            </Button>
            {autoAdvanceIn > 0 && (
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Timer className="h-3.5 w-3.5 text-primary" /> Auto-starts in {autoAdvanceIn}s
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-secondary/30 p-4 backdrop-blur-md">
            {autoAdvanceIn > 0 ? (
              <>
                <Timer className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">
                  Next game starts in <span className="font-bold text-primary">{autoAdvanceIn}s</span>
                </p>
              </>
            ) : (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-sm font-semibold">
                  Waiting for <Crown className="inline h-3 w-3 text-primary" /> players to finish...
                </p>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
