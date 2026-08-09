import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowRight, CheckCircle } from 'lucide-react';

interface Props {
  lastGameName: string;
  lastGameScore: number;
  totalScore: number;
  gamesPlayed: number;
  totalGames: number;
  nextGameName: string;
  nextGameIcon?: React.ComponentType<{ className?: string }>;
  nextGameColor: string;
  onContinue: () => void;
}

export default function ArenaInterstitial({
  lastGameName, lastGameScore, totalScore,
  gamesPlayed, totalGames,
  nextGameName, nextGameIcon: NextIcon, nextGameColor,
  onContinue,
}: Props) {
  const pct = Math.round((gamesPlayed / totalGames) * 100);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-sm text-center space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Last game result */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto"
        >
          <CheckCircle className="w-8 h-8 text-green-600" />
        </motion.div>

        <div>
          <p className="text-sm text-muted-foreground">{lastGameName} complete!</p>
          <p className="text-3xl font-black mt-1">+{lastGameScore} pts</p>
        </div>

        {/* Progress & total */}
        <div className="p-5 rounded-2xl bg-card border space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Arena Progress</span>
            <span className="font-bold">{gamesPlayed}/{totalGames} games</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: `${Math.round(((gamesPlayed - 1) / totalGames) * 100)}%` }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="text-2xl font-black text-primary tabular-nums">{totalScore}</span>
            <span className="text-sm text-muted-foreground">total points</span>
          </div>
        </div>

        {/* Next game preview */}
        <div className="p-5 rounded-2xl bg-secondary/30 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Next Up</p>
          <div className="flex items-center justify-center gap-3">
            {NextIcon && (
              <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
                <NextIcon className={`w-5 h-5 ${nextGameColor}`} />
              </div>
            )}
            <span className="text-xl font-black">{nextGameName}</span>
          </div>
        </div>

        <Button size="lg" className="w-full text-lg gap-2" onClick={onContinue}>
          Continue <ArrowRight className="w-5 h-5" />
        </Button>
      </motion.div>
    </div>
  );
}
