import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getGameMode } from '@/lib/gameConfig';
import GameShell from '@/components/GameShell';
import MultiplayerInterstitial from '@/components/MultiplayerInterstitial';
import { getRoomState, submitScore, advanceGame, subscribeToRoom } from '@/lib/arenaApi';
import { GameContext } from '@/components/GameShell';

import ColorGame from '@/components/games/ColorGame';
import MathGame from '@/components/games/MathGame';
import ReflexGame from '@/components/games/ReflexGame';
import StroopGame from '@/components/games/StroopGame';
import ReverseGame from '@/components/games/ReverseGame';
import ScrambleGame from '@/components/games/ScrambleGame';
import SpeedTypeGame from '@/components/games/SpeedTypeGame';
import TrueFalseGame from '@/components/games/TrueFalseGame';
import EmojiGame from '@/components/games/EmojiGame';
import CountGame from '@/components/games/CountGame';
import SequenceGame from '@/components/games/SequenceGame';
import MemoryGame from '@/components/games/MemoryGame';
import ImpostorGame from '@/components/games/ImpostorGame';
import ChainGame from '@/components/games/ChainGame';
import MissingNumGame from '@/components/games/MissingNumGame';
import EmojiTalkGame from '@/components/games/EmojiTalkGame';
import ColorMemGame from '@/components/games/ColorMemGame';
import TileMatchGame from '@/components/games/TileMatchGame';
import OddOneGame from '@/components/games/OddOneGame';
import ScribbleGame from '@/components/games/ScribbleGame';
import RiddleGame from '@/components/games/RiddleGame';
import FlagGame from '@/components/games/FlagGame';
import MorseGame from '@/components/games/MorseGame';
import PeriodicGame from '@/components/games/PeriodicGame';
import BinaryGame from '@/components/games/BinaryGame';
import CapitalsGame from '@/components/games/CapitalsGame';

const GAME_COMPONENTS: Record<string, React.ComponentType<GameContext>> = {
  color: ColorGame, math: MathGame, reflex: ReflexGame, stroop: StroopGame,
  reverse: ReverseGame, scramble: ScrambleGame, speedtype: SpeedTypeGame,
  truefalse: TrueFalseGame, emoji: EmojiGame, count: CountGame,
  sequence: SequenceGame, memory: MemoryGame, impostor: ImpostorGame,
  chain: ChainGame, missingnum: MissingNumGame, emojitalk: EmojiTalkGame,
  colormem: ColorMemGame, tilematch: TileMatchGame, oddone: OddOneGame,
  scribble: ScribbleGame, riddles: RiddleGame, flags: FlagGame,
  morse: MorseGame, periodic: PeriodicGame, binary: BinaryGame,
  capitals: CapitalsGame,
};

type Phase = 'playing' | 'waiting' | 'between' | 'finished';

interface PlayerData {
  id: string;
  name: string;
  totalScore: number;
  currentGameScore: number;
  isHost: boolean;
  gameDone: boolean;
}

export default function MultiplayerArenaPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const roomId = state?.roomId || localStorage.getItem('roomId') || '';
  const playerId = localStorage.getItem('playerId') || '';
  const [gameIDs, setGameIDs] = useState<string[]>(state?.gameIDs || []);
  const [currentIdx, setCurrentIdx] = useState(state?.currentGameIndex || 0);
  const [phase, setPhase] = useState<Phase>('playing');
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const submittedRef = useRef(false);

  // Load when entering a waiting phase, then use Supabase Realtime for updates.
  useEffect(() => {
    if (phase !== 'waiting' && phase !== 'between') return;
    let disposed = false;
    const sync = async () => {
      try {
        const data = await getRoomState({ roomId });
        if (disposed) return;
        setPlayers(data.players);
        setGameIDs(data.room.gameIDs);
        setIsHost(data.players.find(p => p.id === playerId)?.isHost || false);

        if (data.room.status === 'Playing' && phase === 'between') {
          setCurrentIdx(data.room.currentGameIndex);
          submittedRef.current = false;
          setPhase('playing');
        }
        if (data.room.status === 'Finished') {
          setPhase('finished');
        }

        // Check both room status AND player-level gameDone to handle race conditions
        const everyoneDone = data.players.length > 0 && data.players.every(p => p.gameDone);
        if (phase === 'waiting' && (data.room.status === 'Between Games' || data.room.status === 'Finished' || everyoneDone)) {
          // Re-fetch to get final ranked scores
          const freshData = await getRoomState({ roomId });
          setPlayers(freshData.players);
          setIsHost(freshData.players.find(p => p.id === playerId)?.isHost || false);
          if (freshData.room.status === 'Finished') {
            setPhase('finished');
          } else {
            setPhase('between');
          }
        }
      } catch {}
    };
    void sync();
    if (!roomId) return () => { disposed = true; };
    const unsubscribe = subscribeToRoom(roomId, sync);
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [phase, roomId, playerId]);

  // Navigate to results when finished
  useEffect(() => {
    if (phase === 'finished') {
      navigate('/arena-results', { state: { roomId } });
    }
  }, [phase, navigate, roomId]);

  const handleGameComplete = useCallback(async (score: number, timeTakenMs: number) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const gameId = gameIDs[currentIdx];
    try {
      const result = await submitScore({ roomId, playerId, gameId, score, timeTakenMs });
      if (result.allDone && result.isLastGame) {
        setPhase('finished');
      } else if (result.allDone) {
        // Fetch latest scores before showing interstitial
        const data = await getRoomState({ roomId });
        setPlayers(data.players);
        setIsHost(data.players.find(p => p.id === playerId)?.isHost || false);
        setPhase('between');
      } else {
        setPhase('waiting');
      }
    } catch {
      setPhase('waiting');
    }
  }, [roomId, playerId, gameIDs, currentIdx]);

  const handleAdvance = async () => {
    setAdvancing(true);
    try {
      await advanceGame({ roomId, playerId });
    } catch {}
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-2xl font-black">Waiting for others...</h2>
          <p className="text-muted-foreground">{donePlayers.length}/{totalPlayers} players finished</p>
          <div className="space-y-2">
            {players.map(p => (
              <div key={p.id} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border">
                <span className="flex-1 text-sm font-semibold text-left">{p.name}</span>
                <span className={`text-xs font-bold ${p.gameDone || p.id === playerId ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {p.gameDone || p.id === playerId ? '✓ Done' : '⏳ Playing'}
                </span>
              </div>
            ))}
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
      />
    );
  }

  // Playing a game
  const currentGameId = gameIDs[currentIdx];
  const mode = getGameMode(currentGameId);
  const GameComponent = currentGameId ? GAME_COMPONENTS[currentGameId] : undefined;

  if (!mode || !GameComponent) {
    navigate('/');
    return null;
  }

  const myTotalScore = players.find(p => p.id === playerId)?.totalScore || 0;

  return (
    <GameShell
      key={`${currentGameId}-${currentIdx}`}
      mode={mode}
      onComplete={handleGameComplete}
      arenaProgress={{ current: currentIdx + 1, total: gameIDs.length, totalScore: myTotalScore }}
    >
      {(ctx) => <GameComponent {...ctx} />}
    </GameShell>
  );
}
