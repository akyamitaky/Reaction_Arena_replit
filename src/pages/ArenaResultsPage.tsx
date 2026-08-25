import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trophy, Home, Crown, Medal, ChartNoAxesColumn, RotateCcw, Zap } from 'lucide-react';
import { getRoomState, createRoom, type Player } from '@/lib/arenaApi';
import { storage } from '@/lib/storage';
import { getGameMode } from '@/lib/gameConfig';
import CountUp from '@/components/CountUp';
import Confetti from '@/components/Confetti';
import ShareResultButton from '@/components/ShareResultButton';
import { buildArenaShareCard } from '@/lib/shareCard';
import { play } from '@/lib/sound';
import { syncArenaProgress } from '@/lib/profileApi';
import { levelProgress, xpForArenaRank } from '@/lib/progress';
import { cn } from '@/lib/utils';

/**
 * Defensive fallback for arenas whose per-player `total_score` was never
 * populated (older rooms or a missed finalize step): derive the total from the
 * recorded game scores instead of showing zeroes.
 */
function playerTotal(p: Player): number {
  if (p.totalScore > 0) return p.totalScore;
  const ranked = p.gameScores.reduce((sum, g) => sum + (g.rankedPoints ?? 0), 0);
  if (ranked > 0) return ranked;
  return p.gameScores.reduce((sum, g) => sum + (g.rawScore ?? g.score ?? 0), 0);
}

export default function ArenaResultsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const roomId = state?.roomId || storage.getRoomId() || '';
  const playerId = storage.getPlayerId();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameCount, setGameCount] = useState(0);
  const [rematching, setRematching] = useState(false);

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }
    const fetch = async () => {
      try {
        const data = await getRoomState({ roomId });
        setGameCount(data.room.gameCount);
        const sorted = [...data.players].sort(
          (a, b) => playerTotal(b) - playerTotal(a) || a.name.localeCompare(b.name),
        );
        setPlayers(sorted);
        const winner = sorted[0];
        const myRank = sorted.findIndex(p => p.id === playerId) + 1;
        storage.recordArena(data.players.length > 1 && winner?.id === playerId, myRank, data.players.length);
        if (data.players.length > 1) {
          syncArenaProgress({
            name: storage.getPlayerName() || 'Player',
            won: winner?.id === playerId,
            rank: myRank,
            totalPlayers: data.players.length,
            gameScores:
              data.players
                .find(p => p.id === playerId)
                ?.gameScores.map(gs => ({ gameId: gs.gameId, score: gs.rawScore ?? gs.score ?? 0 })) ?? [],
          });
        }
      } catch (e) {
        console.warn('Failed to load arena results', e);
      }
      setLoading(false);
    };
    fetch();
  }, [roomId, navigate, playerId]);

  const myRank = players.findIndex(p => p.id === playerId) + 1;
  const myScore = players.length > 0 ? playerTotal(players.find(p => p.id === playerId) || players[0]) : 0;

  useEffect(() => {
    if (!loading && players.length > 0) {
      if (myRank === 1) play('fanfare');
      else if (myRank === 2) play('win');
    }
  }, [loading, players.length, myRank]);

  const handleRematch = async () => {
    setRematching(true);
    try {
      const name = storage.getPlayerName() || 'Player';
      const result = await createRoom({ hostName: name, gameCount: Math.max(gameCount, 3) });
      storage.setPlayerId(result.playerId);
      storage.setPlayerToken(result.playerToken);
      storage.setRoomId(result.roomId);
      navigate('/lobby', { state: { roomId: result.roomId, isHost: true } });
    } catch (e: any) {
      console.warn('Failed to start rematch', e);
      setRematching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const winner = players[0];
  const isMultiplayer = players.length > 1;
  const me = players.find(p => p.id === playerId);

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-10">
      {isMultiplayer && myRank <= 2 && <Confetti />}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-a/[0.12] via-transparent to-brand-c/[0.12] blur-3xl" />
      <motion.div
        className="relative w-full max-w-md space-y-6 text-center"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
          className="relative mx-auto h-24 w-24"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-a/40 to-brand-c/40 blur-xl" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-primary/30 btn-primary-gradient">
            <Trophy className="h-12 w-12 text-primary-foreground" />
          </div>
        </motion.div>

        {isMultiplayer ? (
          <div>
            <p className="text-sm text-muted-foreground">Arena Complete!</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
              {winner?.id === playerId ? (
                <span className="text-gradient">You Won!</span>
              ) : (
                <span>{winner?.name} Wins!</span>
              )}
            </h1>
            {myRank > 1 && (
              <p className="mt-1 text-sm text-muted-foreground">
                You placed <span className="font-bold text-foreground">#{myRank}</span> with{' '}
                <span className="font-bold text-primary">{me ? playerTotal(me) : 0} points</span>
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-muted-foreground">Arena Complete!</p>
            <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">
              {(me ? playerTotal(me) : 0) >= 500 ? <span className="text-gradient">Amazing!</span> : 'Good Job!'}
            </h1>
          </div>
        )}

        {isMultiplayer && (
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md">
            <div className="flex items-center justify-center gap-2 border-b border-border/50 bg-secondary/40 px-4 py-3">
              <Medal className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold">Final Standings</p>
            </div>
            <div className="divide-y divide-border/50">
              {players.map((p, i) => {
                const isMe = p.id === playerId;
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className={cn(
                      'flex items-center gap-3 px-4 py-4',
                      i === 0 && 'bg-gradient-to-r from-primary/[0.08] to-transparent',
                      isMe && 'ring-1 ring-inset ring-primary/25',
                    )}
                  >
                    <span className="w-10 text-center text-2xl">{medal || `${i + 1}.`}</span>
                    <div className="flex-1 text-left">
                      <p className={cn('font-display font-bold', isMe && 'text-primary')}>
                        {p.name} {isMe && <span className="text-xs text-muted-foreground">(You)</span>}{' '}
                        {p.isHost && <Crown className="inline h-3 w-3 text-muted-foreground" />}
                      </p>
                    </div>
                    <span className="font-display text-xl font-bold tabular-nums text-primary">
                      <CountUp value={playerTotal(p)} />
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {me && me.gameScores.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-border/50 bg-secondary/40 px-4 py-3">
              <ChartNoAxesColumn className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold">Your Game Breakdown</p>
            </div>
            <div className="max-h-56 divide-y divide-border/50 overflow-y-auto">
              {me.gameScores.map((gs, i) => {
                const mode = getGameMode(gs.gameId);
                const Icon = mode?.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.04 }}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <span className="w-5 text-xs tabular-nums text-muted-foreground">{i + 1}.</span>
                    {Icon && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-secondary/60">
                        <Icon className={cn('h-3.5 w-3.5', mode?.color || '')} />
                      </div>
                    )}
                    <span className="flex-1 text-left text-sm font-semibold">{mode?.label || gs.gameId}</span>
                    {gs.timeTakenMs && gs.rawScore && gs.rawScore > 0 && (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {(gs.timeTakenMs / 1000).toFixed(1)}s
                      </span>
                    )}
                    <span className="text-sm font-bold tabular-nums text-primary">
                      {gs.rankedPoints ?? gs.score ?? 0} pts
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {isMultiplayer && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/70 px-4 py-3 backdrop-blur-md">
            <span className="flex items-center gap-1.5 text-sm font-bold text-primary">
              <Zap className="h-4 w-4 text-chart-4" /> +{xpForArenaRank(myRank, players.length)} XP
            </span>
            <span className="h-3 w-px bg-border/70" />
            <span className="text-xs font-medium text-muted-foreground">
              Level {levelProgress(storage.getXp()).level} · {levelProgress(storage.getXp()).title}
            </span>
          </div>
        )}

        <div className="space-y-3 pt-1">
          {isMultiplayer && (
            <ShareResultButton
              text={buildArenaShareCard({
                playerName: storage.getPlayerName() || 'I',
                rank: myRank,
                totalPlayers: players.length,
                score: myScore,
              })}
              label="Share result"
            />
          )}
          {isMultiplayer && gameCount > 0 && (
            <Button
              className="w-full gap-2"
              size="lg"
              variant="secondary"
              onClick={handleRematch}
              disabled={rematching}
            >
              <RotateCcw className="h-4 w-4" /> {rematching ? 'Creating rematch...' : 'Rematch with same players'}
            </Button>
          )}
          <Button className="w-full gap-2" size="lg" onClick={() => navigate('/')}>
            <Home className="h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
