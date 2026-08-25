import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { GameMode } from '@/lib/gameConfig';
import { cn } from '@/lib/utils';

interface GameCardProps {
  mode: GameMode;
  index: number;
}

export default function GameCard({ mode, index }: GameCardProps) {
  const navigate = useNavigate();

  return (
    <motion.button
      key={mode.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      onClick={() => navigate(`/play/${mode.id}`)}
      className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-5 text-left backdrop-blur-md transition-all duration-300 hover:border-primary/35 hover:shadow-xl hover:shadow-black/25"
    >
      <div className="absolute right-0 top-0 h-full w-full translate-x-1/2 bg-gradient-to-br from-brand-a/0 via-transparent to-brand-c/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex w-full items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-secondary/60 transition-all duration-300 group-hover:scale-110 group-hover:border-primary/30 group-hover:bg-primary/10">
          <mode.icon className={cn('h-6 w-6', mode.color)} />
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary group-hover:opacity-100" />
      </div>
      <div className="relative">
        <p className="font-display text-base font-bold tracking-tight">{mode.label}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{mode.description}</p>
      </div>
      <div className="relative flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/80">
        <span className="rounded-full border border-border/60 bg-secondary/50 px-2 py-0.5">{mode.rounds} rounds</span>
        {mode.timePerRound > 0 && (
          <span className="rounded-full border border-border/60 bg-secondary/50 px-2 py-0.5">{mode.timePerRound}s / round</span>
        )}
      </div>
    </motion.button>
  );
}
