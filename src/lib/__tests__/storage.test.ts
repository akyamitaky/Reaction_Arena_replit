import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '@/lib/storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reads and writes the player name', () => {
    expect(storage.getPlayerName()).toBe('');
    storage.setPlayerName('Ada');
    expect(storage.getPlayerName()).toBe('Ada');
  });

  it('reads and writes the arena session', () => {
    storage.setPlayerId('player-1');
    storage.setPlayerToken('a'.repeat(64));
    storage.setRoomId('room-1');
    expect(storage.getPlayerId()).toBe('player-1');
    expect(storage.getPlayerToken()).toBe('a'.repeat(64));
    expect(storage.getRoomId()).toBe('room-1');
  });

  it('defaults the theme to dark and falls back to null when unset', () => {
    expect(storage.getTheme()).toBeNull();
    storage.setTheme('light');
    expect(storage.getTheme()).toBe('light');
  });

  it('records a solo game and tracks the best score', () => {
    storage.recordSoloGame(120);
    storage.recordSoloGame(90);
    const stats = storage.getStats();
    expect(stats.gamesPlayed).toBe(2);
    expect(stats.bestScore).toBe(120);
  });

  it('tracks per-mode best scores and run history for recap', () => {
    storage.recordSoloGame(120, 'math', 80);
    storage.recordSoloGame(90, 'math', 60);
    storage.recordSoloGame(150, 'reflex', 100);
    expect(storage.getBestScores()).toEqual({ math: 120, reflex: 150 });
    const history = storage.getRunHistory();
    expect(history).toHaveLength(3);
    expect(history[0]).toMatchObject({ gameId: 'math', score: 120, pct: 80 });
  });

  it('awards XP per game and level-ups accumulate', () => {
    storage.recordSoloGame(100, 'math', 100);
    storage.recordSoloGame(100, 'math', 100);
    expect(storage.getStats().xp).toBe(50);
  });

  it('records arenas and only counts wins when won', () => {
    storage.recordArena(false);
    storage.recordArena(true);
    const stats = storage.getStats();
    expect(stats.arenasPlayed).toBe(2);
    expect(stats.arenaWins).toBe(1);
  });

  it('awards arena XP by rank', () => {
    storage.recordArena(true, 1, 4);
    storage.recordArena(false, 4, 4);
    expect(storage.getStats().xp).toBe(40);
  });

  it('tracks weekly XP in a rolling ISO-week bucket', () => {
    storage.addXp(25);
    storage.addXp(20);
    storage.addXp(30);
    expect(storage.getWeeklyXp()).toBe(75);
    expect(storage.getStats().xp).toBe(75);
  });

  it('records the max combo and ignores smaller values', () => {
    storage.recordMaxCombo(5);
    storage.recordMaxCombo(8);
    storage.recordMaxCombo(3);
    expect(storage.getMaxCombo()).toBe(8);
  });
});
