import { Suspense, useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getGameMode } from '@/lib/gameConfig';
import GameShell from '@/components/GameShell';
import MultiplayerInterstitial from '@/components/MultiplayerInterstitial';
import ScribbleArenaGame from '@/components/ScribbleArenaGame';
import { getRoomState, submitScore, advanceGame, autoAdvanceRoom, subscribeToRoom, type Player } from '@/lib/arenaApi';
import type { GameContext } from '@/components/GameShell';
import { getGameComponent } from '@/lib/gameRegistry';
import { storage } from '@/lib/storage';
import { MAX_ARENA_SCORE } from '@/lib/gameConstants';
import { toast } from 'sonner';

type Phase = 'playing' | 'waiting' | 'between' | 'finished';

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export default function MultiplayerArenaPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const roomId = state?.roomId || storage.getRoomId();
  const playerId = storage.getPlayerId();
  const playerToken = storage.getPlayerToken();
  const [gameIDs, setGameIDs] = useState<string[]>(state?.gameIDs || []);
  const [currentIdx, setCurrentIdx] = useState(state?.currentGameIndex || 0);
  const [phase, setPhase] = useState<Phase>('playing');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [autoAdvanceIn, setAutoAdvanceIn] = useState(0);
  const submittedRef = useRef(false);
  const autoFiredRef = useRef(false);

  // Hydrate immediately and keep the entire arena synchronized. Realtime is
  // supplemented by a light polling fallback because browser/network sleep
  // can drop a websocket event. Polling is paused while the tab is hidden.
  useEffect(() => {
    let disposed = false;
    const sync = async () => {
      try {
        const data = await getRoomState({ roomId });
        if (disposed) return;
        setPlayers(data.players);
        setGameIDs(data.room.gameIDs);
        setCurrentIdx(data.room.currentGameIndex);
        setIsHost(data.players.find(p => p.id === playerId)?.isHost || false);

        const me = data.players.find(p => p.id === playerId);
        if (data.room.status === 'Finished') {
          setPhase('finished');
        } else if (data.room.status === 'Between Games') {
          setPhase('between');
        } else if (data.room.status === 'Playing') {
          // A submitted player must remain in the waiting screen until the
          // server advances the room. This prevents realtime updates from
          // restarting a local game while another player is still playing.
          if (me?.gameDone) {
            setPhase('waiting');
          } else {
            if (submittedRef.current) submittedRef.current = false;
            setPhase('playing');
          }
        }
      } catch (error) {
        console.warn('[arena] state sync failed', errorMessage(error));
      }
    };
    void sync();
    if (!roomId)
      return () => {
        disposed = true;
      };
    const unsubscribe = subscribeToRoom(roomId, sync);
    const pollTimer = window.setInterval(() => {
      if (!document.hidden) void sync();
    }, 3000);
    const onVisible = () => {
      if (!document.hidden) void sync();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      disposed = true;
      unsubscribe();
      window.clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [roomId, playerId]);

  // Navigate to results when finished
  useEffect(() => {
    if (phase === 'finished') {
      navigate('/arena-results', { state: { roomId } });
    }
  }, [phase, navigate, roomId]);

  // Auto-advance: after every player finishes, the server waits a short grace
  // period then lets any player move the room to the next game. We count down
  // client-side so the scoreboard doesn't stall when the host closes their tab.
  // Attempts repeat once the grace period elapses until the room actually moves.
  const AUTO_ADVANCE_GRACE_MS = 16000;
  useEffect(() => {
    if (phase !== 'between') {
      autoFiredRef.current = false;
      setAutoAdvanceIn(0);
      return;
    }
    autoFiredRef.current = false;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setAutoAdvanceIn(Math.max(0, Math.ceil((AUTO_ADVANCE_GRACE_MS - elapsed) / 1000)));
      if (elapsed < AUTO_ADVANCE_GRACE_MS || autoFiredRef.current) return;
      autoFiredRef.current = true;
      void autoAdvanceRoom({ roomId, playerId, playerToken })
        .then(result => {
          if (!result.advanced) autoFiredRef.current = false;
        })
        .catch(() => {
          autoFiredRef.current = false;
        });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, roomId, playerId, playerToken]);

  const handleGameComplete = useCallback(
    async (score: number, timeTakenMs: number) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      const gameId = gameIDs[currentIdx];
      const safeScore = Math.max(0, Math.min(Math.round(score), MAX_ARENA_SCORE));
      try {
        const result = await submitScore({ roomId, playerId, playerToken, gameId, score: safeScore, timeTakenMs });
        if (result.allDone && result.isLastGame) {
          setPhase('finished');
        } else {
          // The server changes the room to Between Games only after all
          // players submit. The realtime/polling sync above moves everyone to
          // the interstitial from that authoritative state.
          setPhase(result.allDone ? 'between' : 'waiting');
        }
      } catch (error) {
        // A failed submission must be retryable. Do not strand the player in
        // the waiting screen with a permanently set submitted flag.
        submittedRef.current = false;
        setPhase('playing');
        toast.error(errorMessage(error));
      }
    },
    [roomId, playerId, playerToken, gameIDs, currentIdx],
  );

  const handleAdvance = async () => {
    setAdvancing(true);
    try {
      await advanceGame({ roomId, playerId, playerToken });
    } catch (error) {
      console.warn('[arena] advance failed', errorMessage(error));
    }
    setAdvancing(false);
  };

  if (!roomId) {
    navigate('/');
    return null;
  }

  // Waiting for others to finish
  if (phase === 'waiting') {
    const donePlayers = players.filter(p => p.gameDone);
    const totalPlayers = players.length;
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-a/[0.12] via-transparent to-brand-c/[0.12] blur-3xl" />
        <div className="relative w-full max-w-sm space-y-5 text-center">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 rounded-full bg-primary/25 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-card/80 backdrop-blur-md">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Waiting for others...</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {donePlayers.length}/{totalPlayers} players finished
            </p>
          </div>
          <div className="space-y-2">
            {players.map(p => {
              const isDone = p.gameDone || p.id === playerId;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/70 px-4 py-2.5 backdrop-blur-md"
                >
                  <span className="flex-1 text-left text-sm font-semibold">{p.name}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      isDone ? 'bg-chart-1/15 text-chart-1' : 'bg-secondary text-muted-foreground animate-pulse-soft'
                    }`}
                  >
                    {isDone ? 'Done' : 'Playing'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Between games - show scoreboard
  if (phase === 'between') {
    const nextGameId = gameIDs[currentIdx + 1];
    const nextMode = nextGameId ? getGameMode(nextGameId) : undefined;
    return (
      <MultiplayerInterstitial
        players={players}
        gamesPlayed={currentIdx + 1}
        totalGames={gameIDs.length}
        nextGameName={nextMode?.label || ''}
        nextGameIcon={nextMode?.icon}
        nextGameColor={nextMode?.color || ''}
        isHost={isHost}
        advancing={advancing}
        onAdvance={handleAdvance}
        currentPlayerId={playerId}
        autoAdvanceIn={autoAdvanceIn}
      />
    );
  }

  // Playing a game
  const currentGameId = gameIDs[currentIdx];
  const mode = getGameMode(currentGameId);
  const GameComponent = currentGameId ? getGameComponent(currentGameId) : undefined;

  if (!mode || !GameComponent) {
    navigate('/');
    return null;
  }

  const myTotalScore = players.find(p => p.id === playerId)?.totalScore || 0;

  // Scribble is a shared draw-and-guess game, not a solo timer round.
  if (currentGameId === 'scribble') {
    return <ScribbleArenaGame roomId={roomId} playerId={playerId} playerToken={playerToken} />;
  }

  return (
    <GameShell
      key={`${currentGameId}-${currentIdx}`}
      mode={mode}
      onComplete={handleGameComplete}
      arenaProgress={{ current: currentIdx + 1, total: gameIDs.length, totalScore: myTotalScore }}
    >
      {ctx => (
        <Suspense
          fallback={
            <div className="flex flex-col items-center gap-3 py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading game...</p>
            </div>
          }
        >
          <GameComponent {...(ctx as GameContext)} />
        </Suspense>
      )}
    </GameShell>
  );
}
