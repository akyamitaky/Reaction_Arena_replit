import { cn } from '@/lib/utils';
import ArenaIcon from '@/components/ArenaIcon';

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <ArenaIcon className="h-9 w-9" />
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
