import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowRight, Crown, Loader2 } from 'lucide-react';

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
}

export default function MultiplayerInterstitial({
  players, gamesPlayed, totalGames,
  nextGameName, nextGameIcon: NextIcon, nextGameColor,
  isHost, advancing, onAdvance, currentPlayerId,
}: Props) {
  const pct = Math.round((gamesPlayed / totalGames) * 100);
  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
  const leader = sorted[0];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div className="w-full max-w-sm text-center space-y-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Progress */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Arena Progress</p>
          <p className="text-sm text-muted-foreground">{gamesPlayed}/{totalGames} games complete</p>
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: `${Math.round(((gamesPlayed - 1) / totalGames) * 100)}%` }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>

        {/* Leaderboard */}
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-secondary/30 flex items-center justify-between">
            <span className="text-sm font-bold flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" /> Leaderboard</span>
          </div>
          <div className="divide-y">
            {sorted.map((p, i) => {
              const isMe = p.id === currentPlayerId;
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'bg-primary/5' : ''}`}
                >
                  <span className="text-lg w-8 text-center">{medal || `${i + 1}.`}</span>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-bold ${isMe ? 'text-primary' : ''}`}>
                      {p.name} {isMe && '(You)'}
                    </p>
                    <p className="text-xs text-muted-foreground">+{p.currentGameScore} this round</p>
                  </div>
                  <span className="text-lg font-black tabular-nums text-primary">{p.totalScore}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Next game preview */}
        {nextGameName && (
          <div className="p-4 rounded-2xl bg-secondary/30 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Next Up</p>
            <div className="flex items-center justify-center gap-3">
              {NextIcon && (
                <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
                  <NextIcon className={`w-5 h-5 ${nextGameColor}`} />
                </div>
              )}
              <span className="text-xl font-black">{nextGameName}</span>
            </div>
          </div>
        )}

        {/* Host controls */}
        {isHost ? (
          <Button size="lg" className="w-full text-lg gap-2" onClick={onAdvance} disabled={advancing}>
            {advancing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            {advancing ? 'Starting...' : 'Next Game'}
          </Button>
        ) : (
          <div className="p-4 rounded-xl bg-secondary/30 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-sm font-semibold">Waiting for <Crown className="w-3 h-3 inline" /> host to continue...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
