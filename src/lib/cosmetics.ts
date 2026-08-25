import { levelForXp } from './progress';

export type CosmeticType = 'avatar' | 'frame' | 'title';

export interface CosmeticUnlock {
  /** Level at which the cosmetic becomes available. */
  level: number;
  type: CosmeticType;
  id: string;
  label: string;
  /** Rendered as the avatar face (emoji). */
  emoji?: string;
  /** Ring/border color classes for the avatar frame. */
  frameClass?: string;
  /** Name suffix shown next to the player name. */
  titleSuffix?: string;
}

/**
 * Level-gated cosmetics. Kept small and deterministic so unlocks are easy to
 * test and to show off on the profile card.
 */
export const COSMETIC_UNLOCKS: CosmeticUnlock[] = [
  { level: 1, type: 'avatar', id: 'avatar_default', label: 'Rookie Avatar', emoji: '🐣' },
  { level: 2, type: 'title', id: 'title_fast', label: 'Fast Hands title', titleSuffix: '· Fast Hands' },
  { level: 3, type: 'avatar', id: 'avatar_sharpshooter', label: 'Sharpshooter Avatar', emoji: '🎯' },
  { level: 4, type: 'frame', id: 'frame_silver', label: 'Silver Frame', frameClass: 'border-slate-400/70' },
  { level: 5, type: 'avatar', id: 'avatar_strategist', label: 'Strategist Avatar', emoji: '🧠' },
  { level: 7, type: 'title', id: 'title_virtuoso', label: 'Virtuoso title', titleSuffix: '· Virtuoso' },
  { level: 8, type: 'avatar', id: 'avatar_virtuoso', label: 'Virtuoso Avatar', emoji: '🎼' },
  { level: 10, type: 'frame', id: 'frame_gold', label: 'Gold Frame', frameClass: 'border-chart-1/80' },
  { level: 12, type: 'avatar', id: 'avatar_legend', label: 'Legend Avatar', emoji: '🏆' },
  { level: 16, type: 'title', id: 'title_legend', label: 'Legend title', titleSuffix: '· Legend' },
  {
    level: 16,
    type: 'frame',
    id: 'frame_legend',
    label: 'Legend Frame',
    frameClass: 'border-chart-1 shadow-[0_0_12px_-2px] shadow-chart-1/60',
  },
];

export function avatarForLevel(level: number): CosmeticUnlock {
  const avatars = COSMETIC_UNLOCKS.filter(u => u.type === 'avatar' && u.level <= level);
  return avatars[avatars.length - 1] ?? COSMETIC_UNLOCKS[0];
}

export function frameForLevel(level: number): CosmeticUnlock | undefined {
  const frames = COSMETIC_UNLOCKS.filter(u => u.type === 'frame' && u.level <= level);
  return frames[frames.length - 1];
}

export function titleForLevel(level: number): CosmeticUnlock | undefined {
  const titles = COSMETIC_UNLOCKS.filter(u => u.type === 'title' && u.level <= level);
  return titles[titles.length - 1];
}

/** All cosmetics unlocked at the given level (sorted by unlock level). */
export function allUnlocksForLevel(level: number): CosmeticUnlock[] {
  return COSMETIC_UNLOCKS.filter(u => u.level <= level);
}

/** Cosmetics that become available exactly at this level (for celebration). */
export function unlocksAtLevel(level: number): CosmeticUnlock[] {
  return COSMETIC_UNLOCKS.filter(u => u.level === level);
}

/** Cosmetics available at the level implied by the given XP. */
export function allUnlocksForXp(xp: number): CosmeticUnlock[] {
  return allUnlocksForLevel(levelForXp(xp));
}
