import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trophy, RotateCcw, Home, ArrowRight } from 'lucide-react';

export default function ResultsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { score = 0, rounds = 0, gameId = '', gameName = '' } = state || {};
  const name = localStorage.getItem('playerName') || 'Player';
  const maxScore = rounds * 150;
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const grade = pct >= 90 ? '🏆 Legendary!' : pct >= 70 ? '🔥 Amazing!' : pct >= 50 ? '💪 Good Job!' : pct >= 25 ? '😊 Nice Try!' : '🎮 Keep Going!';

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-sm text-center space-y-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
        >
          <Trophy className="w-10 h-10 text-primary" />
        </motion.div>

        <div>
          <p className="text-muted-foreground">Well played, {name}!</p>
          <h1 className="text-4xl font-black mt-1">{grade}</h1>
        </div>

        <div className="p-6 rounded-2xl bg-card border space-y-3">
          <p className="text-sm text-muted-foreground">{gameName}</p>
          <p className="text-5xl font-black text-primary tabular-nums">{score}</p>
          <p className="text-sm text-muted-foreground">points</p>
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pct, 100)}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Button className="w-full gap-2" onClick={() => navigate(`/play/${gameId}`)}>
            <RotateCcw className="w-4 h-4" /> Play Again
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/select')}>
            <ArrowRight className="w-4 h-4" /> Try Another Mode
          </Button>
          <Button variant="ghost" className="w-full gap-2" onClick={() => navigate('/')}>
            <Home className="w-4 h-4" /> Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
