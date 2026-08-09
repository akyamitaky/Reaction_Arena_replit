import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trophy, Home, Crown, Medal } from 'lucide-react';
import { getRoomState } from 'zite-endpoints-sdk';
import { getGameMode } from '@/lib/gameConfig';

interface PlayerResult {
  id: string;
  name: string;
  totalScore: number;
  gameScores: { gameId: string; rawScore?: number; score?: number; rankedPoints?: number; timeTakenMs?: number }[];
  isHost: boolean;
}

export default function ArenaResultsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const roomId = state?.roomId || localStorage.getItem('roomId') || '';
  const playerId = localStorage.getItem('playerId') || '';
  const [players, setPlayers] = useState<PlayerResult[]>([]);
  const [gameIDs, setGameIDs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) { navigate('/'); return; }
    const fetch = async () => {
      try {
        const data = await getRoomState({ roomId });
        setPlayers(data.players.sort((a, b) => b.totalScore - a.totalScore));
        setGameIDs(data.room.gameIDs);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [roomId, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const winner = players[0];
  const isMultiplayer = players.length > 1;
  const myRank = players.findIndex(p => p.id === playerId) + 1;
  const me = players.find(p => p.id === playerId);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div className="w-full max-w-md text-center space-y-6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        {/* Winner announcement */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
        >
          <Trophy className="w-12 h-12 text-primary" />
        </motion.div>

        {isMultiplayer ? (
          <div>
            <p className="text-sm text-muted-foreground">Arena Complete!</p>
            <h1 className="text-3xl font-black mt-1">
              {winner?.id === playerId ? '🏆 You Won!' : `🏆 ${winner?.name} Wins!`}
            </h1>
            {myRank > 1 && (
              <p className="text-muted-foreground mt-1">You placed #{myRank} with {me?.totalScore || 0} points</p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-muted-foreground">Arena Complete!</p>
            <h1 className="text-4xl font-black mt-1">{(me?.totalScore || 0) >= 500 ? '🔥 Amazing!' : '💪 Good Job!'}</h1>
          </div>
        )}

        {/* Podium / Leaderboard */}
        {isMultiplayer && (
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b bg-secondary/30">
              <p className="text-sm font-bold flex items-center justify-center gap-2"><Medal className="w-4 h-4" /> Final Standings</p>
            </div>
            <div className="divide-y">
              {players.map((p, i) => {
                const isMe = p.id === playerId;
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className={`flex items-center gap-3 px-4 py-4 ${i === 0 ? 'bg-primary/5' : ''} ${isMe ? 'ring-1 ring-inset ring-primary/20' : ''}`}
                  >
                    <span className="text-2xl w-10 text-center">{medal || `${i + 1}.`}</span>
                    <div className="flex-1 text-left">
                      <p className={`font-bold ${isMe ? 'text-primary' : ''}`}>
                        {p.name} {isMe && '(You)'} {p.isHost && <Crown className="w-3 h-3 inline text-muted-foreground" />}
                      </p>
                    </div>
                    <span className="text-xl font-black tabular-nums text-primary">{p.totalScore}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Per-game breakdown for the current player */}
        {me && me.gameScores.length > 0 && (
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b bg-secondary/30">
              <p className="text-sm font-bold">Your Game Breakdown</p>
            </div>
            <div className="max-h-52 overflow-y-auto divide-y">
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
                    <span className="text-xs text-muted-foreground w-5 tabular-nums">{i + 1}.</span>
                    {Icon && <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0"><Icon className={`w-3.5 h-3.5 ${mode?.color || ''}`} /></div>}
                    <span className="text-sm font-semibold flex-1 text-left">{mode?.label || gs.gameId}</span>
                    {gs.timeTakenMs && gs.rawScore && gs.rawScore > 0 && (
                      <span className="text-xs text-muted-foreground tabular-nums">{(gs.timeTakenMs / 1000).toFixed(1)}s</span>
                    )}
                    <span className="text-sm font-black tabular-nums text-primary">{gs.rankedPoints ?? gs.score ?? 0} pts</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Button className="w-full gap-2" onClick={() => navigate('/')}>
            <Home className="w-4 h-4" /> Back to Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
