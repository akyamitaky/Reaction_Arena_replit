import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Copy, Crown, Users, Loader2, ArrowLeft, Zap, Check } from 'lucide-react';
import { getRoomState, joinRoom, startArena, subscribeToRoom, type Player } from '@/lib/arenaApi';
import { storage } from '@/lib/storage';
import { buildJoinLink } from '@/lib/shareCard';
import { toast } from 'sonner';

export default function LobbyPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState<string>(state?.roomId || storage.getRoomId() || '');
  const [isHost, setIsHost] = useState(state?.isHost || false);
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameCount, setGameCount] = useState(0);
  const [starting, setStarting] = useState(false);
  const [joining, setJoining] = useState(!!state?.joinCode);
  const [roomStatus, setRoomStatus] = useState('Waiting');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!state?.joinCode) return;
    const doJoin = async () => {
      try {
        const result = await joinRoom({ code: state.joinCode, playerName: state.playerName });
        storage.setPlayerId(result.playerId);
        storage.setPlayerToken(result.playerToken);
        storage.setRoomId(result.roomId);
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

  const pollRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      const data = await getRoomState({ roomId });
      setRoomCode(data.room.code);
      setGameCount(data.room.gameCount);
      setRoomStatus(data.room.status);
      setPlayers(data.players);

      if (data.room.status === 'Playing') {
        navigate('/arena', {
          state: { roomId, gameIDs: data.room.gameIDs, currentGameIndex: data.room.currentGameIndex },
        });
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
    setCopied(true);
    toast.success('Room code copied!');
    setTimeout(() => setCopied(false), 1600);
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(buildJoinLink(roomCode));
    setCopied(true);
    toast.success('Invite link copied!');
    setTimeout(() => setCopied(false), 1600);
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const playerId = storage.getPlayerId();
      const playerToken = storage.getPlayerToken();
      if (!playerId || !/^[a-f0-9]{64}$/i.test(playerToken)) {
        throw new Error('Refresh the app and create a new room to get a valid host session.');
      }
      await startArena({ roomId, playerId, playerToken });
    } catch (e: any) {
      toast.error(e.message || 'Failed to start');
      setStarting(false);
    }
  };

  if (joining) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Joining room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-a/[0.12] via-transparent to-brand-c/[0.12] blur-3xl" />
      <motion.div
        className="relative w-full max-w-sm space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="space-y-3 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.1] to-transparent p-6 text-center backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Room Code</p>
          <button onClick={handleCopyCode} aria-label="Copy room code" className="group relative mx-auto block">
            <div className="font-mono text-5xl font-bold tracking-[0.4em] text-primary transition-transform duration-300 group-hover:scale-105">
              {roomCode || '-----'}
            </div>
            <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-primary">
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-primary" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Tap to copy
                </>
              )}
            </div>
          </button>
          <p className="text-sm text-muted-foreground">Share this code with friends to join</p>
          <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={handleCopyInvite}>
            <Copy className="h-3.5 w-3.5" /> {copied ? 'Invite link copied!' : 'Copy invite link'}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4 text-primary" />
          <span>
            {gameCount} games · {roomStatus}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-border/50 bg-secondary/40 px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-bold">
              <Users className="h-4 w-4 text-primary" /> Players
            </span>
            <span className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-xs text-muted-foreground">
              {players.length}/8
            </span>
          </div>
          <div className="divide-y divide-border/50">
            {players.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full btn-primary-gradient text-sm font-bold text-primary-foreground shadow-md">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 text-sm font-semibold">{p.name}</span>
                {p.isHost && (
                  <span className="flex items-center gap-1 rounded-full border border-primary/25 bg-primary/[0.08] px-2 py-0.5 text-xs font-semibold text-primary">
                    <Crown className="h-3 w-3" /> Host
                  </span>
                )}
              </motion.div>
            ))}
            {players.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                Loading players...
              </div>
            )}
          </div>
        </div>

        {isHost ? (
          <Button
            size="lg"
            className="w-full gap-2 text-lg"
            onClick={handleStart}
            disabled={starting || players.length < 2}
          >
            {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
            {players.length < 2 ? 'Waiting for players...' : starting ? 'Starting...' : 'Start Arena!'}
          </Button>
        ) : (
          <div className="space-y-2 rounded-xl border border-border/50 bg-secondary/30 p-4 text-center backdrop-blur-md">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
            <p className="text-sm font-semibold">Waiting for host to start...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
