import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { gameModes } from '@/lib/gameConfig';
import ThemeToggle from '@/components/ThemeToggle';

export default function GameSelectPage() {
  const navigate = useNavigate();
  const name = localStorage.getItem('playerName') || 'Player';

  return (
    <div className="min-h-[100dvh] px-4 py-6 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[.2em] text-primary font-bold mb-1">Solo practice</p>
            <h1 className="text-2xl sm:text-3xl font-bold">Choose your edge, {name}</h1>
            <p className="text-muted-foreground text-sm">Choose a game mode to start playing</p>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {gameModes.map((mode, i) => (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => navigate(`/play/${mode.id}`)}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-border/70 bg-card/80 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg transition-all group text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                <mode.icon className={`w-6 h-6 ${mode.color}`} />
              </div>
              <span className="font-bold text-sm">{mode.label}</span>
              <span className="text-[11px] text-muted-foreground text-center leading-tight">{mode.description}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
