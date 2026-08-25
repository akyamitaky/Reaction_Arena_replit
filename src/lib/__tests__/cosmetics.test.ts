import { describe, it, expect } from 'vitest';
import {
  allUnlocksForLevel,
  allUnlocksForXp,
  avatarForLevel,
  COSMETIC_UNLOCKS,
  frameForLevel,
  titleForLevel,
  unlocksAtLevel,
} from '@/lib/cosmetics';

describe('cosmetics', () => {
  it('starts everyone with the default avatar', () => {
    expect(avatarForLevel(1).emoji).toBe('🐣');
  });

  it('upgrades the avatar as levels rise', () => {
    expect(avatarForLevel(5).id).toBe('avatar_strategist');
    expect(avatarForLevel(16).id).toBe('avatar_legend');
  });

  it('keeps the highest unlocked avatar below the required level', () => {
    expect(avatarForLevel(4).id).toBe('avatar_sharpshooter');
    expect(avatarForLevel(6).id).toBe('avatar_strategist');
  });

  it('assigns the best unlocked frame and title', () => {
    expect(frameForLevel(4)?.id).toBe('frame_silver');
    expect(frameForLevel(10)?.id).toBe('frame_gold');
    expect(titleForLevel(2)?.id).toBe('title_fast');
    expect(titleForLevel(16)?.id).toBe('title_legend');
  });

  it('lists cosmetics unlocked so far and at a specific level', () => {
    expect(allUnlocksForLevel(1).length).toBeGreaterThan(0);
    expect(unlocksAtLevel(4).map(u => u.id)).toEqual(['frame_silver']);
    expect(
      unlocksAtLevel(16)
        .map(u => u.id)
        .sort(),
    ).toEqual(['title_legend', 'frame_legend'].sort());
  });

  it('derives unlock sets from XP via the level curve', () => {
    // 250 XP => level 2, so only level-1 and level-2 unlocks apply.
    expect(allUnlocksForXp(250).length).toBe(allUnlocksForLevel(2).length);
  });

  it('has monotonically increasing unlock levels', () => {
    const levels = COSMETIC_UNLOCKS.map(u => u.level);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1]);
    }
  });
});
