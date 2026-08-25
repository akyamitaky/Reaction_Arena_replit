import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { gameModes } from '@/lib/gameConfig';
import { storage } from '@/lib/storage';
import GameCard from '@/components/GameCard';

export default function GameSelectPage() {
  const navigate = useNavigate();
  const name = storage.getPlayerName() || 'Player';

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
          <p className="mt-1 text-sm text-muted-foreground">Pick a game mode to start playing</p>
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
