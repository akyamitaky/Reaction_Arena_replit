import { useEffect, useState } from 'react';
import {
  ACHIEVEMENT_BY_ID,
  achievementStateFromStorage,
  claimNewAchievements,
  type AchievementDef,
} from '@/lib/achievements';
import { syncAchievements } from '@/lib/profileApi';

type UnlockListener = (unlocks: AchievementDef[]) => void;

const listeners = new Set<UnlockListener>();

/** Register a listener for newly unlocked achievements (used by the overlay). */
export function subscribeToUnlocks(fn: UnlockListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function emitUnlocks(unlocks: AchievementDef[]) {
  if (unlocks.length === 0) return;
  for (const fn of listeners) fn(unlocks);
}

/**
 * Evaluates achievements against the current local state, celebrates (via the
 * unlock overlay) and syncs anything newly unlocked. Idempotent: each
 * achievement is only claimed once (persisted under `ra-achievements`), so this
 * can run freely on mount, on results screens, and after creating a challenge.
 */
export function claimAndCelebrate(): AchievementDef[] {
  const newly = claimNewAchievements(achievementStateFromStorage());
  if (newly.length === 0) return newly;
  syncAchievements(newly.map(a => a.id));
  emitUnlocks(newly);
  return newly;
}

/** Runs `claimAndCelebrate` whenever `deps` change; returns the latest unlocks. */
export function useClaimAchievements(deps: unknown[] = []): AchievementDef[] {
  const [justUnlocked, setJustUnlocked] = useState<AchievementDef[]>([]);

  useEffect(() => {
    const newly = claimAndCelebrate();
    if (newly.length > 0) setJustUnlocked(newly);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return justUnlocked;
}

/** Resolves achievement ids back to their definitions (used for UI lists). */
export function resolveAchievements(ids: string[]): AchievementDef[] {
  return ids.map(id => ACHIEVEMENT_BY_ID[id]).filter((a): a is AchievementDef => Boolean(a));
}
