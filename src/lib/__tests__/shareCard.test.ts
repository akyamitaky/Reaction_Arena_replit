import { describe, it, expect, afterEach, vi } from 'vitest';
import { buildSoloShareCard, buildArenaShareCard, buildJoinLink, gradeEmoji, shareResult } from '@/lib/shareCard';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('share card builders', () => {
  it('builds a solo card with grade, percentage and game name', () => {
    const text = buildSoloShareCard({ gameName: 'Color', score: 800, maxScore: 1500, grade: 'Sharp' });
    expect(text).toContain('Sharp');
    expect(text).toContain('Color');
    expect(text).toContain('800 pts');
    expect(text).toContain('53%');
    expect(text).toContain('ReactionArena');
  });

  it('uses the crown emoji for a legendary solo run', () => {
    expect(gradeEmoji('Legendary')).toBe('👑');
    expect(gradeEmoji('Keep Going')).toBe('🧠');
  });

  it('medals podium finishes in the arena card', () => {
    const first = buildArenaShareCard({ playerName: 'Ava', rank: 1, totalPlayers: 6, score: 900 });
    expect(first).toContain('🥇');
    expect(first).toContain('#1 of 6');

    const second = buildArenaShareCard({ playerName: 'Ava', rank: 2, totalPlayers: 6, score: 800 });
    expect(second).toContain('🥈');

    const fourth = buildArenaShareCard({ playerName: 'Ava', rank: 4, totalPlayers: 6, score: 400 });
    expect(fourth).toContain('4.');
  });

  it('builds a deep-link invite for a room code', () => {
    expect(buildJoinLink('AB3XY')).toContain('/join/AB3XY');
  });
});

describe('shareResult', () => {
  it('copies to the clipboard when share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const mode = await shareResult('hello');
    expect(mode).toBe('copied');
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('uses the native share sheet when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    const mode = await shareResult('hello', 'Title');
    expect(mode).toBe('shared');
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ text: 'hello', title: 'Title' }));
  });
});
