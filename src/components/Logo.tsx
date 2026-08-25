import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-a to-brand-c opacity-60 blur-md" />
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl btn-primary-gradient shadow-lg shadow-[hsl(var(--brand-a)/0.35)]">
          <Zap className="h-5 w-5 text-primary-foreground" fill="currentColor" />
        </div>
      </div>
      <div className="leading-none">
        <p className="font-display text-lg font-bold tracking-tight">
          Reaction<span className="text-gradient">Arena</span>
        </p>
        <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Fast mind · sharp edge
        </p>
      </div>
    </div>
  );
}
