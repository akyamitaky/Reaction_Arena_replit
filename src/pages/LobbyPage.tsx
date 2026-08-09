import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Copy, Crown, Users, Loader2, ArrowLeft, Zap } from 'lucide-react';
import { getRoomState, joinRoom, startArena, subscribeToRoom } from '@/lib/arenaApi';
import { toast } from 'sonner';

export default function LobbyPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState<string>(state?.roomId || localStorage.getItem('roomId') || '');
  const [isHost, setIsHost] = useState(state?.isHost || false);
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState<{ id: string; name: string; isHost: boolean }[]>([]);
  const [gameCount, setGameCount] = useState(0);
  const [starting, setStarting] = useState(false);
  const [joining, setJoining] = useState(!!state?.joinCode);
  const [roomStatus, setRoomStatus] = useState('Waiting');

  // Join room if coming from join flow
  useEffect(() => {
    if (!state?.joinCode) return;
    const doJoin = async () => {
      try {
        const result = await joinRoom({ code: state.joinCode, playerName: state.playerName });
        localStorage.setItem('playerId', result.playerId);
        localStorage.setItem('roomId', result.roomId);
        setRoomId(result.roomId);
        setGameCount(result.gameCount);
        setIsHost(false);
        setJoining(false);
      } catch (e: any) {
        toast.error(e.message || 'Failed to join room');
        navigate('/');
      }
    };
    doJoin();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load once, then keep the lobby synchronized with Supabase Realtime.
  const pollRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      const data = await getRoomState({ roomId });
      setRoomCode(data.room.code);
      setGameCount(data.room.gameCount);
      setRoomStatus(data.room.status);
      setPlayers(data.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost })));

      if (data.room.status === 'Playing') {
        navigate('/arena', { state: { roomId, gameIDs: data.room.gameIDs, currentGameIndex: data.room.currentGameIndex } });
      }
    } catch {
      // ignore polling errors
    }
  }, [roomId, navigate]);

  useEffect(() => {
    pollRoom();
    if (!roomId) return;
    return subscribeToRoom(roomId, pollRoom);
  }, [pollRoom]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success('Room code copied!');
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const playerId = localStorage.getItem('playerId') || '';
      await startArena({ roomId, playerId });
    } catch (e: any) {
      toast.error(e.message || 'Failed to start');
      setStarting(false);
    }
  };

  if (joining) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Joining room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div className="w-full max-w-sm space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        {/* Room Code Display */}
        <div className="text-center space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Room Code</p>
          <button onClick={handleCopyCode} className="group relative">
            <div className="text-5xl font-black tracking-[0.4em] font-mono text-primary">
              {roomCode || '-----'}
            </div>
            <div className="flex items-center justify-center gap-1 mt-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
              <Copy className="w-3 h-3" /> Tap to copy
            </div>
          </button>
          <p className="text-sm text-muted-foreground">Share this code with friends to join</p>
        </div>

        {/* Game info */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Zap className="w-4 h-4 text-primary" />
          <span>{gameCount} games · {roomStatus}</span>
        </div>

        {/* Players list */}
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-secondary/30 flex items-center justify-between">
            <span className="text-sm font-bold flex items-center gap-2"><Users className="w-4 h-4" /> Players</span>
            <span className="text-xs text-muted-foreground">{players.length}/8</span>
          </div>
          <div className="divide-y">
            {players.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-sm flex-1">{p.name}</span>
                {p.isHost && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                    <Crown className="w-3 h-3" /> Host
                  </span>
                )}
              </motion.div>
            ))}
            {players.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Loading players...
              </div>
            )}
          </div>
        </div>

        {/* Waiting indicator or Start button */}
        {isHost ? (
          <Button size="lg" className="w-full text-lg gap-2" onClick={handleStart} disabled={starting || players.length < 2}>
            {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            {players.length < 2 ? 'Waiting for players...' : starting ? 'Starting...' : 'Start Arena!'}
          </Button>
        ) : (
          <div className="text-center space-y-2 p-4 rounded-xl bg-secondary/30">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            <p className="text-sm font-semibold">Waiting for host to start...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
