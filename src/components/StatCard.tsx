import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import CountUp from '@/components/CountUp';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: string;
  hint?: string;
  delay?: number;
}

export default function StatCard({ label, value, icon: Icon, accent = 'text-primary', hint, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-black/25"
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-brand-a/10 to-brand-c/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-70" />
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-secondary/60">
          <Icon className={cn('h-5 w-5', accent)} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className={cn('font-display text-3xl font-bold tracking-tight tabular-nums', accent)}>
          <CountUp value={value} />
        </span>
        {hint && <span className="text-xs font-medium text-muted-foreground">{hint}</span>}
      </div>
    </motion.div>
  );
}
