import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Swords, Zap, Loader2, Timer } from 'lucide-react';
import { createRoom, cleanupStaleRooms } from '@/lib/arenaApi';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PRESETS = [
  { count: 5, label: 'Quick', emoji: '⚡', desc: '~10 min' },
  { count: 10, label: 'Standard', emoji: '🎯', desc: '~20 min' },
  { count: 15, label: 'Extended', emoji: '🔥', desc: '~30 min' },
  { count: 20, label: 'Marathon', emoji: '🏆', desc: '~40 min' },
  { count: 35, label: 'All Games', emoji: '💀', desc: '~60 min' },
];

export default function ArenaSetupPage() {
  const navigate = useNavigate();
  const [gameCount, setGameCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const name = storage.getPlayerName() || 'Player';

  // Best-effort sweep of abandoned "Waiting" rooms older than 6 hours so the
  // lobby list stays clean. Requires migration 20260816000000; failures are
  // silent so setup is never blocked.
  useEffect(() => {
    cleanupStaleRooms(6).catch(() => undefined);
  }, []);

  const handleStart = async () => {
    setLoading(true);
    try {
      const result = await createRoom({ hostName: name, gameCount });
      storage.setPlayerId(result.playerId);
      storage.setPlayerToken(result.playerToken);
      storage.setRoomId(result.roomId);
      navigate('/lobby', { state: { roomId: result.roomId, isHost: true } });
    } catch (e: any) {
      toast.error(e.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-a/[0.12] via-transparent to-brand-c/[0.12] blur-3xl" />
      <motion.div
        className="relative w-full max-w-md space-y-7"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Setup Arena, {name}</h1>
            <p className="text-sm text-muted-foreground">Choose how many games to compete in</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {PRESETS.map(p => (
            <button
              key={p.count}
              onClick={() => setGameCount(p.count)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-300',
                gameCount === p.count
                  ? 'border-primary/50 bg-primary/10 shadow-lg shadow-[hsl(var(--brand-a)/0.2)] ring-1 ring-primary/40'
                  : 'border-border/60 bg-card/60 hover:-translate-y-0.5 hover:border-primary/30',
              )}
            >
              <span className="text-xl">{p.emoji}</span>
              <span className="text-xs font-bold">{p.label}</span>
              <span className="text-[11px] text-muted-foreground">{p.desc}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4 rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Or pick a custom number</span>
            <span className="font-display text-2xl font-bold tabular-nums text-primary">{gameCount}</span>
          </div>
          <Slider value={[gameCount]} onValueChange={v => setGameCount(v[0])} min={3} max={35} step={1} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>3 games</span>
            <span>35 games</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.08] via-card to-brand-c/[0.08] p-5 text-center backdrop-blur-md">
          <Swords className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-2 font-display text-lg font-bold">{gameCount} Random Games</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
            Players compete across {gameCount} randomly selected game modes. The highest total score wins!
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Timer className="h-3.5 w-3.5 text-primary" /> ~{gameCount * 2} min estimated
          </div>
        </div>

        <Button size="lg" className="w-full gap-2 text-lg" onClick={handleStart} disabled={loading}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
          {loading ? 'Creating Room...' : 'Create Room'}
        </Button>
      </motion.div>
    </div>
  );
}
