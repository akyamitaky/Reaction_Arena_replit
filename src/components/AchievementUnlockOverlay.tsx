import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Medal, X } from 'lucide-react';
import type { AchievementDef } from '@/lib/achievements';
import { xpForAchievements } from '@/lib/achievements';
import { subscribeToUnlocks } from '@/hooks/useClaimAchievements';

interface QueuedUnlock {
  id: string;
  def: AchievementDef;
}

const UNLOCK_ICONS: Record<string, string> = {
  zap: '⚡',
  gamepad: '🎮',
  flame: '🔥',
  trophy: '🏆',
  star: '⭐',
  target: '🎯',
  swords: '⚔️',
  crown: '👑',
  calendar: '📅',
  link: '🔗',
};

const DISPLAY_MS = 4200;

/**
 * Center-stage celebration card for newly unlocked achievements. Rendered once
 * at the app root; listens to the unlock emitter from `claimAndCelebrate`.
 */
export default function AchievementUnlockOverlay() {
  const [queue, setQueue] = useState<QueuedUnlock[]>([]);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToUnlocks(unlocks => {
      const next: QueuedUnlock[] = unlocks.map(def => ({
        id: crypto.randomUUID?.() ?? `${def.id}-${Date.now()}`,
        def,
      }));
      setQueue(q => [...q, ...next]);
      for (const item of next) {
        const timer = window.setTimeout(() => {
          setQueue(q => q.filter(entry => entry.id !== item.id));
        }, DISPLAY_MS);
        timersRef.current.push(timer);
      }
    });
    return () => {
      unsubscribe();
      timersRef.current.forEach(id => window.clearTimeout(id));
    };
  }, []);

  const xp = xpForAchievements(queue.map(q => q.def));

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 px-4">
      <AnimatePresence>
        {queue.map(({ id, def }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, scale: 0.7, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -12 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-3xl border border-chart-1/40 bg-card/95 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-chart-1/20 blur-2xl" />
            <button
              onClick={() => setQueue(q => q.filter(entry => entry.id !== id))}
              aria-label="Dismiss"
              className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-chart-1/40 bg-chart-1/[0.12] text-3xl"
              >
                <span>{UNLOCK_ICONS[def.icon] ?? '🏆'}</span>
              </motion.div>
              <div className="flex-1">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-chart-1">
                  <Medal className="h-3.5 w-3.5" /> Achievement unlocked
                </p>
                <p className="mt-0.5 font-display text-xl font-bold tracking-tight">{def.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{def.description}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-bold tabular-nums text-primary">+{def.xp}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">XP</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {queue.length > 1 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur-md"
        >
          +{xp} XP total across {queue.length} unlocks
        </motion.p>
      )}
    </div>
  );
}
