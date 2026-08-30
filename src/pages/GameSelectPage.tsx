import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { gameModes } from '@/lib/gameConfig';
import { storage } from '@/lib/storage';
import GameCard from '@/components/GameCard';

export default function GameSelectPage() {
  const navigate = useNavigate();
  const name = storage.getPlayerName() || 'Player';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > 9) return;
      const mode = gameModes[n - 1];
      if (mode) navigate(`/play/${mode.id}`);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 flex items-center gap-4"
      >
        <Button variant="outline" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Solo practice</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">Choose your edge, {name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            Pick a game mode to start playing
            <span className="hidden items-center gap-1 rounded-full border border-border/50 bg-card/50 px-2 py-0.5 text-[11px] text-muted-foreground sm:inline-flex">
              <Keyboard className="h-3 w-3" /> 1–9 to jump to a game
            </span>
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {gameModes.map((mode, i) => (
          <GameCard key={mode.id} mode={mode} index={i} />
        ))}
      </div>
    </div>
  );
}
