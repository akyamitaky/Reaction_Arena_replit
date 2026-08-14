import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Swords, Zap, Loader2 } from 'lucide-react';
import { createRoom } from '@/lib/arenaApi';
import { toast } from 'sonner';

const PRESETS = [
  { count: 5, label: 'Quick', emoji: '⚡', desc: '~10 min' },
  { count: 10, label: 'Standard', emoji: '🎯', desc: '~20 min' },
  { count: 15, label: 'Extended', emoji: '🔥', desc: '~30 min' },
  { count: 20, label: 'Marathon', emoji: '🏆', desc: '~40 min' },
  { count: 21, label: 'All Games', emoji: '💀', desc: '~40 min' },
];

export default function ArenaSetupPage() {
  const navigate = useNavigate();
  const [gameCount, setGameCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const name = localStorage.getItem('playerName') || 'Player';

  const handleStart = async () => {
    setLoading(true);
    try {
      const result = await createRoom({ hostName: name, gameCount });
      localStorage.setItem('playerId', result.playerId);
      localStorage.setItem('playerToken', result.playerToken);
      localStorage.setItem('roomId', result.roomId);
      navigate('/lobby', { state: { roomId: result.roomId, isHost: true } });
    } catch (e: any) {
      toast.error(e.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div className="w-full max-w-md space-y-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-2xl font-black">Setup Arena, {name}</h1>
            <p className="text-muted-foreground text-sm">Choose how many games to compete in</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {PRESETS.map(p => (
            <button
              key={p.count}
              onClick={() => setGameCount(p.count)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${gameCount === p.count ? 'border-primary bg-primary/10 shadow-md' : 'bg-card hover:border-primary/30'}`}
            >
              <span className="text-xl">{p.emoji}</span>
              <span className="text-xs font-bold">{p.label}</span>
              <span className="text-[10px] text-muted-foreground">{p.count} games</span>
            </button>
          ))}
        </div>

        <div className="space-y-3 p-5 rounded-2xl border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Or pick a custom number</span>
            <span className="text-2xl font-black text-primary tabular-nums">{gameCount}</span>
          </div>
          <Slider value={[gameCount]} onValueChange={v => setGameCount(v[0])} min={3} max={21} step={1} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>3 games</span>
            <span>21 games</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-secondary/30 space-y-2 text-center">
          <Swords className="w-8 h-8 text-primary mx-auto" />
          <p className="font-bold text-lg">{gameCount} Random Games</p>
          <p className="text-sm text-muted-foreground">
            Players compete across {gameCount} randomly selected game modes. The highest total score wins!
          </p>
        </div>

        <Button size="lg" className="w-full text-lg gap-2" onClick={handleStart} disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
          {loading ? 'Creating Room...' : 'Create Room'}
        </Button>
      </motion.div>
    </div>
  );
}
