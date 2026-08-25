import { describe, it, expect } from 'vitest';
import {
  xpForGradePct,
  xpForArenaRank,
  levelForXp,
  levelTitle,
  levelProgress,
  gradeForPct,
  comboMultiplier,
  comboLabel,
  DAILY_XP,
  XP_PER_LEVEL,
} from '@/lib/progress';

describe('progress', () => {
  it('maps mastery percentage to XP rewards', () => {
    expect(xpForGradePct(95)).toBe(25);
    expect(xpForGradePct(90)).toBe(25);
    expect(xpForGradePct(70)).toBe(20);
    expect(xpForGradePct(50)).toBe(15);
    expect(xpForGradePct(25)).toBe(10);
    expect(xpForGradePct(10)).toBe(5);
  });

  it('maps arena rank to XP and ignores sub-2-player arenas', () => {
    expect(xpForArenaRank(1, 2)).toBe(30);
    expect(xpForArenaRank(2, 4)).toBe(20);
    expect(xpForArenaRank(3, 4)).toBe(15);
    expect(xpForArenaRank(4, 8)).toBe(10);
    expect(xpForArenaRank(1, 1)).toBe(0);
  });

  it('computes levels on a fixed XP curve', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(XP_PER_LEVEL - 1)).toBe(1);
    expect(levelForXp(XP_PER_LEVEL)).toBe(2);
    expect(levelForXp(XP_PER_LEVEL * 5)).toBe(6);
    expect(levelForXp(-50)).toBe(1);
  });

  it('assigns titles across the level bands', () => {
    expect(levelTitle(1)).toBe('Rookie');
    expect(levelTitle(3)).toBe('Contender');
    expect(levelTitle(5)).toBe('Sharpshooter');
    expect(levelTitle(8)).toBe('Strategist');
    expect(levelTitle(12)).toBe('Virtuoso');
    expect(levelTitle(20)).toBe('Legend');
  });

  it('reports progress within the current level', () => {
    const progress = levelProgress(250);
    expect(progress.level).toBe(2);
    expect(progress.into).toBe(50);
    expect(progress.needed).toBe(XP_PER_LEVEL);
    expect(progress.pct).toBe(25);
  });

  it('keeps the daily XP reward stable', () => {
    expect(DAILY_XP).toBe(20);
  });

  it('grades by percentage', () => {
    expect(gradeForPct(95)).toBe('Legendary');
    expect(gradeForPct(60)).toBe('Sharp');
    expect(gradeForPct(5)).toBe('Keep Going');
  });

  it('scales the combo multiplier with each hit and caps at 2.5x', () => {
    expect(comboMultiplier(1)).toBe(1);
    expect(comboMultiplier(2)).toBeCloseTo(1.15);
    expect(comboMultiplier(10)).toBeCloseTo(2.35);
    expect(comboMultiplier(11)).toBe(2.5);
    expect(comboMultiplier(50)).toBe(2.5);
  });

  it('renders compact combo labels', () => {
    expect(comboLabel(1)).toBe('');
    expect(comboLabel(2)).toBe('x1.1');
    expect(comboLabel(10)).toBe('x2.3');
    expect(comboLabel(15)).toBe('x2.5');
  });
});
