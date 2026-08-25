export const XP_PER_LEVEL = 200;

export const LEVEL_TITLES: { min: number; title: string }[] = [
  { min: 16, title: 'Legend' },
  { min: 12, title: 'Virtuoso' },
  { min: 8, title: 'Strategist' },
  { min: 5, title: 'Sharpshooter' },
  { min: 3, title: 'Contender' },
  { min: 1, title: 'Rookie' },
];

export const GRADES: { min: number; title: string }[] = [
  { min: 90, title: 'Legendary' },
  { min: 70, title: 'Amazing' },
  { min: 50, title: 'Sharp' },
  { min: 25, title: 'Warming Up' },
  { min: 0, title: 'Keep Going' },
];

export function gradeForPct(pct: number): string {
  return GRADES.find(g => pct >= g.min)?.title || GRADES[GRADES.length - 1].title;
}

/** XP for a solo game based on mastery percentage. */
export function xpForGradePct(pct: number): number {
  if (pct >= 90) return 25;
  if (pct >= 70) return 20;
  if (pct >= 50) return 15;
  if (pct >= 25) return 10;
  return 5;
}

/** Flat XP for completing the daily challenge. */
export const DAILY_XP = 20;

/** XP for an arena finish based on rank. Requires 2+ players to count. */
export function xpForArenaRank(rank: number, totalPlayers: number): number {
  if (totalPlayers < 2) return 0;
  if (rank <= 1) return 30;
  if (rank === 2) return 20;
  if (rank === 3) return 15;
  return 10;
}

export function levelForXp(xp: number): number {
  return Math.max(1, Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1);
}

export function levelTitle(level: number): string {
  return LEVEL_TITLES.find(t => level >= t.min)?.title || LEVEL_TITLES[LEVEL_TITLES.length - 1].title;
}

export function levelProgress(xp: number): {
  level: number;
  title: string;
  into: number;
  needed: number;
  pct: number;
} {
  const level = levelForXp(xp);
  const into = Math.max(0, xp) - (level - 1) * XP_PER_LEVEL;
  const pct = Math.min(100, Math.round((into / XP_PER_LEVEL) * 100));
  return { level, title: levelTitle(level), into, needed: XP_PER_LEVEL, pct };
}

/** Score multiplier for a running combo: +15% per hit, capped at 2.5x. */
export function comboMultiplier(combo: number): number {
  if (combo <= 1) return 1;
  return Math.min(1 + (combo - 1) * 0.15, 2.5);
}

/** Compact HUD label for the current combo, e.g. "x1.2". */
export function comboLabel(combo: number): string {
  const multiplier = comboMultiplier(combo);
  return multiplier === 1 ? '' : `x${multiplier.toFixed(1)}`;
}
